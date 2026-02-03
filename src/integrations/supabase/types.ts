export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_requests: {
        Row: {
          created_at: string
          founder_id: string
          id: string
          idea_id: string
          investor_id: string
          status: string | null
          founder_pinned: boolean | null
        }
        Insert: {
          created_at?: string
          founder_id: string
          id?: string
          idea_id: string
          investor_id: string
          status?: string | null
          founder_pinned?: boolean | null
        }
        Update: {
          created_at?: string
          founder_id?: string
          id?: string
          idea_id?: string
          investor_id?: string
          status?: string | null
          founder_pinned?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_requests_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_requests_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_requests_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          created_at: string
          description: string
          domain: string
          founder_id: string
          id: string
          investment_needed: number
          investment_received: number | null
          status: string | null
          title: string
          updated_at: string
          media_url?: string | null
          team_size?: string | null
          market_size?: string | null
          traction?: string | null
          linkedin_url?: string | null
          website_url?: string | null
        }
        Insert: {
          created_at?: string
          description: string
          domain: string
          founder_id: string
          id?: string
          investment_needed: number
          investment_received?: number | null
          status?: string | null
          title: string
          updated_at?: string
          media_url?: string | null
          team_size?: string | null
          market_size?: string | null
          traction?: string | null
          linkedin_url?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          domain?: string
          founder_id?: string
          id?: string
          investment_needed?: number
          investment_received?: number | null
          status?: string | null
          title?: string
          updated_at?: string
          media_url?: string | null
          team_size?: string | null
          market_size?: string | null
          traction?: string | null
          linkedin_url?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_records: {
        Row: {
          amount: number
          chat_request_id: string | null
          created_at: string
          founder_id: string
          id: string
          idea_id: string
          investor_id: string
          notes: string | null
          status: string
        }
        Insert: {
          amount: number
          chat_request_id?: string | null
          created_at?: string
          founder_id: string
          id?: string
          idea_id: string
          investor_id: string
          notes?: string | null
          status?: string
        }
        Update: {
          amount?: number
          chat_request_id?: string | null
          created_at?: string
          founder_id?: string
          id?: string
          idea_id?: string
          investor_id?: string
          notes?: string | null
          status?: string
        }
        Relationships: []
      }
      investor_ratings: {
        Row: {
          chat_request_id: string
          created_at: string
          founder_id: string
          id: string
          investor_id: string
          rating: boolean
          updated_at: string
        }
        Insert: {
          chat_request_id: string
          created_at?: string
          founder_id: string
          id?: string
          investor_id: string
          rating: boolean
          updated_at?: string
        }
        Update: {
          chat_request_id?: string
          created_at?: string
          founder_id?: string
          id?: string
          investor_id?: string
          rating?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_request_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
          is_read: boolean
        }
        Insert: {
          chat_request_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
          is_read?: boolean
        }
        Update: {
          chat_request_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          is_read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_request_id_fkey"
            columns: ["chat_request_id"]
            isOneToOne: false
            referencedRelation: "chat_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          id: string
          user_id: string
          profile_id: string | null
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          amount: number
          currency: string
          status: string
          idea_id: string | null
          created_at: string
          verified_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          profile_id?: string | null
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          amount: number
          currency?: string
          status?: string
          idea_id?: string | null
          created_at?: string
          verified_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string | null
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          amount?: number
          currency?: string
          status?: string
          idea_id?: string | null
          created_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_job: string | null
          dob: string | null
          domain: string | null
          education: string | null
          email: string
          experience: string | null
          id: string
          interested_domains: string[] | null
          investment_capital: number | null
          linkedin_profile: string | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_job?: string | null
          dob?: string | null
          domain?: string | null
          education?: string | null
          email: string
          experience?: string | null
          id?: string
          interested_domains?: string[] | null
          investment_capital?: number | null
          linkedin_profile?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_job?: string | null
          dob?: string | null
          domain?: string | null
          education?: string | null
          email: string
          experience?: string | null
          id?: string
          interested_domains?: string[] | null
          investment_capital?: number | null
          linkedin_profile?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: "founder" | "investor"
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
