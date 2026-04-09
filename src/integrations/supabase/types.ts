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
      admins: {
        Row: {
          created_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          user_email: string | null
          user_id: string | null
          user_ip: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          user_email?: string | null
          user_id?: string | null
          user_ip?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          user_email?: string | null
          user_id?: string | null
          user_ip?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          last_message_at: string | null
          listing_id: string | null
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          listing_id?: string | null
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          listing_id?: string | null
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          duration_days: number | null
          id: string
          listing_id: string
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          duration_days?: number | null
          id?: string
          listing_id: string
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          duration_days?: number | null
          id?: string
          listing_id?: string
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fun_circle_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fun_circle_comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "fun_circle_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      fun_circle_conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          participant_one: string
          participant_two: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_one: string
          participant_two: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_one?: string
          participant_two?: string
        }
        Relationships: []
      }
      fun_circle_friends: {
        Row: {
          addressee_id: string
          created_at: string | null
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friend_status"] | null
          updated_at: string | null
        }
        Insert: {
          addressee_id: string
          created_at?: string | null
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friend_status"] | null
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string
          created_at?: string | null
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friend_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fun_circle_mentions: {
        Row: {
          created_at: string | null
          id: string
          mentioned_user_id: string
          story_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          story_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fun_circle_mentions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "fun_circle_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      fun_circle_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fun_circle_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "fun_circle_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      fun_circle_stories: {
        Row: {
          content: string | null
          created_at: string | null
          expires_at: string
          id: string
          images: Json | null
          reactions_count: Json | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          images?: Json | null
          reactions_count?: Json | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          images?: Json | null
          reactions_count?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      fun_circle_story_reactions: {
        Row: {
          created_at: string | null
          id: string
          reaction_type: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reaction_type?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reaction_type?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fun_circle_story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "fun_circle_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          category: string | null
          created_at: string | null
          delivery_available: boolean | null
          description: string | null
          event_date: string | null
          event_end_date: string | null
          expires_at: string | null
          favorites_count: number | null
          id: string
          images: Json | null
          is_featured: boolean | null
          is_free: boolean | null
          is_negotiable: boolean | null
          is_sponsored: boolean | null
          latitude: number | null
          listing_type: Database["public"]["Enums"]["listing_type"] | null
          location: string | null
          longitude: number | null
          original_price: number | null
          price: number | null
          shop_id: string | null
          sponsored_until: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          subcategory: string | null
          title: string
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          delivery_available?: boolean | null
          description?: string | null
          event_date?: string | null
          event_end_date?: string | null
          expires_at?: string | null
          favorites_count?: number | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_negotiable?: boolean | null
          is_sponsored?: boolean | null
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          location?: string | null
          longitude?: number | null
          original_price?: number | null
          price?: number | null
          shop_id?: string | null
          sponsored_until?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          subcategory?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          delivery_available?: boolean | null
          description?: string | null
          event_date?: string | null
          event_end_date?: string | null
          expires_at?: string | null
          favorites_count?: number | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_negotiable?: boolean | null
          is_sponsored?: boolean | null
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          location?: string | null
          longitude?: number | null
          original_price?: number | null
          price?: number | null
          shop_id?: string | null
          sponsored_until?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          subcategory?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          is_verified: boolean | null
          location: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
          username: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      shop_ads: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_url: string | null
          position: string | null
          shop_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          position?: string | null
          shop_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          position?: string | null
          shop_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_ads_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_creation_requests: {
        Row: {
          admin_notes: string | null
          category: string | null
          created_at: string | null
          description: string | null
          facebook: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          location: string | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shop_name: string
          shop_slug: string
          status: string | null
          telegram: string | null
          tiktok: string | null
          twitter: string | null
          updated_at: string | null
          use_account_details: boolean | null
          user_id: string
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          admin_notes?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          location?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_name: string
          shop_slug: string
          status?: string | null
          telegram?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string | null
          use_account_details?: boolean | null
          user_id: string
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          location?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_name?: string
          shop_slug?: string
          status?: string | null
          telegram?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string | null
          use_account_details?: boolean | null
          user_id?: string
          whatsapp?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      shop_followers: {
        Row: {
          created_at: string | null
          id: string
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_followers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_promotion_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          duration_days: number | null
          id: string
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shop_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          duration_days?: number | null
          id?: string
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          duration_days?: number | null
          id?: string
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_promotion_requests_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          shop_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          shop_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          shop_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_reviews_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          facebook: string | null
          followers_count: number | null
          id: string
          instagram: string | null
          is_active: boolean | null
          is_promoted: boolean | null
          is_verified: boolean | null
          linkedin: string | null
          location: string | null
          logo_url: string | null
          name: string
          phone: string | null
          promoted_until: string | null
          rating: number | null
          slug: string | null
          telegram: string | null
          theme: string | null
          tiktok: string | null
          twitter: string | null
          updated_at: string | null
          user_id: string
          views_count: number | null
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          followers_count?: number | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_promoted?: boolean | null
          is_verified?: boolean | null
          linkedin?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          promoted_until?: string | null
          rating?: number | null
          slug?: string | null
          telegram?: string | null
          theme?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string | null
          user_id: string
          views_count?: number | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          followers_count?: number | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_promoted?: boolean | null
          is_verified?: boolean | null
          linkedin?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          promoted_until?: string | null
          rating?: number | null
          slug?: string | null
          telegram?: string | null
          theme?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      sponsor_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          duration_days: number | null
          id: string
          listing_id: string
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          duration_days?: number | null
          id?: string
          listing_id: string
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          duration_days?: number | null
          id?: string
          listing_id?: string
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      listings_public: {
        Row: {
          category: string | null
          created_at: string | null
          delivery_available: boolean | null
          description: string | null
          event_date: string | null
          event_end_date: string | null
          expires_at: string | null
          favorites_count: number | null
          id: string | null
          images: Json | null
          is_featured: boolean | null
          is_free: boolean | null
          is_negotiable: boolean | null
          is_sponsored: boolean | null
          latitude: number | null
          listing_type: Database["public"]["Enums"]["listing_type"] | null
          location: string | null
          longitude: number | null
          original_price: number | null
          price: number | null
          shop_id: string | null
          sponsored_until: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          subcategory: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          views_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          delivery_available?: boolean | null
          description?: string | null
          event_date?: string | null
          event_end_date?: string | null
          expires_at?: string | null
          favorites_count?: number | null
          id?: string | null
          images?: Json | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_negotiable?: boolean | null
          is_sponsored?: boolean | null
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          location?: string | null
          longitude?: number | null
          original_price?: number | null
          price?: number | null
          shop_id?: string | null
          sponsored_until?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          subcategory?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          delivery_available?: boolean | null
          description?: string | null
          event_date?: string | null
          event_end_date?: string | null
          expires_at?: string | null
          favorites_count?: number | null
          id?: string | null
          images?: Json | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_negotiable?: boolean | null
          is_sponsored?: boolean | null
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          location?: string | null
          longitude?: number | null
          original_price?: number | null
          price?: number | null
          shop_id?: string | null
          sponsored_until?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          subcategory?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          is_verified: boolean | null
          location: string | null
          phone: string | null
          user_id: string | null
          username: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          is_verified?: boolean | null
          location?: string | null
          phone?: string | null
          user_id?: string | null
          username?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          is_verified?: boolean | null
          location?: string | null
          phone?: string | null
          user_id?: string | null
          username?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      are_friends: {
        Args: { _user_one: string; _user_two: string }
        Returns: boolean
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      friend_status: "pending" | "accepted" | "rejected"
      listing_status: "available" | "sold" | "draft" | "expired"
      listing_type: "product" | "service" | "event"
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
      app_role: ["admin", "moderator", "user"],
      friend_status: ["pending", "accepted", "rejected"],
      listing_status: ["available", "sold", "draft", "expired"],
      listing_type: ["product", "service", "event"],
    },
  },
} as const
