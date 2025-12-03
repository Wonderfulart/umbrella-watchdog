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
      agents: {
        Row: {
          company_logo_url: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
        }
        Insert: {
          company_logo_url?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
        }
        Update: {
          company_logo_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
        }
        Relationships: []
      }
      automation_config: {
        Row: {
          created_at: string | null
          id: string
          last_assigned_agent_index: number | null
          make_connection_id: string | null
          make_scenario_id: string | null
          updated_at: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_assigned_agent_index?: number | null
          make_connection_id?: string | null
          make_scenario_id?: string | null
          updated_at?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_assigned_agent_index?: number | null
          make_connection_id?: string | null
          make_scenario_id?: string | null
          updated_at?: string | null
          webhook_url?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          make_execution_id: string | null
          policy_id: string
          recipient_email: string
          sent_at: string
          status: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          make_execution_id?: string | null
          policy_id: string
          recipient_email: string
          sent_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          make_execution_id?: string | null
          policy_id?: string
          recipient_email?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          email_type: string
          id: string
          is_default: boolean | null
          name: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          email_type: string
          id?: string
          is_default?: boolean | null
          name: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          email_type?: string
          id?: string
          is_default?: boolean | null
          name?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      form_fields: {
        Row: {
          conditional_logic: Json | null
          created_at: string | null
          default_value: string | null
          ezlynx_mapping: string | null
          field_type: Database["public"]["Enums"]["form_field_type"]
          grid_cols: number | null
          help_text: string | null
          id: string
          is_required: boolean | null
          label: string
          line_of_business:
            | Database["public"]["Enums"]["line_of_business"][]
            | null
          name: string
          options: Json | null
          placeholder: string | null
          section_id: string | null
          sort_order: number
          validation_rules: Json | null
        }
        Insert: {
          conditional_logic?: Json | null
          created_at?: string | null
          default_value?: string | null
          ezlynx_mapping?: string | null
          field_type?: Database["public"]["Enums"]["form_field_type"]
          grid_cols?: number | null
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          label: string
          line_of_business?:
            | Database["public"]["Enums"]["line_of_business"][]
            | null
          name: string
          options?: Json | null
          placeholder?: string | null
          section_id?: string | null
          sort_order?: number
          validation_rules?: Json | null
        }
        Update: {
          conditional_logic?: Json | null
          created_at?: string | null
          default_value?: string | null
          ezlynx_mapping?: string | null
          field_type?: Database["public"]["Enums"]["form_field_type"]
          grid_cols?: number | null
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          label?: string
          line_of_business?:
            | Database["public"]["Enums"]["line_of_business"][]
            | null
          name?: string
          options?: Json | null
          placeholder?: string | null
          section_id?: string | null
          sort_order?: number
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "form_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      form_sections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_collapsible: boolean | null
          is_expanded_default: boolean | null
          label: string
          line_of_business:
            | Database["public"]["Enums"]["line_of_business"][]
            | null
          name: string
          sort_order: number
          template_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_collapsible?: boolean | null
          is_expanded_default?: boolean | null
          label: string
          line_of_business?:
            | Database["public"]["Enums"]["line_of_business"][]
            | null
          name: string
          sort_order?: number
          template_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_collapsible?: boolean | null
          is_expanded_default?: boolean | null
          label?: string
          line_of_business?:
            | Database["public"]["Enums"]["line_of_business"][]
            | null
          name?: string
          sort_order?: number
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_sections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          created_at: string | null
          id: string
          policy_id: string | null
          status: string | null
          submission_data: Json
          submitted_at: string | null
          submitted_by: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          policy_id?: string | null
          status?: string | null
          submission_data?: Json
          submitted_at?: string | null
          submitted_by?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          policy_id?: string | null
          status?: string | null
          submission_data?: Json
          submitted_at?: string | null
          submitted_by?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_master: boolean | null
          line_of_business: Database["public"]["Enums"]["line_of_business"][]
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_master?: boolean | null
          line_of_business?: Database["public"]["Enums"]["line_of_business"][]
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_master?: boolean | null
          line_of_business?: Database["public"]["Enums"]["line_of_business"][]
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      policies: {
        Row: {
          agent_company_logo_url: string | null
          agent_email: string
          agent_first_name: string | null
          agent_last_name: string | null
          client_email: string
          client_first_name: string
          company_name: string
          created_at: string | null
          customer_number: string
          email1_sent: boolean | null
          email1_sent_date: string | null
          email2_sent: boolean | null
          email2_sent_date: string | null
          expiration_date: string
          id: string
          jotform_submitted: boolean | null
          policy_number: string
          submission_link: string
          updated_at: string | null
        }
        Insert: {
          agent_company_logo_url?: string | null
          agent_email: string
          agent_first_name?: string | null
          agent_last_name?: string | null
          client_email: string
          client_first_name: string
          company_name: string
          created_at?: string | null
          customer_number: string
          email1_sent?: boolean | null
          email1_sent_date?: string | null
          email2_sent?: boolean | null
          email2_sent_date?: string | null
          expiration_date: string
          id?: string
          jotform_submitted?: boolean | null
          policy_number: string
          submission_link: string
          updated_at?: string | null
        }
        Update: {
          agent_company_logo_url?: string | null
          agent_email?: string
          agent_first_name?: string | null
          agent_last_name?: string | null
          client_email?: string
          client_first_name?: string
          company_name?: string
          created_at?: string | null
          customer_number?: string
          email1_sent?: boolean | null
          email1_sent_date?: string | null
          email2_sent?: boolean | null
          email2_sent_date?: string | null
          expiration_date?: string
          id?: string
          jotform_submitted?: boolean | null
          policy_number?: string
          submission_link?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_cron_status: { Args: never; Returns: boolean }
      disable_email_cron: { Args: never; Returns: undefined }
      enable_email_cron: {
        Args: { p_anon_key: string; p_function_url: string; p_schedule: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "agent"
      form_field_type:
        | "text"
        | "select"
        | "date"
        | "checkbox"
        | "textarea"
        | "number"
        | "phone"
        | "email"
        | "ssn"
        | "vin"
        | "currency"
        | "radio"
        | "multiselect"
      line_of_business: "auto" | "home" | "dwelling" | "commercial"
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
      app_role: ["admin", "agent"],
      form_field_type: [
        "text",
        "select",
        "date",
        "checkbox",
        "textarea",
        "number",
        "phone",
        "email",
        "ssn",
        "vin",
        "currency",
        "radio",
        "multiselect",
      ],
      line_of_business: ["auto", "home", "dwelling", "commercial"],
    },
  },
} as const
