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
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          username: string,
          is_admin: boolean,
          can_distribute_kits: boolean
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: number
          inclusions: string[] | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          inclusions?: string[] | null
          name: string
          price: number
        }
        Update: {
          created_at?: string | null
          id?: number
          inclusions?: string[] | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      clusters: {
        Row: {
          created_at: string | null
          id: number
          ministry_id: number | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          ministry_id?: number | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          ministry_id?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "clusters_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      ministries: {
        Row: {
          created_at: string | null
          department_id: number | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          department_id?: number | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          department_id?: number | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministries_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          id: number
          name: string
          account_number: string
          qr_image_url: string | null
          account_type: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          account_number: string
          qr_image_url?: string | null
          account_type?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          account_number?: string
          qr_image_url?: string | null
          account_type?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          age: number | null
          category: string
          cluster: string | null
          created_at: string | null
          department: string | null
          email: string
          emergency_contact: string | null
          emergency_phone: string | null
          first_name: string
          gender: string | null
          id: string
          is_church_attendee: boolean | null
          last_name: string
          medical_conditions: string | null
          ministry: string | null
          payment_confirmed_by: string | null
          payment_date: string | null
          payment_method_id: number | null
          payment_notes: string | null
          payment_reference_number: string | null
          payment_status: string | null
          phone: string | null
          price: number
          registration_id: string
          status: string | null
          updated_at: string | null
          disclaimer_accepted?: string | null
        }
        Insert: {
          age?: number | null
          category: string
          cluster?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name: string
          gender?: string | null
          id?: string
          is_church_attendee?: boolean | null
          last_name: string
          medical_conditions?: string | null
          ministry?: string | null
          payment_confirmed_by?: string | null
          payment_date?: string | null
          payment_method_id?: number | null
          payment_notes?: string | null
          payment_reference_number?: string | null
          payment_status?: string | null
          phone?: string | null
          price: number
          registration_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          category?: string
          cluster?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          is_church_attendee?: boolean | null
          last_name?: string
          medical_conditions?: string | null
          ministry?: string | null
          payment_confirmed_by?: string | null
          payment_date?: string | null
          payment_method_id?: number | null
          payment_notes?: string | null
          payment_reference_number?: string | null
          payment_status?: string | null
          phone?: string | null
          price?: number
          registration_id?: string
          status?: string | null
          updated_at?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
