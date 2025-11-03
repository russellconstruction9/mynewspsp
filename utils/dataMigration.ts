import { supabase } from '../lib/supabase';
import { Report, UserProfile, StoredDocument, IncidentTemplate, CoParentMessage, SubscriptionTier, TokenUsage } from '../types';

// Migration utility to move localStorage data to Supabase
export class DataMigrationService {
  private static hasRun = false;

  // Main migration function - run once per user after authentication
  static async migrateUserData(userId: string): Promise<boolean> {
    if (this.hasRun) {
      console.log('Migration already completed for this session');
      return true;
    }

    console.log('Starting data migration for user:', userId);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Migration timeout after 10 seconds')), 10000);
    });

    try {
      return await Promise.race([this.performMigration(userId), timeoutPromise]);
    } catch (error) {
      console.error('Migration failed or timed out:', error);
      return false;
    }
  }

  private static async performMigration(userId: string): Promise<boolean> {
    let migrationSuccess = true;

    try {
      // Check if user already has data in Supabase
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingProfile) {
        console.log('User data already exists in Supabase, skipping migration');
        this.hasRun = true;
        return true;
      }

      // Migrate user profile
      await this.migrateUserProfile(userId);
      
      // Migrate reports
      await this.migrateReports(userId);
      
      // Migrate documents
      await this.migrateDocuments(userId);
      
      // Migrate incident templates
      await this.migrateIncidentTemplates(userId);
      
      // Migrate messages
      await this.migrateMessages(userId);
      
      // Migrate subscription data
      await this.migrateSubscriptionData(userId);

      console.log('Data migration completed successfully');
      this.hasRun = true;

      // Optionally clear localStorage after successful migration
      // this.clearLocalStorageData();

    } catch (error) {
      console.error('Migration failed:', error);
      migrationSuccess = false;
    }

    return migrationSuccess;
  }

  private static async migrateUserProfile(userId: string): Promise<void> {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (!savedProfile) return;

      const userProfile: UserProfile = JSON.parse(savedProfile);
      
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          name: userProfile.name,
          role: userProfile.role,
          children: userProfile.children,
        });

      if (error) throw error;
      console.log('User profile migrated successfully');
    } catch (error) {
      console.error('Failed to migrate user profile:', error);
      throw error;
    }
  }

  private static async migrateReports(userId: string): Promise<void> {
    try {
      const savedReports = localStorage.getItem('reports');
      if (!savedReports) return;

      const reports: Report[] = JSON.parse(savedReports);
      if (reports.length === 0) return;

      const reportsToInsert = reports.map(report => ({
        id: report.id,
        user_id: userId,
        content: report.content,
        category: report.category,
        tags: report.tags,
        legal_context: report.legalContext || null,
        images: report.images,
        created_at: report.createdAt,
      }));

      const { error } = await supabase
        .from('reports')
        .insert(reportsToInsert);

      if (error) throw error;
      console.log(`Migrated ${reports.length} reports successfully`);
    } catch (error) {
      console.error('Failed to migrate reports:', error);
      throw error;
    }
  }

  private static async migrateDocuments(userId: string): Promise<void> {
    try {
      const savedDocuments = localStorage.getItem('documents');
      if (!savedDocuments) return;

      const documents: StoredDocument[] = JSON.parse(savedDocuments);
      if (documents.length === 0) return;

      const documentsToInsert = documents.map(doc => ({
        id: doc.id,
        user_id: userId,
        name: doc.name,
        mime_type: doc.mimeType,
        data: doc.data,
        folder: doc.folder,
        structured_data: doc.structuredData || null,
        created_at: doc.createdAt,
      }));

      const { error } = await supabase
        .from('stored_documents')
        .insert(documentsToInsert);

      if (error) throw error;
      console.log(`Migrated ${documents.length} documents successfully`);
    } catch (error) {
      console.error('Failed to migrate documents:', error);
      throw error;
    }
  }

  private static async migrateIncidentTemplates(userId: string): Promise<void> {
    try {
      const savedTemplates = localStorage.getItem('incidentTemplates');
      if (!savedTemplates) return;

      const templates: IncidentTemplate[] = JSON.parse(savedTemplates);
      if (templates.length === 0) return;

      const templatesToInsert = templates.map(template => ({
        id: template.id,
        user_id: userId,
        title: template.title,
        content: template.content,
        category: template.category,
        tags: template.tags,
        legal_context: template.legalContext || null,
      }));

      const { error } = await supabase
        .from('incident_templates')
        .insert(templatesToInsert);

      if (error) throw error;
      console.log(`Migrated ${templates.length} incident templates successfully`);
    } catch (error) {
      console.error('Failed to migrate incident templates:', error);
      throw error;
    }
  }

  private static async migrateMessages(userId: string): Promise<void> {
    try {
      const savedMessages = localStorage.getItem('coParentingMessages');
      if (!savedMessages) return;

      const messages: CoParentMessage[] = JSON.parse(savedMessages);
      if (messages.length === 0) return;

      const messagesToInsert = messages.map(message => ({
        id: message.id,
        user_id: userId,
        text: message.text,
        sender_id: message.senderId,
        timestamp: message.timestamp,
      }));

      const { error } = await supabase
        .from('co_parent_messages')
        .insert(messagesToInsert);

      if (error) throw error;
      console.log(`Migrated ${messages.length} messages successfully`);
    } catch (error) {
      console.error('Failed to migrate messages:', error);
      throw error;
    }
  }

  private static async migrateSubscriptionData(userId: string): Promise<void> {
    try {
      const savedTier = localStorage.getItem('subscriptionTier') as SubscriptionTier | null;
      const savedUsage = localStorage.getItem('tokenUsage');

      const tier = savedTier || 'Free';
      let tokenUsage: TokenUsage;

      if (savedUsage) {
        tokenUsage = JSON.parse(savedUsage);
      } else {
        const nextReset = new Date();
        nextReset.setMonth(nextReset.getMonth() + 1);
        tokenUsage = { used: 0, resetDate: nextReset.toISOString() };
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier: tier,
          token_usage: tokenUsage.used,
          reset_date: tokenUsage.resetDate,
        });

      if (error) throw error;
      console.log('Migrated subscription data successfully');
    } catch (error) {
      console.error('Failed to migrate subscription data:', error);
      throw error;
    }
  }

  // Optional: Clear localStorage after successful migration
  private static clearLocalStorageData(): void {
    const keysToRemove = [
      'userProfile',
      'reports',
      'documents',
      'incidentTemplates',
      'coParentingMessages',
      'subscriptionTier',
      'tokenUsage'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('Local storage data cleared after migration');
  }

  // Force reset migration flag (useful for development)
  static resetMigrationFlag(): void {
    this.hasRun = false;
  }
}