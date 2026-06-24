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
      categories: {
        Row: {
          created_at: string
          display_order: number
          icon: string | null
          id: string
          name: string
          slug: string
          type: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          slug: string
          type?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          type?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          created_at: string
          is_restricted: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          is_restricted?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          is_restricted?: boolean
          name?: string
        }
        Relationships: []
      }
      market_submissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          status: string
          url: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          url: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          bio: string | null
          country_code: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_banned: boolean
          is_suspended: boolean
          is_verified: boolean
          skills: string[] | null
          social_links: Json | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_banned?: boolean
          is_suspended?: boolean
          is_verified?: boolean
          skills?: string[] | null
          social_links?: Json | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_banned?: boolean
          is_suspended?: boolean
          is_verified?: boolean
          skills?: string[] | null
          social_links?: Json | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      task_applications: {
        Row: {
          applied_at: string
          id: string
          status: Database["public"]["Enums"]["application_status"]
          task_id: string
          worker_id: string
        }
        Insert: {
          applied_at?: string
          id?: string
          status?: Database["public"]["Enums"]["application_status"]
          task_id: string
          worker_id: string
        }
        Update: {
          applied_at?: string
          id?: string
          status?: Database["public"]["Enums"]["application_status"]
          task_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_applications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_submissions: {
        Row: {
          admin_comments: string | null
          application_id: string
          comments: string | null
          files: string[] | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          screenshots: string[] | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string
          urls: string[] | null
        }
        Insert: {
          admin_comments?: string | null
          application_id: string
          comments?: string | null
          files?: string[] | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshots?: string[] | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          urls?: string[] | null
        }
        Update: {
          admin_comments?: string | null
          application_id?: string
          comments?: string | null
          files?: string[] | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshots?: string[] | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          urls?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "task_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          attachments: Json | null
          category_id: string | null
          created_at: string
          current_workers: number
          deadline: string | null
          description: string
          hiring_party_id: string
          id: string
          instructions: string | null
          max_workers: number
          payment_amount: number
          requirements: string | null
          status: Database["public"]["Enums"]["task_status"]
          tier: Database["public"]["Enums"]["task_tier"]
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          category_id?: string | null
          created_at?: string
          current_workers?: number
          deadline?: string | null
          description: string
          hiring_party_id: string
          id?: string
          instructions?: string | null
          max_workers?: number
          payment_amount: number
          requirements?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          tier?: Database["public"]["Enums"]["task_tier"]
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          category_id?: string | null
          created_at?: string
          current_workers?: number
          deadline?: string | null
          description?: string
          hiring_party_id?: string
          id?: string
          instructions?: string | null
          max_workers?: number
          payment_amount?: number
          requirements?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          tier?: Database["public"]["Enums"]["task_tier"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          available_balance: number
          created_at: string
          id: string
          pending_balance: number
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          id?: string
          pending_balance?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          id?: string
          pending_balance?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "worker" | "hiring_party"
      app_role: "admin" | "user"
      application_status:
        | "pending"
        | "submitted"
        | "approved"
        | "rejected"
        | "revision_required"
      task_status: "active" | "taken" | "completed" | "closed"
      task_tier: "bronze" | "silver" | "gold"
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
    Enums: {
      account_type: ["worker", "hiring_party"],
      app_role: ["admin", "user"],
      application_status: [
        "pending",
        "submitted",
        "approved",
        "rejected",
        "revision_required",
      ],
      task_status: ["active", "taken", "completed", "closed"],
      task_tier: ["bronze", "silver", "gold"],
    },
  },
} as const
