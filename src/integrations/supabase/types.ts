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
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata_json: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata_json?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata_json?: Json
          user_id?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          created_at: string
          disciplines: Json
          id: string
          languages: Json
          last_synced_at: string | null
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          disciplines?: Json
          id?: string
          languages?: Json
          last_synced_at?: string | null
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          disciplines?: Json
          id?: string
          languages?: Json
          last_synced_at?: string | null
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          completed_at: string
          created_at: string
          duration_seconds: number
          id: string
          topic_id: string | null
          topic_label: string | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration_seconds: number
          id?: string
          topic_id?: string | null
          topic_label?: string | null
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          topic_id?: string | null
          topic_label?: string | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cognitive_profile: Json | null
          created_at: string
          current_plan: string | null
          display_name: string | null
          id: string
          level: number
          onboarding_completed: boolean
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          cognitive_profile?: Json | null
          created_at?: string
          current_plan?: string | null
          display_name?: string | null
          id?: string
          level?: number
          onboarding_completed?: boolean
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          cognitive_profile?: Json | null
          created_at?: string
          current_plan?: string | null
          display_name?: string | null
          id?: string
          level?: number
          onboarding_completed?: boolean
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      question_attempts: {
        Row: {
          ai_explanation: string | null
          chosen: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          user_id: string
        }
        Insert: {
          ai_explanation?: string | null
          chosen: string
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          user_id: string
        }
        Update: {
          ai_explanation?: string | null
          chosen?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          alternatives_json: Json | null
          choices: Json
          context: string | null
          correct_alternative: string | null
          correct_choice: string
          created_at: string
          difficulty: string
          discipline: string | null
          explanation: string | null
          files: Json | null
          id: string
          image_url: string | null
          index: number | null
          language: string
          source: string | null
          statement: string
          subject: string
          topic: string | null
          year: number | null
        }
        Insert: {
          alternatives_json?: Json | null
          choices: Json
          context?: string | null
          correct_alternative?: string | null
          correct_choice: string
          created_at?: string
          difficulty?: string
          discipline?: string | null
          explanation?: string | null
          files?: Json | null
          id?: string
          image_url?: string | null
          index?: number | null
          language?: string
          source?: string | null
          statement: string
          subject: string
          topic?: string | null
          year?: number | null
        }
        Update: {
          alternatives_json?: Json | null
          choices?: Json
          context?: string | null
          correct_alternative?: string | null
          correct_choice?: string
          created_at?: string
          difficulty?: string
          discipline?: string | null
          explanation?: string | null
          files?: Json | null
          id?: string
          image_url?: string | null
          index?: number | null
          language?: string
          source?: string | null
          statement?: string
          subject?: string
          topic?: string | null
          year?: number | null
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          created_at: string
          data_json: Json
          id: string
          is_active: boolean
          is_adaptive: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_json?: Json
          id?: string
          is_active?: boolean
          is_adaptive?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_json?: Json
          id?: string
          is_active?: boolean
          is_adaptive?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          details: Json | null
          finished_at: string | null
          id: string
          job: string
          started_at: string
          status: string
        }
        Insert: {
          details?: Json | null
          finished_at?: string | null
          id?: string
          job: string
          started_at?: string
          status: string
        }
        Update: {
          details?: Json | null
          finished_at?: string | null
          id?: string
          job?: string
          started_at?: string
          status?: string
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
