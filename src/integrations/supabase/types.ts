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
      clients: {
        Row: {
          cnpj_cpf: string
          created_at: string
          created_by: string | null
          email: string
          id: string
          nome_razao_social: string
          situacao: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cnpj_cpf: string
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          nome_razao_social: string
          situacao?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj_cpf?: string
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          nome_razao_social?: string
          situacao?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          client_id: string
          competencia: string
          created_at: string
          data_envio: string
          data_leitura: string | null
          file_url: string
          filename: string
          id: string
          pago: boolean
          updated_at: string
          uploaded_by: string
          valor_guia: number | null
          vencimento: string | null
        }
        Insert: {
          client_id: string
          competencia: string
          created_at?: string
          data_envio?: string
          data_leitura?: string | null
          file_url: string
          filename: string
          id?: string
          pago?: boolean
          updated_at?: string
          uploaded_by: string
          valor_guia?: number | null
          vencimento?: string | null
        }
        Update: {
          client_id?: string
          competencia?: string
          created_at?: string
          data_envio?: string
          data_leitura?: string | null
          file_url?: string
          filename?: string
          id?: string
          pago?: boolean
          updated_at?: string
          uploaded_by?: string
          valor_guia?: number | null
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deve_trocar_senha: boolean | null
          email: string
          id: string
          nome: string
          setor: Database["public"]["Enums"]["setor_contabilidade"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deve_trocar_senha?: boolean | null
          email: string
          id: string
          nome: string
          setor?: Database["public"]["Enums"]["setor_contabilidade"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deve_trocar_senha?: boolean | null
          email?: string
          id?: string
          nome?: string
          setor?: Database["public"]["Enums"]["setor_contabilidade"] | null
          updated_at?: string
        }
        Relationships: []
      }
      request_history: {
        Row: {
          changed_by: string
          created_at: string
          descricao: string | null
          id: string
          request_id: string
          tipo_mudanca: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          changed_by: string
          created_at?: string
          descricao?: string | null
          id?: string
          request_id: string
          tipo_mudanca: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          changed_by?: string
          created_at?: string
          descricao?: string | null
          id?: string
          request_id?: string
          tipo_mudanca?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_request_history"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_messages: {
        Row: {
          conteudo: string | null
          created_at: string
          file_url: string | null
          filename: string | null
          id: string
          request_id: string
          tipo_mensagem: string
          user_id: string
        }
        Insert: {
          conteudo?: string | null
          created_at?: string
          file_url?: string | null
          filename?: string | null
          id?: string
          request_id: string
          tipo_mensagem: string
          user_id: string
        }
        Update: {
          conteudo?: string | null
          created_at?: string
          file_url?: string | null
          filename?: string | null
          id?: string
          request_id?: string
          tipo_mensagem?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_request"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_ratings: {
        Row: {
          atendente_id: string
          client_id: string
          comentario: string | null
          created_at: string
          id: string
          rating: number
          request_id: string
        }
        Insert: {
          atendente_id: string
          client_id: string
          comentario?: string | null
          created_at?: string
          id?: string
          rating: number
          request_id: string
        }
        Update: {
          atendente_id?: string
          client_id?: string
          comentario?: string | null
          created_at?: string
          id?: string
          rating?: number
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_ratings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          assunto: string
          atendente_id: string | null
          client_id: string
          created_at: string
          descricao: string
          id: string
          protocol: string
          setor: Database["public"]["Enums"]["setor_contabilidade"]
          status: Database["public"]["Enums"]["status_solicitacao"]
          updated_at: string
        }
        Insert: {
          assunto: string
          atendente_id?: string | null
          client_id: string
          created_at?: string
          descricao: string
          id?: string
          protocol: string
          setor: Database["public"]["Enums"]["setor_contabilidade"]
          status?: Database["public"]["Enums"]["status_solicitacao"]
          updated_at?: string
        }
        Update: {
          assunto?: string
          atendente_id?: string | null
          client_id?: string
          created_at?: string
          descricao?: string
          id?: string
          protocol?: string
          setor?: Database["public"]["Enums"]["setor_contabilidade"]
          status?: Database["public"]["Enums"]["status_solicitacao"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      generate_protocol: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "colaborador" | "cliente"
      setor_contabilidade:
        | "fiscal"
        | "pessoal"
        | "contabil"
        | "controladoria"
        | "procuradoria"
      status_solicitacao: "aberto" | "em_atendimento" | "concluido"
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
      app_role: ["admin", "colaborador", "cliente"],
      setor_contabilidade: [
        "fiscal",
        "pessoal",
        "contabil",
        "controladoria",
        "procuradoria",
      ],
      status_solicitacao: ["aberto", "em_atendimento", "concluido"],
    },
  },
} as const
