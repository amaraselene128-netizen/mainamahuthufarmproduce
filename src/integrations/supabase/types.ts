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
      ad_clicks: {
        Row: {
          ad_id: string
          clicked_at: string
          destination_url: string
          id: string
          user_id: string
        }
        Insert: {
          ad_id: string
          clicked_at?: string
          destination_url: string
          id?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          clicked_at?: string
          destination_url?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_views: {
        Row: {
          ad_id: string
          completed: boolean
          created_at: string
          fingerprint: string | null
          id: string
          ip: string | null
          reward_cents: number
          user_agent: string | null
          user_id: string
          watched_seconds: number
        }
        Insert: {
          ad_id: string
          completed?: boolean
          created_at?: string
          fingerprint?: string | null
          id?: string
          ip?: string | null
          reward_cents?: number
          user_agent?: string | null
          user_id: string
          watched_seconds: number
        }
        Update: {
          ad_id?: string
          completed?: boolean
          created_at?: string
          fingerprint?: string | null
          id?: string
          ip?: string | null
          reward_cents?: number
          user_agent?: string | null
          user_id?: string
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "ad_views_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
        ]
      }
      advertisements: {
        Row: {
          admin_notes: string | null
          advertiser_id: string
          approved_at: string | null
          budget_cents: number
          button_text: string
          country_targeting: string[]
          created_at: string
          description: string | null
          destination_url: string
          duration_seconds: number
          id: string
          spent_cents: number
          status: Database["public"]["Enums"]["ad_status"]
          title: string
          video_public_id: string | null
          video_url: string
          views_completed: number
          views_purchased: number
        }
        Insert: {
          admin_notes?: string | null
          advertiser_id: string
          approved_at?: string | null
          budget_cents: number
          button_text?: string
          country_targeting?: string[]
          created_at?: string
          description?: string | null
          destination_url: string
          duration_seconds: number
          id?: string
          spent_cents?: number
          status?: Database["public"]["Enums"]["ad_status"]
          title: string
          video_public_id?: string | null
          video_url: string
          views_completed?: number
          views_purchased?: number
        }
        Update: {
          admin_notes?: string | null
          advertiser_id?: string
          approved_at?: string | null
          budget_cents?: number
          button_text?: string
          country_targeting?: string[]
          created_at?: string
          description?: string | null
          destination_url?: string
          duration_seconds?: number
          id?: string
          spent_cents?: number
          status?: Database["public"]["Enums"]["ad_status"]
          title?: string
          video_public_id?: string | null
          video_url?: string
          views_completed?: number
          views_purchased?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          created_at: string
          name: string
          restricted: boolean
        }
        Insert: {
          code: string
          created_at?: string
          name: string
          restricted?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          name?: string
          restricted?: boolean
        }
        Relationships: []
      }
      device_fingerprints: {
        Row: {
          created_at: string
          fingerprint: string
          id: string
          ip_hash: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          fingerprint: string
          id?: string
          ip_hash?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          fingerprint?: string
          id?: string
          ip_hash?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fraud_reports: {
        Row: {
          created_at: string
          details: Json
          id: string
          level: Database["public"]["Enums"]["fraud_level"]
          resolved: boolean
          score: number
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          level: Database["public"]["Enums"]["fraud_level"]
          resolved?: boolean
          score?: number
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          level?: Database["public"]["Enums"]["fraud_level"]
          resolved?: boolean
          score?: number
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      market_campaigns: {
        Row: {
          attachments: string[]
          budget: number | null
          category: string
          clicks: number
          contact_email: string | null
          conversions: number
          created_at: string
          description: string
          end_date: string | null
          id: string
          instructions: string | null
          social_url: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_countries: string[]
          title: string
          updated_at: string
          user_id: string | null
          video_url: string | null
          views: number
          website_url: string | null
        }
        Insert: {
          attachments?: string[]
          budget?: number | null
          category: string
          clicks?: number
          contact_email?: string | null
          conversions?: number
          created_at?: string
          description: string
          end_date?: string | null
          id?: string
          instructions?: string | null
          social_url?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_countries?: string[]
          title: string
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
          views?: number
          website_url?: string | null
        }
        Update: {
          attachments?: string[]
          budget?: number | null
          category?: string
          clicks?: number
          contact_email?: string | null
          conversions?: number
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          instructions?: string | null
          social_url?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_countries?: string[]
          title?: string
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
          views?: number
          website_url?: string | null
        }
        Relationships: []
      }
      market_submissions: {
        Row: {
          category_slug: string | null
          created_at: string
          id: string
          link_type: Database["public"]["Enums"]["market_link_type"]
          notes: string | null
          status: string
          url: string
          user_id: string | null
        }
        Insert: {
          category_slug?: string | null
          created_at?: string
          id?: string
          link_type: Database["public"]["Enums"]["market_link_type"]
          notes?: string | null
          status?: string
          url: string
          user_id?: string | null
        }
        Update: {
          category_slug?: string | null
          created_at?: string
          id?: string
          link_type?: Database["public"]["Enums"]["market_link_type"]
          notes?: string | null
          status?: string
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          from_user: string | null
          id: string
          is_admin: boolean
          read: boolean
          subject: string | null
          to_user: string
        }
        Insert: {
          body: string
          created_at?: string
          from_user?: string | null
          id?: string
          is_admin?: boolean
          read?: boolean
          subject?: string | null
          to_user: string
        }
        Update: {
          body?: string
          created_at?: string
          from_user?: string | null
          id?: string
          is_admin?: boolean
          read?: boolean
          subject?: string | null
          to_user?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          details: Json
          id: string
          is_default: boolean
          provider: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          is_default?: boolean
          provider: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          is_default?: boolean
          provider?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_mode: Database["public"]["Enums"]["account_mode"]
          avatar_url: string | null
          banned: boolean
          bio: string | null
          country_code: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          referral_code: string | null
          referred_by: string | null
          skills: string[]
          social_links: Json
          suspended: boolean
          two_factor_enabled: boolean
          updated_at: string
          username: string
        }
        Insert: {
          account_mode?: Database["public"]["Enums"]["account_mode"]
          avatar_url?: string | null
          banned?: boolean
          bio?: string | null
          country_code?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          referral_code?: string | null
          referred_by?: string | null
          skills?: string[]
          social_links?: Json
          suspended?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          username: string
        }
        Update: {
          account_mode?: Database["public"]["Enums"]["account_mode"]
          avatar_url?: string | null
          banned?: boolean
          bio?: string | null
          country_code?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          referral_code?: string | null
          referred_by?: string | null
          skills?: string[]
          social_links?: Json
          suspended?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_clicks: {
        Row: {
          code: string
          created_at: string
          id: string
          ip_hash: string | null
          user_agent: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          user_agent?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      referral_earnings: {
        Row: {
          amount: number
          created_at: string
          id: string
          referral_id: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          referral_id?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          referral_id?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_earnings_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_plans: {
        Row: {
          active: boolean
          commission_rate: number
          features: Json
          id: string
          price: number
          tier: Database["public"]["Enums"]["referral_tier"]
        }
        Insert: {
          active?: boolean
          commission_rate: number
          features?: Json
          id?: string
          price: number
          tier: Database["public"]["Enums"]["referral_tier"]
        }
        Update: {
          active?: boolean
          commission_rate?: number
          features?: Json
          id?: string
          price?: number
          tier?: Database["public"]["Enums"]["referral_tier"]
        }
        Relationships: []
      }
      referral_subscriptions: {
        Row: {
          active: boolean
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "referral_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          referred_id: string | null
          referrer_id: string
          verified_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          referred_id?: string | null
          referrer_id: string
          verified_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          referred_id?: string | null
          referrer_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          admin_feedback: string | null
          created_at: string
          feedback: string | null
          hiring_id: string
          id: string
          rating: number
          satisfaction: number | null
          task_id: string
          worker_id: string | null
        }
        Insert: {
          admin_feedback?: string | null
          created_at?: string
          feedback?: string | null
          hiring_id: string
          id?: string
          rating: number
          satisfaction?: number | null
          task_id: string
          worker_id?: string | null
        }
        Update: {
          admin_feedback?: string | null
          created_at?: string
          feedback?: string | null
          hiring_id?: string
          id?: string
          rating?: number
          satisfaction?: number | null
          task_id?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          id: string
          is_admin: boolean
          sender_id: string | null
          ticket_id: string
        }
        Insert: {
          attachments?: Json
          body: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id?: string | null
          ticket_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          attachments: Json
          category: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json
          category?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json
          category?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_applications: {
        Row: {
          applied_at: string
          id: string
          proof_urls: string[]
          status: Database["public"]["Enums"]["application_status"]
          task_id: string
          worker_id: string
        }
        Insert: {
          applied_at?: string
          id?: string
          proof_urls?: string[]
          status?: Database["public"]["Enums"]["application_status"]
          task_id: string
          worker_id: string
        }
        Update: {
          applied_at?: string
          id?: string
          proof_urls?: string[]
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
          admin_comment: string | null
          application_id: string
          comments: string | null
          created_at: string
          files: Json
          id: string
          reviewed_at: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["submission_status"]
          task_id: string
          urls: string[]
          worker_id: string
        }
        Insert: {
          admin_comment?: string | null
          application_id: string
          comments?: string | null
          created_at?: string
          files?: Json
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          task_id: string
          urls?: string[]
          worker_id: string
        }
        Update: {
          admin_comment?: string | null
          application_id?: string
          comments?: string | null
          created_at?: string
          files?: Json
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          task_id?: string
          urls?: string[]
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "task_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          attachments: Json
          category: string | null
          category_group: string | null
          category_id: string | null
          created_at: string
          current_workers: number
          deadline: string | null
          description: string
          hiring_id: string
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
          attachments?: Json
          category?: string | null
          category_group?: string | null
          category_id?: string | null
          created_at?: string
          current_workers?: number
          deadline?: string | null
          description: string
          hiring_id: string
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
          attachments?: Json
          category?: string | null
          category_group?: string | null
          category_id?: string | null
          created_at?: string
          current_workers?: number
          deadline?: string | null
          description?: string
          hiring_id?: string
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
      tier_credit_ledger: {
        Row: {
          created_at: string
          delta_cents: number
          id: string
          ref_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta_cents: number
          id?: string
          ref_id?: string | null
          source: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta_cents?: number
          id?: string
          ref_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      tier_credits: {
        Row: {
          balance_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          details: Json | null
          id: string
          reference: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          details?: Json | null
          id?: string
          reference?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          details?: Json | null
          id?: string
          reference?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          available: number
          pending: number
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available?: number
          pending?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available?: number
          pending?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          approved_at: string | null
          created_at: string
          details: Json
          id: string
          method: string
          paid_at: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          created_at?: string
          details?: Json
          id?: string
          method: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          created_at?: string
          details?: Json
          id?: string
          method?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_to_task: {
        Args: { _task_id: string }
        Returns: {
          applied_at: string
          id: string
          proof_urls: string[]
          status: Database["public"]["Enums"]["application_status"]
          task_id: string
          worker_id: string
        }
        SetofOptions: {
          from: "*"
          to: "task_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      credit_ad_view: {
        Args: {
          p_ad_id: string
          p_fingerprint: string
          p_ip: string
          p_user_agent: string
          p_user_id: string
          p_watched: number
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      unlock_tier_from_credits: { Args: { p_tier: string }; Returns: Json }
    }
    Enums: {
      account_mode: "worker" | "hiring"
      ad_status: "pending" | "active" | "paused" | "rejected" | "depleted"
      app_role: "admin" | "moderator" | "user"
      application_status:
        | "joined"
        | "submitted"
        | "approved"
        | "rejected"
        | "revision"
      campaign_status:
        | "draft"
        | "pending"
        | "active"
        | "paused"
        | "completed"
        | "rejected"
      fraud_level: "low" | "medium" | "high" | "critical"
      market_link_type:
        | "youtube"
        | "tiktok"
        | "instagram"
        | "facebook"
        | "website"
        | "mobile_app"
        | "service"
      referral_tier: "bronze" | "silver" | "gold"
      submission_status: "pending" | "approved" | "rejected" | "revision"
      task_status: "active" | "taken" | "closed" | "paused"
      task_tier: "bronze" | "silver" | "gold"
      ticket_status: "open" | "pending" | "resolved" | "closed"
      withdrawal_status: "pending" | "approved" | "paid" | "rejected"
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
      account_mode: ["worker", "hiring"],
      ad_status: ["pending", "active", "paused", "rejected", "depleted"],
      app_role: ["admin", "moderator", "user"],
      application_status: [
        "joined",
        "submitted",
        "approved",
        "rejected",
        "revision",
      ],
      campaign_status: [
        "draft",
        "pending",
        "active",
        "paused",
        "completed",
        "rejected",
      ],
      fraud_level: ["low", "medium", "high", "critical"],
      market_link_type: [
        "youtube",
        "tiktok",
        "instagram",
        "facebook",
        "website",
        "mobile_app",
        "service",
      ],
      referral_tier: ["bronze", "silver", "gold"],
      submission_status: ["pending", "approved", "rejected", "revision"],
      task_status: ["active", "taken", "closed", "paused"],
      task_tier: ["bronze", "silver", "gold"],
      ticket_status: ["open", "pending", "resolved", "closed"],
      withdrawal_status: ["pending", "approved", "paid", "rejected"],
    },
  },
} as const
