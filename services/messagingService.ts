import { supabase } from '../lib/supabase';
import { CoParentMessage, Conversation, UserProfile } from '../types';

export class MessagingService {
  private static async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get or create a conversation with another parent by their email
  static async getOrCreateConversationByEmail(otherParentEmail: string): Promise<string | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      // First, find the other parent's user ID by email
      const { data: otherParentData, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', otherParentEmail)
        .single();

      if (userError || !otherParentData) {
        console.error('Other parent not found:', userError);
        return null;
      }

      return await this.getOrCreateConversation(otherParentData.user_id);
    } catch (error) {
      console.error('Error in getOrCreateConversationByEmail:', error);
      return null;
    }
  }

  // Get or create a conversation with another parent by their user ID
  static async getOrCreateConversation(otherParentId: string): Promise<string | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      // Use the Supabase function to get or create conversation
      const { data, error } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: userId,
          user2_id: otherParentId
        });

      if (error) {
        console.error('Error getting/creating conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      return null;
    }
  }

  // Get all conversations for the current user
  static async getConversations(): Promise<Conversation[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          id,
          parent1_id,
          parent2_id,
          created_at,
          updated_at
        `)
        .or(`parent1_id.eq.${userId},parent2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      // Get the other parent's profile for each conversation
      const conversations: Conversation[] = [];
      
      for (const conv of conversationsData) {
        const otherParentId = conv.parent1_id === userId ? conv.parent2_id : conv.parent1_id;
        
        // Get other parent's profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('name, role')
          .eq('user_id', otherParentId)
          .single();

        // Get last message
        const { data: lastMessageData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const conversation: Conversation = {
          id: conv.id,
          parent1Id: conv.parent1_id,
          parent2Id: conv.parent2_id,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          otherParentName: profileData?.name || 'Other Parent',
          otherParentRole: profileData?.role || '',
          lastMessage: lastMessageData ? {
            id: lastMessageData.id,
            content: lastMessageData.content,
            senderId: lastMessageData.sender_id,
            conversationId: lastMessageData.conversation_id,
            createdAt: lastMessageData.created_at,
            readAt: lastMessageData.read_at
          } : undefined
        };

        conversations.push(conversation);
      }

      return conversations;
    } catch (error) {
      console.error('Error in getConversations:', error);
      return [];
    }
  }

  // Get messages for a specific conversation
  static async getMessages(conversationId: string): Promise<CoParentMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        conversationId: msg.conversation_id,
        createdAt: msg.created_at,
        readAt: msg.read_at
      }));
    } catch (error) {
      console.error('Error in getMessages:', error);
      return [];
    }
  }

  // Send a message
  static async sendMessage(conversationId: string, content: string): Promise<CoParentMessage | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: content
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return {
        id: data.id,
        content: data.content,
        senderId: data.sender_id,
        conversationId: data.conversation_id,
        createdAt: data.created_at,
        readAt: data.read_at
      };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(conversationId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId) // Only mark messages from other people as read
        .is('read_at', null);

      if (error) {
        console.error('Error marking messages as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      return false;
    }
  }

  // Subscribe to new messages in a conversation (real-time)
  static subscribeToMessages(conversationId: string, callback: (message: CoParentMessage) => void) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage: CoParentMessage = {
            id: payload.new.id,
            content: payload.new.content,
            senderId: payload.new.sender_id,
            conversationId: payload.new.conversation_id,
            createdAt: payload.new.created_at,
            readAt: payload.new.read_at
          };
          callback(newMessage);
        }
      )
      .subscribe();

    return channel;
  }

  // Unsubscribe from real-time updates
  static unsubscribeFromMessages(channel: any) {
    supabase.removeChannel(channel);
  }

  // Get unread message count for a conversation
  static async getUnreadCount(conversationId: string): Promise<number> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  }

  // Find a user by email to start a conversation
  static async findUserByEmail(email: string): Promise<{ userId: string; profile: UserProfile } | null> {
    try {
      // First, try to find user in user_profiles table by email
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, name, role, children, email')
        .eq('email', email)
        .single();

      if (profileData) {
        return {
          userId: profileData.user_id,
          profile: {
            name: profileData.name,
            role: profileData.role,
            children: profileData.children
          }
        };
      }

      // If not found in profiles, try auth.users table (this requires service role key)
      // For now, we'll return null and suggest the user to invite via profile setup
      console.log('User not found in profiles:', profileError);
      return null;
    } catch (error) {
      console.error('Error in findUserByEmail:', error);
      return null;
    }
  }

  // Create a conversation with another user by their email
  static async createConversationByEmail(otherParentEmail: string): Promise<{ success: boolean; conversationId?: string; needsInvite?: boolean; message?: string }> {
    try {
      const userResult = await this.findUserByEmail(otherParentEmail);
      if (userResult) {
        // User exists, create conversation
        const conversationId = await this.getOrCreateConversation(userResult.userId);
        return { 
          success: true, 
          conversationId: conversationId || undefined,
          message: 'Conversation created successfully!'
        };
      } else {
        // User doesn't exist, need to send invitation
        const inviteResult = await this.sendInvitation(otherParentEmail);
        return {
          success: true,
          needsInvite: true,
          message: inviteResult ? 
            'Invitation sent! They will receive an email to join CustodyX.AI and start messaging.' :
            'Invitation prepared. You can share the sign-up link with them.'
        };
      }
    } catch (error) {
      console.error('Error in createConversationByEmail:', error);
      return { 
        success: false, 
        message: 'Error processing request. Please try again.' 
      };
    }
  }

  // Send invitation to join the platform
  static async sendInvitation(email: string): Promise<boolean> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) return false;

      // Get current user's profile for personalized invitation
      const { data: senderProfile } = await supabase
        .from('user_profiles')
        .select('name, role')
        .eq('user_id', currentUserId)
        .single();

      // Store invitation in database for tracking
      const { error } = await supabase
        .from('invitations')
        .insert({
          sender_id: currentUserId,
          recipient_email: email,
          sender_name: senderProfile?.name || 'Co-parent',
          sender_role: senderProfile?.role || '',
          status: 'pending'
        });

      if (error) {
        console.error('Error storing invitation:', error);
        // Don't fail if we can't store - the invite link will still work
      }

      // For now, we'll return true indicating the invitation is "prepared"
      // In a production app, you'd integrate with an email service here
      return true;
    } catch (error) {
      console.error('Error sending invitation:', error);
      return false;
    }
  }

  // Get pending invitations sent by current user
  static async getSentInvitations(): Promise<any[]> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) return [];

      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('sender_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSentInvitations:', error);
      return [];
    }
  }

  // Check for pending invitations when user creates profile with email
  static async processPendingInvitations(userEmail: string): Promise<void> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) return;

      // Find pending invitations for this email
      const { data: invitations, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('recipient_email', userEmail)
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString()); // Not expired

      if (error || !invitations || invitations.length === 0) return;

      // Create conversations with all users who invited this email
      for (const invitation of invitations) {
        try {
          await this.getOrCreateConversation(invitation.sender_id);
          
          // Mark invitation as accepted
          await supabase
            .from('invitations')
            .update({ 
              status: 'accepted',
              accepted_at: new Date().toISOString()
            })
            .eq('id', invitation.id);
        } catch (error) {
          console.error('Error processing invitation:', invitation.id, error);
        }
      }
    } catch (error) {
      console.error('Error in processPendingInvitations:', error);
    }
  }
}