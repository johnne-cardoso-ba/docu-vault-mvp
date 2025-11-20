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
          atividade_principal: string | null
          bairro: string | null
          campos_customizados: Json | null
          cep: string | null
          cidade: string | null
          cnaes_secundarios: Json | null
          cnpj: string | null
          cnpj_cpf: string
          codigo_simples: string | null
          complemento: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          data_nascimento: string | null
          email: string
          estado: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          juceb_data_registro: string | null
          juceb_nire: string | null
          juceb_protocolo: string | null
          logradouro: string | null
          nome_razao_social: string
          nome_socio: string | null
          numero: string | null
          numero_iptu: string | null
          numero_titulo: string | null
          regime_tributario: string | null
          responsavel_legal: string | null
          situacao: string
          socios: Json | null
          telefone: string | null
          tem_acesso_nfse: boolean
          updated_at: string
        }
        Insert: {
          atividade_principal?: string | null
          bairro?: string | null
          campos_customizados?: Json | null
          cep?: string | null
          cidade?: string | null
          cnaes_secundarios?: Json | null
          cnpj?: string | null
          cnpj_cpf: string
          codigo_simples?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          data_nascimento?: string | null
          email: string
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          juceb_data_registro?: string | null
          juceb_nire?: string | null
          juceb_protocolo?: string | null
          logradouro?: string | null
          nome_razao_social: string
          nome_socio?: string | null
          numero?: string | null
          numero_iptu?: string | null
          numero_titulo?: string | null
          regime_tributario?: string | null
          responsavel_legal?: string | null
          situacao?: string
          socios?: Json | null
          telefone?: string | null
          tem_acesso_nfse?: boolean
          updated_at?: string
        }
        Update: {
          atividade_principal?: string | null
          bairro?: string | null
          campos_customizados?: Json | null
          cep?: string | null
          cidade?: string | null
          cnaes_secundarios?: Json | null
          cnpj?: string | null
          cnpj_cpf?: string
          codigo_simples?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          data_nascimento?: string | null
          email?: string
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          juceb_data_registro?: string | null
          juceb_nire?: string | null
          juceb_protocolo?: string | null
          logradouro?: string | null
          nome_razao_social?: string
          nome_socio?: string | null
          numero?: string | null
          numero_iptu?: string | null
          numero_titulo?: string | null
          regime_tributario?: string | null
          responsavel_legal?: string | null
          situacao?: string
          socios?: Json | null
          telefone?: string | null
          tem_acesso_nfse?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      collaborator_permissions: {
        Row: {
          can_delete_clients: boolean
          can_edit_client_situation: boolean
          can_manage_requests: boolean
          can_view_reports: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_delete_clients?: boolean
          can_edit_client_situation?: boolean
          can_manage_requests?: boolean
          can_view_reports?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_delete_clients?: boolean
          can_edit_client_situation?: boolean
          can_manage_requests?: boolean
          can_view_reports?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
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
      nfse_config: {
        Row: {
          aliquota_iss: number
          ambiente: string
          certificado_a1: string
          client_id: string | null
          cnae_fiscal: string
          codigo_tributacao_municipio: string
          created_at: string
          descricao_servico: string
          id: string
          inscricao_municipal: string
          item_lista_servico: string
          senha_certificado: string
          updated_at: string
        }
        Insert: {
          aliquota_iss?: number
          ambiente?: string
          certificado_a1: string
          client_id?: string | null
          cnae_fiscal: string
          codigo_tributacao_municipio: string
          created_at?: string
          descricao_servico: string
          id?: string
          inscricao_municipal: string
          item_lista_servico: string
          senha_certificado: string
          updated_at?: string
        }
        Update: {
          aliquota_iss?: number
          ambiente?: string
          certificado_a1?: string
          client_id?: string | null
          cnae_fiscal?: string
          codigo_tributacao_municipio?: string
          created_at?: string
          descricao_servico?: string
          id?: string
          inscricao_municipal?: string
          item_lista_servico?: string
          senha_certificado?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nfse_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      nfse_emitidas: {
        Row: {
          aliquota: number
          base_calculo: number
          cancelada_em: string | null
          cancelada_por: string | null
          client_id: string | null
          codigo_cnae: string | null
          codigo_municipio: string | null
          codigo_tributacao_municipio: string
          codigo_verificacao: string | null
          created_at: string
          data_emissao: string
          desconto_condicionado: number | null
          desconto_incondicionado: number | null
          discriminacao: string
          emitida_por: string | null
          exigibilidade_iss: number | null
          id: string
          iss_retido: boolean | null
          item_lista_servico: string
          link_nfse: string | null
          mensagem_erro: string | null
          motivo_cancelamento: string | null
          numero_nota: number | null
          numero_processo: string | null
          numero_rps: number
          outras_retencoes: number | null
          serie_rps: string
          status: string
          tipo_rps: number
          tomador_bairro: string | null
          tomador_cep: string | null
          tomador_cidade: string | null
          tomador_cnpj_cpf: string
          tomador_complemento: string | null
          tomador_email: string | null
          tomador_endereco: string | null
          tomador_numero: string | null
          tomador_razao_social: string
          tomador_telefone: string | null
          tomador_uf: string | null
          updated_at: string
          valor_cofins: number | null
          valor_csll: number | null
          valor_deducoes: number | null
          valor_inss: number | null
          valor_ir: number | null
          valor_iss: number | null
          valor_iss_retido: number | null
          valor_liquido_nfse: number
          valor_pis: number | null
          valor_servicos: number
          xml_envio: string | null
          xml_retorno: string | null
        }
        Insert: {
          aliquota: number
          base_calculo: number
          cancelada_em?: string | null
          cancelada_por?: string | null
          client_id?: string | null
          codigo_cnae?: string | null
          codigo_municipio?: string | null
          codigo_tributacao_municipio: string
          codigo_verificacao?: string | null
          created_at?: string
          data_emissao?: string
          desconto_condicionado?: number | null
          desconto_incondicionado?: number | null
          discriminacao: string
          emitida_por?: string | null
          exigibilidade_iss?: number | null
          id?: string
          iss_retido?: boolean | null
          item_lista_servico: string
          link_nfse?: string | null
          mensagem_erro?: string | null
          motivo_cancelamento?: string | null
          numero_nota?: number | null
          numero_processo?: string | null
          numero_rps: number
          outras_retencoes?: number | null
          serie_rps?: string
          status?: string
          tipo_rps?: number
          tomador_bairro?: string | null
          tomador_cep?: string | null
          tomador_cidade?: string | null
          tomador_cnpj_cpf: string
          tomador_complemento?: string | null
          tomador_email?: string | null
          tomador_endereco?: string | null
          tomador_numero?: string | null
          tomador_razao_social: string
          tomador_telefone?: string | null
          tomador_uf?: string | null
          updated_at?: string
          valor_cofins?: number | null
          valor_csll?: number | null
          valor_deducoes?: number | null
          valor_inss?: number | null
          valor_ir?: number | null
          valor_iss?: number | null
          valor_iss_retido?: number | null
          valor_liquido_nfse: number
          valor_pis?: number | null
          valor_servicos: number
          xml_envio?: string | null
          xml_retorno?: string | null
        }
        Update: {
          aliquota?: number
          base_calculo?: number
          cancelada_em?: string | null
          cancelada_por?: string | null
          client_id?: string | null
          codigo_cnae?: string | null
          codigo_municipio?: string | null
          codigo_tributacao_municipio?: string
          codigo_verificacao?: string | null
          created_at?: string
          data_emissao?: string
          desconto_condicionado?: number | null
          desconto_incondicionado?: number | null
          discriminacao?: string
          emitida_por?: string | null
          exigibilidade_iss?: number | null
          id?: string
          iss_retido?: boolean | null
          item_lista_servico?: string
          link_nfse?: string | null
          mensagem_erro?: string | null
          motivo_cancelamento?: string | null
          numero_nota?: number | null
          numero_processo?: string | null
          numero_rps?: number
          outras_retencoes?: number | null
          serie_rps?: string
          status?: string
          tipo_rps?: number
          tomador_bairro?: string | null
          tomador_cep?: string | null
          tomador_cidade?: string | null
          tomador_cnpj_cpf?: string
          tomador_complemento?: string | null
          tomador_email?: string | null
          tomador_endereco?: string | null
          tomador_numero?: string | null
          tomador_razao_social?: string
          tomador_telefone?: string | null
          tomador_uf?: string | null
          updated_at?: string
          valor_cofins?: number | null
          valor_csll?: number | null
          valor_deducoes?: number | null
          valor_inss?: number | null
          valor_ir?: number | null
          valor_iss?: number | null
          valor_iss_retido?: number | null
          valor_liquido_nfse?: number
          valor_pis?: number | null
          valor_servicos?: number
          xml_envio?: string | null
          xml_retorno?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfse_emitidas_client_id_fkey"
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
          lida: boolean | null
          lida_em: string | null
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
          lida?: boolean | null
          lida_em?: string | null
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
          lida?: boolean | null
          lida_em?: string | null
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
      get_next_rps: { Args: never; Returns: number }
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
