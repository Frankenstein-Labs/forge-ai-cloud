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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          budget_limit_tokens: number | null
          created_at: string
          expires_at: string | null
          hashed_key: string
          id: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Database["public"]["Enums"]["api_key_permission"]
          status: Database["public"]["Enums"]["api_key_status"]
          user_id: string
        }
        Insert: {
          budget_limit_tokens?: number | null
          created_at?: string
          expires_at?: string | null
          hashed_key: string
          id?: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Database["public"]["Enums"]["api_key_permission"]
          status?: Database["public"]["Enums"]["api_key_status"]
          user_id: string
        }
        Update: {
          budget_limit_tokens?: number | null
          created_at?: string
          expires_at?: string | null
          hashed_key?: string
          id?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Database["public"]["Enums"]["api_key_permission"]
          status?: Database["public"]["Enums"]["api_key_status"]
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount_eur: number
          created_at: string
          description: string | null
          id: string
          stripe_event_id: string | null
          tokens_added: number
          user_id: string
        }
        Insert: {
          amount_eur: number
          created_at?: string
          description?: string | null
          id?: string
          stripe_event_id?: string | null
          tokens_added?: number
          user_id: string
        }
        Update: {
          amount_eur?: number
          created_at?: string
          description?: string | null
          id?: string
          stripe_event_id?: string | null
          tokens_added?: number
          user_id?: string
        }
        Relationships: []
      }
      deployments: {
        Row: {
          catalog_model_id: string | null
          created_at: string
          deployed_at: string | null
          deployment_name: string
          endpoint_url: string | null
          id: string
          last_used_at: string | null
          region: string
          replicas: number
          status: Database["public"]["Enums"]["deployment_status"]
          tokens_consumed: number
          updated_at: string
          user_id: string
          user_model_id: string | null
        }
        Insert: {
          catalog_model_id?: string | null
          created_at?: string
          deployed_at?: string | null
          deployment_name: string
          endpoint_url?: string | null
          id?: string
          last_used_at?: string | null
          region?: string
          replicas?: number
          status?: Database["public"]["Enums"]["deployment_status"]
          tokens_consumed?: number
          updated_at?: string
          user_id: string
          user_model_id?: string | null
        }
        Update: {
          catalog_model_id?: string | null
          created_at?: string
          deployed_at?: string | null
          deployment_name?: string
          endpoint_url?: string | null
          id?: string
          last_used_at?: string | null
          region?: string
          replicas?: number
          status?: Database["public"]["Enums"]["deployment_status"]
          tokens_consumed?: number
          updated_at?: string
          user_id?: string
          user_model_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deployments_user_model_id_fkey"
            columns: ["user_model_id"]
            isOneToOne: false
            referencedRelation: "user_models"
            referencedColumns: ["id"]
          },
        ]
      }
      engine_events: {
        Row: {
          action: string
          created_at: string
          engine_id: string | null
          id: string
          message: string
          status: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          engine_id?: string | null
          id?: string
          message: string
          status?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          engine_id?: string | null
          id?: string
          message?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "engine_events_engine_id_fkey"
            columns: ["engine_id"]
            isOneToOne: false
            referencedRelation: "engines"
            referencedColumns: ["id"]
          },
        ]
      }
      engines: {
        Row: {
          cpu_cores: number
          created_at: string
          disk_gb: number
          id: string
          image: string
          last_started_at: string | null
          name: string
          price_per_hour: number
          ram_gb: number
          region: string
          status: string
          updated_at: string
          user_id: string
          vscode_url: string | null
        }
        Insert: {
          cpu_cores?: number
          created_at?: string
          disk_gb?: number
          id?: string
          image?: string
          last_started_at?: string | null
          name: string
          price_per_hour?: number
          ram_gb?: number
          region?: string
          status?: string
          updated_at?: string
          user_id: string
          vscode_url?: string | null
        }
        Update: {
          cpu_cores?: number
          created_at?: string
          disk_gb?: number
          id?: string
          image?: string
          last_started_at?: string | null
          name?: string
          price_per_hour?: number
          ram_gb?: number
          region?: string
          status?: string
          updated_at?: string
          user_id?: string
          vscode_url?: string | null
        }
        Relationships: []
      }
      marketplace_downloads: {
        Row: {
          created_at: string
          id: string
          model_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          model_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          model_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_downloads_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "marketplace_models"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_models: {
        Row: {
          author: string
          category: string
          created_at: string
          description: string
          downloads: number
          id: string
          is_public: boolean
          name: string
          price_eur: number
          size_bytes: number | null
          source: string
          source_url: string | null
          stars: number
          storage_path: string | null
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string
          category?: string
          created_at?: string
          description?: string
          downloads?: number
          id?: string
          is_public?: boolean
          name: string
          price_eur?: number
          size_bytes?: number | null
          source?: string
          source_url?: string | null
          stars?: number
          storage_path?: string | null
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string
          category?: string
          created_at?: string
          description?: string
          downloads?: number
          id?: string
          is_public?: boolean
          name?: string
          price_eur?: number
          size_bytes?: number | null
          source?: string
          source_url?: string | null
          stars?: number
          storage_path?: string | null
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          credits_balance: number
          email: string
          full_name: string | null
          id: string
          stripe_customer_id: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          credits_balance?: number
          email: string
          full_name?: string | null
          id: string
          stripe_customer_id?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          credits_balance?: number
          email?: string
          full_name?: string | null
          id?: string
          stripe_customer_id?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          api_key_id: string | null
          cost_eur: number
          created_at: string
          deployment_id: string | null
          id: string
          model_name: string
          tokens_input: number
          tokens_output: number
          user_id: string
        }
        Insert: {
          api_key_id?: string | null
          cost_eur?: number
          created_at?: string
          deployment_id?: string | null
          id?: string
          model_name: string
          tokens_input?: number
          tokens_output?: number
          user_id: string
        }
        Update: {
          api_key_id?: string | null
          cost_eur?: number
          created_at?: string
          deployment_id?: string | null
          id?: string
          model_name?: string
          tokens_input?: number
          tokens_output?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "deployments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_hf_config: {
        Row: {
          created_at: string
          label: string | null
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          label?: string | null
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          label?: string | null
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_models: {
        Row: {
          created_at: string
          id: string
          name: string
          size_bytes: number | null
          source: Database["public"]["Enums"]["model_source"]
          source_url: string | null
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          size_bytes?: number | null
          source: Database["public"]["Enums"]["model_source"]
          source_url?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          size_bytes?: number | null
          source?: Database["public"]["Enums"]["model_source"]
          source_url?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_mongo_config: {
        Row: {
          created_at: string
          token: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          token: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          token?: string
          updated_at?: string
          url?: string
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
      validate_api_key: {
        Args: { _hashed_key: string }
        Returns: {
          api_key_id: string
          budget_limit_tokens: number
          permissions: Database["public"]["Enums"]["api_key_permission"]
          user_id: string
        }[]
      }
    }
    Enums: {
      api_key_permission: "read_only" | "read_write" | "admin"
      api_key_status: "active" | "revoked" | "expired"
      app_role: "admin" | "developer" | "member"
      deployment_status:
        | "pending"
        | "deploying"
        | "active"
        | "stopped"
        | "failed"
      model_source: "huggingface" | "upload" | "url" | "finetuned" | "catalog"
      subscription_tier: "free" | "pro" | "business"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      api_key_permission: ["read_only", "read_write", "admin"],
      api_key_status: ["active", "revoked", "expired"],
      app_role: ["admin", "developer", "member"],
      deployment_status: [
        "pending",
        "deploying",
        "active",
        "stopped",
        "failed",
      ],
      model_source: ["huggingface", "upload", "url", "finetuned", "catalog"],
      subscription_tier: ["free", "pro", "business"],
    },
  },
} as const
