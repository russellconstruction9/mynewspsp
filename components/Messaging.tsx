import React, { useState, useRef, useEffect } from 'react';
import { CoParentMessage, UserProfile, Conversation } from '../types';
import { MessagingService } from '../services/messagingService';
import { supabase } from '../lib/supabase';
import { PaperAirplaneIcon, UserCircleIcon, ChatBubbleLeftRightIcon, PlusIcon } from './icons';

interface MessagingProps {
    userProfile: UserProfile | null;
}

const Messaging: React.FC<MessagingProps> = ({ userProfile }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<CoParentMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [otherParentEmail, setOtherParentEmail] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const realtimeChannelRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load current user ID and conversations on mount
    useEffect(() => {
        const loadUserAndConversations = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setCurrentUserId(user?.id || null);
                await loadConversations();
            } catch (error) {
                console.error('Error loading user:', error);
            }
        };
        loadUserAndConversations();
    }, []);

    // Subscribe to real-time updates when a conversation is selected
    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.id);
            
            // Subscribe to real-time messages
            realtimeChannelRef.current = MessagingService.subscribeToMessages(
                selectedConversation.id,
                (newMessage) => {
                    setMessages(prev => [...prev, newMessage]);
                    // Mark as read if not from current user
                    if (newMessage.senderId !== currentUserId) {
                        MessagingService.markMessagesAsRead(selectedConversation.id);
                    }
                }
            );
        }

        return () => {
            if (realtimeChannelRef.current) {
                MessagingService.unsubscribeFromMessages(realtimeChannelRef.current);
            }
        };
    }, [selectedConversation, userProfile]);

    const loadConversations = async () => {
        setLoading(true);
        try {
            const convs = await MessagingService.getConversations();
            setConversations(convs);
            if (convs.length > 0 && !selectedConversation) {
                setSelectedConversation(convs[0]);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversationId: string) => {
        try {
            const msgs = await MessagingService.getMessages(conversationId);
            setMessages(msgs);
            // Mark messages as read
            await MessagingService.markMessagesAsRead(conversationId);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !selectedConversation) return;

        try {
            const newMessage = await MessagingService.sendMessage(selectedConversation.id, input.trim());
            if (newMessage) {
                setMessages(prev => [...prev, newMessage]);
                setInput('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleNewConversation = async () => {
        if (!otherParentEmail.trim()) return;

        try {
            const result = await MessagingService.createConversationByEmail(otherParentEmail.trim());
            
            if (result.success) {
                if (result.conversationId) {
                    // User exists, conversation created
                    await loadConversations();
                    setShowNewConversation(false);
                    setOtherParentEmail('');
                    
                    // Find and select the new conversation
                    const updatedConversations = await MessagingService.getConversations();
                    const newConversation = updatedConversations.find(conv => conv.id === result.conversationId);
                    if (newConversation) {
                        setSelectedConversation(newConversation);
                    }
                } else if (result.needsInvite) {
                    // User doesn't exist, invitation sent
                    setShowNewConversation(false);
                    setOtherParentEmail('');
                    showInvitationSentDialog(result.message || 'Invitation sent!');
                }
                
                if (result.message) {
                    alert(result.message);
                }
            } else {
                alert(result.message || 'Error starting conversation. Please try again.');
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            alert('Error starting conversation. Please try again.');
        }
    };

    const showInvitationSentDialog = (message: string) => {
        const currentUrl = window.location.origin;
        const inviteText = `
${message}

You can also share this link with them directly:
${currentUrl}

They can sign up and you'll be able to start messaging once they create their profile with the email address: ${otherParentEmail}
        `.trim();
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(currentUrl).then(() => {
                alert(inviteText + '\n\n(Sign-up link copied to clipboard!)');
            }).catch(() => {
                alert(inviteText);
            });
        } else {
            alert(inviteText);
        }
    };

    // Current user ID is now tracked in component state

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-950 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading conversations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Conversations Sidebar */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                        <button
                            onClick={() => setShowNewConversation(true)}
                            className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                            title="Start new conversation"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                            <p className="text-sm">No conversations yet</p>
                            <button
                                onClick={() => setShowNewConversation(true)}
                                className="mt-2 text-blue-600 text-sm hover:underline"
                            >
                                Start your first conversation
                            </button>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                                    selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        <UserCircleIcon className="w-6 h-6 text-gray-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                            {conv.otherParentName}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {conv.otherParentRole && `${conv.otherParentRole} • `}
                                            {conv.lastMessage ? conv.lastMessage.content : 'No messages yet'}
                                        </p>
                                        {conv.lastMessage && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        <header className="p-4 sm:p-6 border-b border-gray-200 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <UserCircleIcon className="w-6 h-6 text-gray-500" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                                    {selectedConversation.otherParentName}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {selectedConversation.otherParentRole} • Messages are encrypted and secure
                                </p>
                            </div>
                        </header>

                        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                            {messages.length === 0 ? (
                                <div className="text-center py-24">
                                    <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-gray-300" />
                                    <h3 className="mt-4 text-xl font-semibold text-gray-900">Start the Conversation</h3>
                                    <p className="mt-2 text-base text-gray-500 max-w-md mx-auto">
                                        Send a message to begin your conversation with {selectedConversation.otherParentName}.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {messages.map(msg => {
                                        const isCurrentUser = msg.senderId === currentUserId;
                                        return (
                                            <div key={msg.id} className={`flex items-end gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-xl px-4 py-3 rounded-2xl ${
                                                    isCurrentUser 
                                                        ? 'bg-blue-950 text-white rounded-br-lg' 
                                                        : 'bg-gray-100 text-gray-900 rounded-bl-lg'
                                                }`}>
                                                    <p className="text-sm leading-6 whitespace-pre-wrap">{msg.content}</p>
                                                    <p className={`text-xs mt-2 text-right ${
                                                        isCurrentUser ? 'text-blue-300' : 'text-gray-500'
                                                    }`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { 
                                                            hour: 'numeric', 
                                                            minute: '2-digit' 
                                                        })}
                                                        {msg.readAt && isCurrentUser && (
                                                            <span className="ml-1">✓</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </main>

                        <footer className="p-4 bg-white border-t border-gray-200">
                            <div className="relative">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Type your message..."
                                    rows={1}
                                    className="w-full pl-4 pr-12 py-3 text-sm resize-none border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-150"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <button 
                                        onClick={handleSend} 
                                        disabled={!input.trim()} 
                                        className="p-2 text-white bg-blue-950 rounded-full hover:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors" 
                                        aria-label="Send message"
                                    >
                                        <PaperAirplaneIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </footer>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-gray-300" />
                            <h3 className="mt-4 text-xl font-semibold text-gray-900">Select a Conversation</h3>
                            <p className="mt-2 text-base text-gray-500">
                                Choose a conversation from the sidebar to start messaging.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* New Conversation Modal */}
            {showNewConversation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-2">Start New Conversation</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Enter the other parent's email address. If they don't have an account yet, we'll help you invite them.
                        </p>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Other Parent's Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={otherParentEmail}
                                onChange={(e) => setOtherParentEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="their.email@example.com"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && otherParentEmail.trim()) {
                                        handleNewConversation();
                                    }
                                }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                If they have an account, you'll start chatting immediately. If not, they'll get an invitation to join.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowNewConversation(false);
                                    setOtherParentEmail('');
                                }}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleNewConversation}
                                disabled={!otherParentEmail.trim()}
                                className="flex-1 px-4 py-2 text-white bg-blue-950 rounded-md hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messaging;