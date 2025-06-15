export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      audiobooks: {
        Row: {
          id: string;
          title: string;
          cover_image: string | null;
          duration: number;
          created_at: string;
          updated_at: string;
          status: 'draft' | 'processing' | 'completed';
          bookmarked: boolean;
          voice_id: string | null;
          text_content: string;
          audio_url: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          cover_image?: string | null;
          duration?: number;
          created_at?: string;
          updated_at?: string;
          status?: 'draft' | 'processing' | 'completed';
          bookmarked?: boolean;
          voice_id?: string | null;
          text_content: string;
          audio_url?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          cover_image?: string | null;
          duration?: number;
          created_at?: string;
          updated_at?: string;
          status?: 'draft' | 'processing' | 'completed';
          bookmarked?: boolean;
          voice_id?: string | null;
          text_content?: string;
          audio_url?: string | null;
          user_id?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          avatar_url: string | null;
          is_premium: boolean;
          created_books: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email: string;
          avatar_url?: string | null;
          is_premium?: boolean;
          created_books?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string;
          avatar_url?: string | null;
          is_premium?: boolean;
          created_books?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      voice_settings: {
        Row: {
          id: string;
          user_id: string;
          voice_id: string;
          pitch: number;
          speed: number;
          stability: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          voice_id: string;
          pitch?: number;
          speed?: number;
          stability?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          voice_id?: string;
          pitch?: number;
          speed?: number;
          stability?: number;
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
