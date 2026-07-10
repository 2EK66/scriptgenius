export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      comics: {
        Row: {
          art_style: string | null
          comic_panels: Json | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_premium: boolean
          is_public: boolean | null
          likes_count: number | null
          price_xof: number | null
          script_id: string | null
          status: string | null
          terms_accepted_at: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          art_style?: string | null
          comic_panels?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean
          is_public?: boolean | null
          likes_count?: number | null
          price_xof?: number | null
          script_id?: string | null
          status?: string | null
          terms_accepted_at?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          art_style?: string | null
          comic_panels?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean
          is_public?: boolean | null
          likes_count?: number | null
          price_xof?: number | null
          script_id?: string | null
          status?: string | null
          terms_accepted_at?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comics_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "public_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comics_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packages: {
        Row: {
          created_at: string
          credits: number
          currency: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits: number
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_cents: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          created_at: string
          credits: number
          description: string | null
          id: string
          payment_transaction_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          credits: number
          description?: string | null
          id?: string
          payment_transaction_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          credits?: number
          description?: string | null
          id?: string
          payment_transaction_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          comic_panels: Json | null
          created_at: string
          duration: number | null
          episode_number: number
          id: string
          is_free_preview: boolean
          is_premium: boolean
          like_count: number
          price_xof: number | null
          published_at: string | null
          script_content: string | null
          series_id: string
          status: string
          title: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          comic_panels?: Json | null
          created_at?: string
          duration?: number | null
          episode_number: number
          id?: string
          is_free_preview?: boolean
          is_premium?: boolean
          like_count?: number
          price_xof?: number | null
          published_at?: string | null
          script_content?: string | null
          series_id: string
          status?: string
          title?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          comic_panels?: Json | null
          created_at?: string
          duration?: number | null
          episode_number?: number
          id?: string
          is_free_preview?: boolean
          is_premium?: boolean
          like_count?: number
          price_xof?: number | null
          published_at?: string | null
          script_content?: string | null
          series_id?: string
          status?: string
          title?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "episodes_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      image_generations: {
        Row: {
          created_at: string
          credits_used: number | null
          id: string
          image_url: string
          model: string
          prompt: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          credits_used?: number | null
          id?: string
          image_url: string
          model: string
          prompt: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          credits_used?: number | null
          id?: string
          image_url?: string
          model?: string
          prompt?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          payment_id: string | null
          plan: string
          provider: string
          status: string
          transaction_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          payment_id?: string | null
          plan: string
          provider?: string
          status?: string
          transaction_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          payment_id?: string | null
          plan?: string
          provider?: string
          status?: string
          transaction_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      premium_slots: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          is_used: boolean | null
          price_paid: number
          purchased_at: string | null
          slot_type: string
          updated_at: string | null
          used_for_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          is_used?: boolean | null
          price_paid: number
          purchased_at?: string | null
          slot_type?: string
          updated_at?: string | null
          used_for_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          is_used?: boolean | null
          price_paid?: number
          purchased_at?: string | null
          slot_type?: string
          updated_at?: string | null
          used_for_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          credits_purchased_total: number | null
          credits_remaining: number | null
          credits_used_total: number | null
          email: string | null
          full_name: string | null
          id: string
          last_generation_date: string | null
          scripts_generated_today: number | null
          scripts_generated_total: number | null
          subscription_expires_at: string | null
          subscription_type: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          credits_purchased_total?: number | null
          credits_remaining?: number | null
          credits_used_total?: number | null
          email?: string | null
          full_name?: string | null
          id: string
          last_generation_date?: string | null
          scripts_generated_today?: number | null
          scripts_generated_total?: number | null
          subscription_expires_at?: string | null
          subscription_type?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          credits_purchased_total?: number | null
          credits_remaining?: number | null
          credits_used_total?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_generation_date?: string | null
          scripts_generated_today?: number | null
          scripts_generated_total?: number | null
          subscription_expires_at?: string | null
          subscription_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      script_likes: {
        Row: {
          created_at: string | null
          id: string
          script_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          script_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          script_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "script_likes_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "public_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_likes_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          age_range: string
          allow_social_sharing: boolean | null
          content: string
          created_at: string | null
          custom_idea: string | null
          genre: string
          id: string
          is_original: boolean | null
          is_premium: boolean
          is_public: boolean | null
          likes_count: number | null
          price_xof: number | null
          status: string | null
          terms_accepted_at: string | null
          theme: string
          title: string
          updated_at: string | null
          user_id: string | null
          view_count: number | null
          word_count: number | null
        }
        Insert: {
          age_range: string
          allow_social_sharing?: boolean | null
          content: string
          created_at?: string | null
          custom_idea?: string | null
          genre: string
          id?: string
          is_original?: boolean | null
          is_premium?: boolean
          is_public?: boolean | null
          likes_count?: number | null
          price_xof?: number | null
          status?: string | null
          terms_accepted_at?: string | null
          theme: string
          title: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
          word_count?: number | null
        }
        Update: {
          age_range?: string
          allow_social_sharing?: boolean | null
          content?: string
          created_at?: string | null
          custom_idea?: string | null
          genre?: string
          id?: string
          is_original?: boolean | null
          is_premium?: boolean
          is_public?: boolean | null
          likes_count?: number | null
          price_xof?: number | null
          status?: string | null
          terms_accepted_at?: string | null
          theme?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
          word_count?: number | null
        }
        Relationships: []
      }
      series: {
        Row: {
          art_style: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          id: string
          is_public: boolean | null
          likes_count: number | null
          title: string
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          art_style?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          art_style?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      public_scripts: {
        Row: {
          age_range: string | null
          allow_social_sharing: boolean | null
          author_avatar: string | null
          author_name: string | null
          content: string | null
          created_at: string | null
          custom_idea: string | null
          genre: string | null
          id: string | null
          is_public: boolean | null
          likes_count: number | null
          status: string | null
          theme: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
          word_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      increment_public_content_view: {
        Args: { p_content_id: string; p_source: string }
        Returns: number
      }
      toggle_public_content_like: {
        Args: { p_content_id: string; p_source: string }
        Returns: Json
      }
      use_premium_slot: {
        Args: { p_slot_id: string; p_used_for_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
