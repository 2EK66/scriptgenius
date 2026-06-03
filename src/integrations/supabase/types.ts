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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      comic_sales: {
        Row: {
          amount: number
          buyer_id: string
          comic_id: string
          id: string
          payment_status: string | null
          premium_comic_id: string
          purchased_at: string | null
          seller_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          comic_id: string
          id?: string
          payment_status?: string | null
          premium_comic_id: string
          purchased_at?: string | null
          seller_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          comic_id?: string
          id?: string
          payment_status?: string | null
          premium_comic_id?: string
          purchased_at?: string | null
          seller_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comic_sales_comic_id_fkey"
            columns: ["comic_id"]
            isOneToOne: false
            referencedRelation: "comics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comic_sales_comic_id_fkey"
            columns: ["comic_id"]
            isOneToOne: false
            referencedRelation: "public_comics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comic_sales_premium_comic_id_fkey"
            columns: ["premium_comic_id"]
            isOneToOne: false
            referencedRelation: "premium_comics"
            referencedColumns: ["id"]
          },
        ]
      }
      comics: {
        Row: {
          allow_social_sharing: boolean | null
          art_style: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          id: string
          is_public: boolean | null
          likes_count: number | null
          panels: Json
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          allow_social_sharing?: boolean | null
          art_style?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          panels: Json
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          allow_social_sharing?: boolean | null
          art_style?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          panels?: Json
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number
          currency: string
          id: string
          notes: string | null
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          currency?: string
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          currency?: string
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string
          user_id?: string
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
      premium_comics: {
        Row: {
          comic_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          preview_panels: Json | null
          price: number
          sales_count: number | null
          total_revenue: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comic_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          preview_panels?: Json | null
          price: number
          sales_count?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comic_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          preview_panels?: Json | null
          price?: number
          sales_count?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_comics_comic_id_fkey"
            columns: ["comic_id"]
            isOneToOne: true
            referencedRelation: "comics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_comics_comic_id_fkey"
            columns: ["comic_id"]
            isOneToOne: true
            referencedRelation: "public_comics"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_scripts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          preview_content: string | null
          price: number
          sales_count: number
          script_id: string
          total_revenue: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          preview_content?: string | null
          price: number
          sales_count?: number
          script_id: string
          total_revenue?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          preview_content?: string | null
          price?: number
          sales_count?: number
          script_id?: string
          total_revenue?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_scripts_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: true
            referencedRelation: "public_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "premium_scripts_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: true
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_slots: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          is_used: boolean
          price_paid: number
          purchased_at: string
          slot_type: string
          used_for_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          is_used?: boolean
          price_paid: number
          purchased_at?: string
          slot_type: string
          used_for_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          is_used?: boolean
          price_paid?: number
          purchased_at?: string
          slot_type?: string
          used_for_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          last_generation_date: string | null
          scripts_generated_today: number | null
          scripts_generated_total: number | null
          subscription_end: string | null
          subscription_expires_at: string | null
          subscription_type: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          last_generation_date?: string | null
          scripts_generated_today?: number | null
          scripts_generated_total?: number | null
          subscription_end?: string | null
          subscription_expires_at?: string | null
          subscription_type?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_generation_date?: string | null
          scripts_generated_today?: number | null
          scripts_generated_total?: number | null
          subscription_end?: string | null
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
      script_sales: {
        Row: {
          amount: number
          buyer_id: string
          id: string
          payment_status: string
          premium_script_id: string
          purchased_at: string
          script_id: string
          seller_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          id?: string
          payment_status?: string
          premium_script_id: string
          purchased_at?: string
          script_id: string
          seller_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          id?: string
          payment_status?: string
          premium_script_id?: string
          purchased_at?: string
          script_id?: string
          seller_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "script_sales_premium_script_id_fkey"
            columns: ["premium_script_id"]
            isOneToOne: false
            referencedRelation: "premium_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_sales_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "public_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_sales_script_id_fkey"
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
          is_public: boolean | null
          likes_count: number | null
          status: string | null
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
          is_public?: boolean | null
          likes_count?: number | null
          status?: string | null
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
          is_public?: boolean | null
          likes_count?: number | null
          status?: string | null
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
          created_at: string
          description: string | null
          episode_count: number
          genre: string | null
          id: string
          is_published: boolean
          likes_count: number | null
          title: string
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          art_style?: string | null
          created_at?: string
          description?: string | null
          episode_count?: number
          genre?: string | null
          id?: string
          is_published?: boolean
          likes_count?: number | null
          title: string
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          art_style?: string | null
          created_at?: string
          description?: string | null
          episode_count?: number
          genre?: string | null
          id?: string
          is_published?: boolean
          likes_count?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      public_comics: {
        Row: {
          allow_social_sharing: boolean | null
          art_style: string | null
          author_avatar: string | null
          author_name: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          id: string | null
          is_public: boolean | null
          likes_count: number | null
          panels: Json | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Relationships: []
      }
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
      deactivate_expired_slots: { Args: never; Returns: number }
      get_available_slots: {
        Args: { p_slot_type: string; p_user_id: string }
        Returns: number
      }
      increment_premium_comic_stats: {
        Args: { comic_id_param: string; revenue_increment: number }
        Returns: undefined
      }
      increment_premium_script_stats: {
        Args: { revenue_increment: number; script_id_param: string }
        Returns: undefined
      }
      increment_view_count: {
        Args: { script_id_param: string }
        Returns: undefined
      }
      toggle_script_like: {
        Args: { script_id_param: string }
        Returns: boolean
      }
      use_premium_slot: {
        Args: { p_item_id: string; p_slot_type: string; p_user_id: string }
        Returns: string
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
