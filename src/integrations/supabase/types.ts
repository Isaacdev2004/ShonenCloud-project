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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_announcements: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          message: string
          title: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          message: string
          title: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          message?: string
          title?: string
        }
        Relationships: []
      }
      arena_admin_messages: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          is_active: boolean
          message: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          updated_at?: string
        }
        Relationships: []
      }
      arena_posts: {
        Row: {
          created_at: string | null
          description: string
          id: string
          technique_name: string
          user_id: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          technique_name: string
          user_id: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          technique_name?: string
          user_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arena_posts_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "arena_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_zones: {
        Row: {
          created_at: string | null
          danger_level: number
          description: string | null
          energy_rate: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          danger_level?: number
          description?: string | null
          energy_rate?: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          danger_level?: number
          description?: string | null
          energy_rate?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      global_chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      global_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      mentor_change_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          current_mentor_id: string | null
          id: string
          requested_mentor_id: string
          slot: number
          status: string
          token_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          current_mentor_id?: string | null
          id?: string
          requested_mentor_id: string
          slot: number
          status?: string
          token_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          current_mentor_id?: string | null
          id?: string
          requested_mentor_id?: string
          slot?: number
          status?: string
          token_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_change_requests_current_mentor_id_fkey"
            columns: ["current_mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_change_requests_requested_mentor_id_fkey"
            columns: ["requested_mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_change_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          name?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          options: Json
          question: string
          type: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          options: Json
          question: string
          type: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          options?: Json
          question?: string
          type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      player_positions: {
        Row: {
          created_at: string | null
          id: string
          last_moved_at: string | null
          user_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_moved_at?: string | null
          user_id: string
          zone_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_moved_at?: string | null
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_positions_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "arena_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      player_targets: {
        Row: {
          created_at: string | null
          id: string
          target_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          target_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          target_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      private_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_note: string | null
          arena_status: string | null
          armor: number
          created_at: string
          current_pack: string | null
          discipline: Database["public"]["Enums"]["discipline_type"]
          email: string
          energy: number
          health: number
          id: string
          last_check_in: string | null
          last_mission_time: string | null
          last_sign_in: string | null
          level: number
          missions_executed: number
          pack_expires_at: string | null
          profile_picture_url: string
          tokens: number
          updated_at: string
          username: string
          xp_points: number
        }
        Insert: {
          admin_note?: string | null
          arena_status?: string | null
          armor?: number
          created_at?: string
          current_pack?: string | null
          discipline: Database["public"]["Enums"]["discipline_type"]
          email: string
          energy?: number
          health?: number
          id: string
          last_check_in?: string | null
          last_mission_time?: string | null
          last_sign_in?: string | null
          level?: number
          missions_executed?: number
          pack_expires_at?: string | null
          profile_picture_url: string
          tokens?: number
          updated_at?: string
          username: string
          xp_points?: number
        }
        Update: {
          admin_note?: string | null
          arena_status?: string | null
          armor?: number
          created_at?: string
          current_pack?: string | null
          discipline?: Database["public"]["Enums"]["discipline_type"]
          email?: string
          energy?: number
          health?: number
          id?: string
          last_check_in?: string | null
          last_mission_time?: string | null
          last_sign_in?: string | null
          level?: number
          missions_executed?: number
          pack_expires_at?: string | null
          profile_picture_url?: string
          tokens?: number
          updated_at?: string
          username?: string
          xp_points?: number
        }
        Relationships: []
      }
      store_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          level_requirement: number
          mentor_id: string | null
          name: string
          price: number
          technique_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          level_requirement?: number
          mentor_id?: string | null
          name: string
          price: number
          technique_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          level_requirement?: number
          mentor_id?: string | null
          name?: string
          price?: number
          technique_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_items_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_items_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      techniques: {
        Row: {
          cep: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          level_requirement: number
          mentor_id: string
          name: string
          price: number
          type_info: string
        }
        Insert: {
          cep: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          level_requirement?: number
          mentor_id: string
          name: string
          price: number
          type_info: string
        }
        Update: {
          cep?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          level_requirement?: number
          mentor_id?: string
          name?: string
          price?: number
          type_info?: string
        }
        Relationships: [
          {
            foreignKeyName: "techniques_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bans: {
        Row: {
          banned_at: string
          banned_by: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_at?: string
          banned_by: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_at?: string
          banned_by?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_mentors: {
        Row: {
          created_at: string
          id: string
          mentor_id: string
          slot: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_id: string
          slot: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mentor_id?: string
          slot?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mentors_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mentors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_purchases: {
        Row: {
          id: string
          purchased_at: string
          store_item_id: string
          user_id: string
        }
        Insert: {
          id?: string
          purchased_at?: string
          store_item_id: string
          user_id: string
        }
        Update: {
          id?: string
          purchased_at?: string
          store_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_store_item_id_fkey"
            columns: ["store_item_id"]
            isOneToOne: false
            referencedRelation: "store_items"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_techniques: {
        Row: {
          id: string
          learned_at: string
          technique_id: string
          user_id: string
        }
        Insert: {
          id?: string
          learned_at?: string
          technique_id: string
          user_id: string
        }
        Update: {
          id?: string
          learned_at?: string
          technique_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_techniques_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "techniques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_techniques_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_titles: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      world_mission_questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          image_url: string | null
          mission_id: string
          options: Json
          question: string
          question_order: number
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          image_url?: string | null
          mission_id: string
          options: Json
          question: string
          question_order: number
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          image_url?: string | null
          mission_id?: string
          options?: Json
          question?: string
          question_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "world_mission_questions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
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
      request_mentor_change: {
        Args: {
          p_current_mentor_id: string
          p_requested_mentor_id: string
          p_slot: number
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "member"
      discipline_type:
        | "Shadow"
        | "All-Seeing"
        | "Titan"
        | "Emperor"
        | "Finisher"
        | "Lightbringer"
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
      app_role: ["admin", "member"],
      discipline_type: [
        "Shadow",
        "All-Seeing",
        "Titan",
        "Emperor",
        "Finisher",
        "Lightbringer",
      ],
    },
  },
} as const
