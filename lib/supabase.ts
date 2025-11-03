import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types for your existing data structures
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          role: 'Mother' | 'Father' | '';
          children: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          role: 'Mother' | 'Father' | '';
          children: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          role?: 'Mother' | 'Father' | '';
          children?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          category: string;
          tags: string[];
          legal_context: string | null;
          images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          category: string;
          tags: string[];
          legal_context?: string | null;
          images: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          category?: string;
          tags?: string[];
          legal_context?: string | null;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      stored_documents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          mime_type: string;
          data: string;
          folder: string;
          structured_data: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          mime_type: string;
          data: string;
          folder: string;
          structured_data?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          mime_type?: string;
          data?: string;
          folder?: string;
          structured_data?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      incident_templates: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          category: string;
          tags: string[];
          legal_context: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          category: string;
          tags: string[];
          legal_context?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          category?: string;
          tags?: string[];
          legal_context?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      co_parent_messages: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          sender_id: string;
          timestamp: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          sender_id: string;
          timestamp: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          sender_id?: string;
          timestamp?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: 'Free' | 'Plus' | 'Pro';
          token_usage: number;
          reset_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier: 'Free' | 'Plus' | 'Pro';
          token_usage?: number;
          reset_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tier?: 'Free' | 'Plus' | 'Pro';
          token_usage?: number;
          reset_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}