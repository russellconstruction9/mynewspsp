import { supabase } from '../lib/supabase';
import { Report, UserProfile, StoredDocument, IncidentTemplate, CoParentMessage, SubscriptionTier, TokenUsage } from '../types';

// Data service that handles both localStorage and Supabase sync
export class DataService {
  private static async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // User Profile Management
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        // Fallback to localStorage for unauthenticated users
        const saved = localStorage.getItem('userProfile');
        return saved ? JSON.parse(saved) : null;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      const profile: UserProfile = {
        name: data.name,
        role: data.role,
        children: data.children,
        email: data.email,
      };

      // Keep localStorage in sync
      localStorage.setItem('userProfile', JSON.stringify(profile));
      return profile;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('userProfile');
      return saved ? JSON.parse(saved) : null;
    }
  }

  static async saveUserProfile(profile: UserProfile): Promise<boolean> {
    try {
      // Always save to localStorage first for immediate UI update
      localStorage.setItem('userProfile', JSON.stringify(profile));

      const userId = await this.getCurrentUserId();
      if (!userId) return true; // Work offline-first

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          name: profile.name,
          role: profile.role,
          children: profile.children,
          email: profile.email,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving user profile to Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveUserProfile:', error);
      return false;
    }
  }

  // Reports Management
  static async getReports(): Promise<Report[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        // Fallback to localStorage
        const saved = localStorage.getItem('reports');
        return saved ? JSON.parse(saved) : [];
      }

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        const saved = localStorage.getItem('reports');
        return saved ? JSON.parse(saved) : [];
      }

      const reports: Report[] = data.map(item => ({
        id: item.id,
        content: item.content,
        category: item.category,
        tags: item.tags,
        legalContext: item.legal_context,
        images: item.images,
        createdAt: item.created_at,
      }));

      // Keep localStorage in sync
      localStorage.setItem('reports', JSON.stringify(reports));
      return reports;
    } catch (error) {
      console.error('Error in getReports:', error);
      const saved = localStorage.getItem('reports');
      return saved ? JSON.parse(saved) : [];
    }
  }

  static async saveReport(report: Report): Promise<boolean> {
    try {
      // Update localStorage first
      const existingReports = await this.getReports();
      const updatedReports = [report, ...existingReports.filter(r => r.id !== report.id)];
      localStorage.setItem('reports', JSON.stringify(updatedReports));

      const userId = await this.getCurrentUserId();
      if (!userId) return true; // Work offline-first

      const { error } = await supabase
        .from('reports')
        .upsert({
          id: report.id,
          user_id: userId,
          content: report.content,
          category: report.category,
          tags: report.tags,
          legal_context: report.legalContext,
          images: report.images,
          created_at: report.createdAt,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving report to Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveReport:', error);
      return false;
    }
  }

  // Documents Management
  static async getDocuments(): Promise<StoredDocument[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        const saved = localStorage.getItem('documents');
        return saved ? JSON.parse(saved) : [];
      }

      const { data, error } = await supabase
        .from('stored_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        const saved = localStorage.getItem('documents');
        return saved ? JSON.parse(saved) : [];
      }

      const documents: StoredDocument[] = data.map(item => ({
        id: item.id,
        name: item.name,
        mimeType: item.mime_type,
        data: item.data,
        folder: item.folder,
        structuredData: item.structured_data,
        createdAt: item.created_at,
      }));

      localStorage.setItem('documents', JSON.stringify(documents));
      return documents;
    } catch (error) {
      console.error('Error in getDocuments:', error);
      const saved = localStorage.getItem('documents');
      return saved ? JSON.parse(saved) : [];
    }
  }

  static async saveDocument(document: StoredDocument): Promise<boolean> {
    try {
      const existingDocs = await this.getDocuments();
      const updatedDocs = [document, ...existingDocs.filter(d => d.id !== document.id)];
      localStorage.setItem('documents', JSON.stringify(updatedDocs));

      const userId = await this.getCurrentUserId();
      if (!userId) return true;

      const { error } = await supabase
        .from('stored_documents')
        .upsert({
          id: document.id,
          user_id: userId,
          name: document.name,
          mime_type: document.mimeType,
          data: document.data,
          folder: document.folder,
          structured_data: document.structuredData,
          created_at: document.createdAt,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving document to Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveDocument:', error);
      return false;
    }
  }

  static async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // Update localStorage first
      const existingDocs = await this.getDocuments();
      const updatedDocs = existingDocs.filter(d => d.id !== documentId);
      localStorage.setItem('documents', JSON.stringify(updatedDocs));

      const userId = await this.getCurrentUserId();
      if (!userId) return true;

      const { error } = await supabase
        .from('stored_documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting document from Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      return false;
    }
  }

  // Messaging will be handled by MessagingService - keeping this comment for reference
  
  // Subscription Management
  static async getSubscriptionData(): Promise<{ tier: SubscriptionTier; tokenUsage: TokenUsage }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        const savedTier = localStorage.getItem('subscriptionTier') as SubscriptionTier || 'Free';
        const savedUsage = localStorage.getItem('tokenUsage');
        const tokenUsage = savedUsage ? JSON.parse(savedUsage) : { used: 0, resetDate: new Date().toISOString() };
        return { tier: savedTier, tokenUsage };
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching subscription data:', error);
        const savedTier = localStorage.getItem('subscriptionTier') as SubscriptionTier || 'Free';
        const savedUsage = localStorage.getItem('tokenUsage');
        const tokenUsage = savedUsage ? JSON.parse(savedUsage) : { used: 0, resetDate: new Date().toISOString() };
        return { tier: savedTier, tokenUsage };
      }

      const tier = data.tier as SubscriptionTier;
      const tokenUsage: TokenUsage = {
        used: data.token_usage,
        resetDate: data.reset_date,
      };

      // Keep localStorage in sync
      localStorage.setItem('subscriptionTier', tier);
      localStorage.setItem('tokenUsage', JSON.stringify(tokenUsage));

      return { tier, tokenUsage };
    } catch (error) {
      console.error('Error in getSubscriptionData:', error);
      const savedTier = localStorage.getItem('subscriptionTier') as SubscriptionTier || 'Free';
      const savedUsage = localStorage.getItem('tokenUsage');
      const tokenUsage = savedUsage ? JSON.parse(savedUsage) : { used: 0, resetDate: new Date().toISOString() };
      return { tier: savedTier, tokenUsage };
    }
  }

  static async updateSubscriptionTier(tier: SubscriptionTier): Promise<boolean> {
    try {
      localStorage.setItem('subscriptionTier', tier);

      const userId = await this.getCurrentUserId();
      if (!userId) return true;

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          tier: tier,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating subscription tier:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSubscriptionTier:', error);
      return false;
    }
  }

  static async updateTokenUsage(tokenUsage: TokenUsage): Promise<boolean> {
    try {
      localStorage.setItem('tokenUsage', JSON.stringify(tokenUsage));

      const userId = await this.getCurrentUserId();
      if (!userId) return true;

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          token_usage: tokenUsage.used,
          reset_date: tokenUsage.resetDate,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating token usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateTokenUsage:', error);
      return false;
    }
  }
}