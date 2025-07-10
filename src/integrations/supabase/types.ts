export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          game_id: string
          id: string
          message: string
          player_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          message: string
          player_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          message?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
        ]
      }
      chess_games: {
        Row: {
          black_time_remaining: number
          created_at: string
          current_player: string
          game_status: string
          id: string
          updated_at: string
          war_id: string
          white_time_remaining: number
          winner: string | null
        }
        Insert: {
          black_time_remaining?: number
          created_at?: string
          current_player?: string
          game_status?: string
          id?: string
          updated_at?: string
          war_id: string
          white_time_remaining?: number
          winner?: string | null
        }
        Update: {
          black_time_remaining?: number
          created_at?: string
          current_player?: string
          game_status?: string
          id?: string
          updated_at?: string
          war_id?: string
          white_time_remaining?: number
          winner?: string | null
        }
        Relationships: []
      }
      chess_moves: {
        Row: {
          board_state: Json
          captured_piece: string | null
          created_at: string
          from_col: number
          from_row: number
          id: string
          move_number: number
          piece_type: string
          player_color: string
          special_move: string | null
          to_col: number
          to_row: number
          war_id: string
        }
        Insert: {
          board_state: Json
          captured_piece?: string | null
          created_at?: string
          from_col: number
          from_row: number
          id?: string
          move_number: number
          piece_type: string
          player_color: string
          special_move?: string | null
          to_col: number
          to_row: number
          war_id: string
        }
        Update: {
          board_state?: Json
          captured_piece?: string | null
          created_at?: string
          from_col?: number
          from_row?: number
          id?: string
          move_number?: number
          piece_type?: string
          player_color?: string
          special_move?: string | null
          to_col?: number
          to_row?: number
          war_id?: string
        }
        Relationships: []
      }
      game_countries: {
        Row: {
          country_id: string
          game_id: string
          id: string
          player_id: string | null
          selected_at: string | null
        }
        Insert: {
          country_id: string
          game_id: string
          id?: string
          player_id?: string | null
          selected_at?: string | null
        }
        Update: {
          country_id?: string
          game_id?: string
          id?: string
          player_id?: string | null
          selected_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_countries_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_countries_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "public_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_countries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_invitations: {
        Row: {
          created_at: string
          expires_at: string
          game_id: string
          id: string
          invitee_email: string
          inviter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          game_id: string
          id?: string
          invitee_email: string
          inviter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          game_id?: string
          id?: string
          invitee_email?: string
          inviter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_invitations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_invitations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "public_games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          color: string
          game_id: string
          id: string
          is_host: boolean
          joined_at: string
          player_name: string
          player_order: number
          user_id: string
        }
        Insert: {
          color: string
          game_id: string
          id?: string
          is_host?: boolean
          joined_at?: string
          player_name: string
          player_order: number
          user_id: string
        }
        Update: {
          color?: string
          game_id?: string
          id?: string
          is_host?: boolean
          joined_at?: string
          player_name?: string
          player_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "public_games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          created_by: string
          current_player_turn: number | null
          deleted_at: string | null
          game_phase: string
          id: string
          is_public: boolean
          max_players: number
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_player_turn?: number | null
          deleted_at?: string | null
          game_phase?: string
          id?: string
          is_public?: boolean
          max_players?: number
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_player_turn?: number | null
          deleted_at?: string | null
          game_phase?: string
          id?: string
          is_public?: boolean
          max_players?: number
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_count: number
          action_type: string
          created_at: string
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          action_count?: number
          action_type: string
          created_at?: string
          id?: string
          user_id: string
          window_start?: string
        }
        Update: {
          action_count?: number
          action_type?: string
          created_at?: string
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      war_declarations: {
        Row: {
          attacking_country_id: string
          attacking_player_id: string
          created_at: string
          defending_country_id: string
          defending_player_id: string
          game_id: string
          id: string
          status: string
          updated_at: string
          winner_player_id: string | null
        }
        Insert: {
          attacking_country_id: string
          attacking_player_id: string
          created_at?: string
          defending_country_id: string
          defending_player_id: string
          game_id: string
          id?: string
          status?: string
          updated_at?: string
          winner_player_id?: string | null
        }
        Update: {
          attacking_country_id?: string
          attacking_player_id?: string
          created_at?: string
          defending_country_id?: string
          defending_player_id?: string
          game_id?: string
          id?: string
          status?: string
          updated_at?: string
          winner_player_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_games: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_player_turn: number | null
          deleted_at: string | null
          game_phase: string | null
          game_players: Json | null
          id: string | null
          is_public: boolean | null
          max_players: number | null
          name: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          _user_id: string
          _action_type: string
          _max_count: number
          _window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_old_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      log_audit_event: {
        Args: {
          _user_id: string
          _action_type: string
          _resource_type: string
          _resource_id?: string
          _details?: Json
        }
        Returns: undefined
      }
      validate_game_input: {
        Args: { _name: string; _max_players: number }
        Returns: boolean
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
