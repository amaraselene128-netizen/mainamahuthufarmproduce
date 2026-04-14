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
      admin_signal_details: {
        Row: {
          created_at: string
          exact_entry: number | null
          exact_exit: number | null
          hedge_fund_responders: string[] | null
          id: string
          intervention_end: string | null
          intervention_start: string | null
          retracement_start: number | null
          retracement_target: number | null
          signal_id: string | null
        }
        Insert: {
          created_at?: string
          exact_entry?: number | null
          exact_exit?: number | null
          hedge_fund_responders?: string[] | null
          id?: string
          intervention_end?: string | null
          intervention_start?: string | null
          retracement_start?: number | null
          retracement_target?: number | null
          signal_id?: string | null
        }
        Update: {
          created_at?: string
          exact_entry?: number | null
          exact_exit?: number | null
          hedge_fund_responders?: string[] | null
          id?: string
          intervention_end?: string | null
          intervention_start?: string | null
          retracement_start?: number | null
          retracement_target?: number | null
          signal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_signal_details_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trade_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      aviator_rounds: {
        Row: {
          bet_amount: number
          cashout_multiplier: number | null
          crash_point: number
          created_at: string | null
          id: string
          payout: number
          user_id: string
          won: boolean
        }
        Insert: {
          bet_amount: number
          cashout_multiplier?: number | null
          crash_point: number
          created_at?: string | null
          id?: string
          payout?: number
          user_id: string
          won?: boolean
        }
        Update: {
          bet_amount?: number
          cashout_multiplier?: number | null
          crash_point?: number
          created_at?: string | null
          id?: string
          payout?: number
          user_id?: string
          won?: boolean
        }
        Relationships: []
      }
      candle_templates: {
        Row: {
          close: number
          day_number: number
          high: number
          id: string
          low: number
          minute_offset: number
          open: number
        }
        Insert: {
          close: number
          day_number: number
          high: number
          id?: string
          low: number
          minute_offset: number
          open: number
        }
        Update: {
          close?: number
          day_number?: number
          high?: number
          id?: string
          low?: number
          minute_offset?: number
          open?: number
        }
        Relationships: []
      }
      candles: {
        Row: {
          close: number
          created_at: string | null
          high: number
          id: string
          low: number
          open: number
          pair: string
          time: number
          timeframe: number
        }
        Insert: {
          close: number
          created_at?: string | null
          high: number
          id?: string
          low: number
          open: number
          pair: string
          time: number
          timeframe: number
        }
        Update: {
          close?: number
          created_at?: string | null
          high?: number
          id?: string
          low?: number
          open?: number
          pair?: string
          time?: number
          timeframe?: number
        }
        Relationships: []
      }
      casino_rounds: {
        Row: {
          bet_amount: number
          created_at: string | null
          game: string
          id: string
          payout: number
          result: Json | null
          user_id: string
        }
        Insert: {
          bet_amount: number
          created_at?: string | null
          game?: string
          id?: string
          payout?: number
          result?: Json | null
          user_id: string
        }
        Update: {
          bet_amount?: number
          created_at?: string | null
          game?: string
          id?: string
          payout?: number
          result?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          currency: string
          rate_from_kes: number
          updated_at: string
        }
        Insert: {
          currency: string
          rate_from_kes: number
          updated_at?: string
        }
        Update: {
          currency?: string
          rate_from_kes?: number
          updated_at?: string
        }
        Relationships: []
      }
      hedge_fund_interventions: {
        Row: {
          bias: number
          created_at: string
          creates_fvg: boolean
          direction: string
          fund_id: string
          fund_name: string
          id: string
          impact_duration_ms: number
          intervention_type: string
          message: string | null
          pair: string
        }
        Insert: {
          bias: number
          created_at?: string
          creates_fvg?: boolean
          direction: string
          fund_id: string
          fund_name: string
          id?: string
          impact_duration_ms?: number
          intervention_type: string
          message?: string | null
          pair: string
        }
        Update: {
          bias?: number
          created_at?: string
          creates_fvg?: boolean
          direction?: string
          fund_id?: string
          fund_name?: string
          id?: string
          impact_duration_ms?: number
          intervention_type?: string
          message?: string | null
          pair?: string
        }
        Relationships: []
      }
      hedge_fund_news: {
        Row: {
          created_at: string
          fund_id: string
          fund_name: string
          headline: string
          id: string
          impact: string
          is_surprise: boolean
          published: boolean
          scheduled_at: string
        }
        Insert: {
          created_at?: string
          fund_id: string
          fund_name: string
          headline: string
          id?: string
          impact: string
          is_surprise?: boolean
          published?: boolean
          scheduled_at: string
        }
        Update: {
          created_at?: string
          fund_id?: string
          fund_name?: string
          headline?: string
          id?: string
          impact?: string
          is_surprise?: boolean
          published?: boolean
          scheduled_at?: string
        }
        Relationships: []
      }
      live_prices: {
        Row: {
          base_price: number
          max_price: number
          min_price: number
          pip_size: number
          prev_price: number
          price: number
          symbol: string
          updated_at: string
          volatility: number
        }
        Insert: {
          base_price: number
          max_price?: number
          min_price?: number
          pip_size?: number
          prev_price: number
          price: number
          symbol: string
          updated_at?: string
          volatility?: number
        }
        Update: {
          base_price?: number
          max_price?: number
          min_price?: number
          pip_size?: number
          prev_price?: number
          price?: number
          symbol?: string
          updated_at?: string
          volatility?: number
        }
        Relationships: []
      }
      mining_servers: {
        Row: {
          class: string
          created_at: string
          description: string | null
          hash_rate: number
          id: string
          is_active: boolean
          is_minute_based: boolean | null
          name: string
          price_1h: number
          price_24h: number
          price_6h: number
          price_7d: number
          zrc_per_minute: number
        }
        Insert: {
          class: string
          created_at?: string
          description?: string | null
          hash_rate: number
          id?: string
          is_active?: boolean
          is_minute_based?: boolean | null
          name: string
          price_1h: number
          price_24h: number
          price_6h: number
          price_7d: number
          zrc_per_minute: number
        }
        Update: {
          class?: string
          created_at?: string
          description?: string | null
          hash_rate?: number
          id?: string
          is_active?: boolean
          is_minute_based?: boolean | null
          name?: string
          price_1h?: number
          price_24h?: number
          price_6h?: number
          price_7d?: number
          zrc_per_minute?: number
        }
        Relationships: []
      }
      mining_sessions: {
        Row: {
          created_at: string
          duration_hours: number
          expires_at: string
          id: string
          is_active: boolean
          last_ping_at: string | null
          price_paid: number
          server_id: string
          started_at: string
          total_mined: number
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_hours: number
          expires_at: string
          id?: string
          is_active?: boolean
          last_ping_at?: string | null
          price_paid: number
          server_id: string
          started_at?: string
          total_mined?: number
          user_id: string
        }
        Update: {
          created_at?: string
          duration_hours?: number
          expires_at?: string
          id?: string
          is_active?: boolean
          last_ping_at?: string | null
          price_paid?: number
          server_id?: string
          started_at?: string
          total_mined?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mining_sessions_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "mining_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      p2p_escrow: {
        Row: {
          buyer_confirmed: boolean
          buyer_id: string | null
          completed_at: string | null
          created_at: string
          fiat_amount: number
          fiat_currency: string
          id: string
          listing_id: string
          seller_confirmed: boolean
          seller_id: string
          status: string
          zrc_amount: number
        }
        Insert: {
          buyer_confirmed?: boolean
          buyer_id?: string | null
          completed_at?: string | null
          created_at?: string
          fiat_amount: number
          fiat_currency?: string
          id?: string
          listing_id: string
          seller_confirmed?: boolean
          seller_id: string
          status?: string
          zrc_amount: number
        }
        Update: {
          buyer_confirmed?: boolean
          buyer_id?: string | null
          completed_at?: string | null
          created_at?: string
          fiat_amount?: number
          fiat_currency?: string
          id?: string
          listing_id?: string
          seller_confirmed?: boolean
          seller_id?: string
          status?: string
          zrc_amount?: number
        }
        Relationships: []
      }
      p2p_messages: {
        Row: {
          created_at: string
          encrypted: boolean
          id: string
          message: string
          order_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          encrypted?: boolean
          id?: string
          message: string
          order_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          encrypted?: boolean
          id?: string
          message?: string
          order_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "p2p_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "p2p_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      p2p_orders: {
        Row: {
          buyer_code: string | null
          buyer_confirmed: boolean | null
          buyer_id: string | null
          created_at: string
          currency: string
          id: string
          payment_method: string
          price_per_zrc: number
          seller_code: string | null
          seller_confirmed: boolean | null
          seller_id: string
          status: string
          total_fiat: number
          updated_at: string
          zrc_amount: number
        }
        Insert: {
          buyer_code?: string | null
          buyer_confirmed?: boolean | null
          buyer_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string
          price_per_zrc: number
          seller_code?: string | null
          seller_confirmed?: boolean | null
          seller_id: string
          status?: string
          total_fiat: number
          updated_at?: string
          zrc_amount: number
        }
        Update: {
          buyer_code?: string | null
          buyer_confirmed?: boolean | null
          buyer_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string
          price_per_zrc?: number
          seller_code?: string | null
          seller_confirmed?: boolean | null
          seller_id?: string
          status?: string
          total_fiat?: number
          updated_at?: string
          zrc_amount?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number
          created_at: string | null
          display_name: string
          email: string | null
          id: string
          phone_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          display_name?: string
          email?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          display_name?: string
          email?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trade_positions: {
        Row: {
          amount: number
          closed_at: string | null
          direction: string
          entry_price: number
          exit_price: number | null
          id: string
          opened_at: string | null
          pair: string
          profit: number | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          closed_at?: string | null
          direction: string
          entry_price: number
          exit_price?: number | null
          id?: string
          opened_at?: string | null
          pair: string
          profit?: number | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          closed_at?: string | null
          direction?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          opened_at?: string | null
          pair?: string
          profit?: number | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_signals: {
        Row: {
          confidence: number
          created_at: string
          direction: string
          entry_price: number
          expires_at: string | null
          hedge_fund_activity: string | null
          id: string
          is_active: boolean
          liquidation_zone: Json | null
          pair: string
          reason: string | null
          risk_reward: number
          smc_context: string | null
          stop_loss: number
          take_profit: number
          timeframe: string
        }
        Insert: {
          confidence: number
          created_at?: string
          direction: string
          entry_price: number
          expires_at?: string | null
          hedge_fund_activity?: string | null
          id?: string
          is_active?: boolean
          liquidation_zone?: Json | null
          pair: string
          reason?: string | null
          risk_reward: number
          smc_context?: string | null
          stop_loss: number
          take_profit: number
          timeframe: string
        }
        Update: {
          confidence?: number
          created_at?: string
          direction?: string
          entry_price?: number
          expires_at?: string | null
          hedge_fund_activity?: string | null
          id?: string
          is_active?: boolean
          liquidation_zone?: Json | null
          pair?: string
          reason?: string | null
          risk_reward?: number
          smc_context?: string | null
          stop_loss?: number
          take_profit?: number
          timeframe?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_drawings: {
        Row: {
          created_at: string
          drawing_type: string
          id: string
          label: string | null
          pair: string
          points: Json
          price_points: Json
          timeframe: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drawing_type: string
          id?: string
          label?: string | null
          pair: string
          points?: Json
          price_points?: Json
          timeframe: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          drawing_type?: string
          id?: string
          label?: string | null
          pair?: string
          points?: Json
          price_points?: Json
          timeframe?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorite_pairs: {
        Row: {
          created_at: string | null
          id: string
          pair_symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pair_symbol: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pair_symbol?: string
          user_id?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          description: string | null
          fiat_amount: number | null
          id: string
          tx_type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          description?: string | null
          fiat_amount?: number | null
          id?: string
          tx_type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          description?: string | null
          fiat_amount?: number | null
          id?: string
          tx_type?: Database["public"]["Enums"]["wallet_tx_type"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string
          default_currency: string
          id: string
          total_mined: number
          total_purchased: number
          updated_at: string
          user_code: string
          user_id: string
          zrc_balance: number
        }
        Insert: {
          created_at?: string
          default_currency?: string
          id?: string
          total_mined?: number
          total_purchased?: number
          updated_at?: string
          user_code: string
          user_id: string
          zrc_balance?: number
        }
        Update: {
          created_at?: string
          default_currency?: string
          id?: string
          total_mined?: number
          total_purchased?: number
          updated_at?: string
          user_code?: string
          user_id?: string
          zrc_balance?: number
        }
        Relationships: []
      }
      zrc_wallets: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_aviator: {
        Row: {
          display_name: string | null
          highest_cashout: number | null
          total_profit: number | null
          total_rounds: number | null
          user_id: string | null
        }
        Relationships: []
      }
      leaderboard_casino: {
        Row: {
          biggest_win: number | null
          display_name: string | null
          total_profit: number | null
          total_rounds: number | null
          user_id: string | null
        }
        Relationships: []
      }
      leaderboard_trades: {
        Row: {
          biggest_win: number | null
          display_name: string | null
          total_profit: number | null
          total_trades: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_user_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_balance: {
        Args: { amount: number; uid: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      wallet_tx_type:
        | "purchase"
        | "mining"
        | "transfer_in"
        | "transfer_out"
        | "mining_server_payment"
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
      wallet_tx_type: [
        "purchase",
        "mining",
        "transfer_in",
        "transfer_out",
        "mining_server_payment",
      ],
    },
  },
} as const
