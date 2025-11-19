import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Loader2, KeyRound, X, Printer, FileText, Search } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ResetPasswordDialog } from '@/components/ResetPasswordDialog';
import { ClientSheet } from '@/components/clients/ClientSheet';
import { SociosForm } from '@/components/clients/SociosForm';
import { useReactToPrint } from 'react-to-print';

type Socio = {
  nome: string;
  cpf: string;
  capital: string;
  porcentagem: string;
};

type Client = {
  id: string;
  nome_razao_social: string;
  cnpj_cpf: string;
  cpf?: string | null;
  cnpj?: string | null;
  email: string;
  telefone: string | null;
  situacao: string;
  nome_socio?: string | null;
  data_nascimento?: string | null;
  socios?: any;
  juceb_nire?: string | null;
  juceb_protocolo?: string | null;
  juceb_data_registro?: string | null;
  numero_iptu?: string | null;
  numero_titulo?: string | null;
  codigo_simples?: string | null;
  inscricao_estadual?: string | null;
  inscricao_municipal?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  atividade_principal?: string | null;
  regime_tributario?: string | null;
  responsavel_legal?: string | null;
  campos_customizados?: any;
  user_id?: string;
};

type CustomField = {
  key: string;
  value: string;
};

export default function Clients() {
  const { user } = useAuth();
  const { onlineUsers } = usePresence();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [resetPasswordClient, setResetPasswordClient] = useState<Client | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [socios, setSocios] = useState<Socio[]>([]);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    nome_razao_social: '',
    cnpj_cpf: '',
    cpf: '',
    cnpj: '',
    email: '',
    telefone: '',
    situacao: 'Ativo',
    nome_socio: '',
    data_nascimento: '',
    juceb_nire: '',
    juceb_protocolo: '',
    juceb_data_registro: '',
    numero_iptu: '',
    numero_titulo: '',
    codigo_simples: '',
    inscricao_estadual: '',
    inscricao_municipal: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    atividade_principal: '',
    regime_tributario: '',
    responsavel_legal: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (clientsData) {
        const clientEmails = clientsData.map(c => c.email);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email')
          .in('email', clientEmails);

        const profilesMap = new Map(profilesData?.map(p => [p.email, p.id]) || []);
        
        const clientsWithUserId = clientsData.map(client => ({
          ...client,
          user_id: profilesMap.get(client.email),
        }));

        setClients(clientsWithUserId);
      } else {
        setClients([]);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar clientes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const camposCustomizados = customFields.reduce((acc, field) => {
        if (field.key && field.value) {
          acc[field.key] = field.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const dataToSave = {
        ...formData,
        campos_customizados: camposCustomizados,
        socios: socios,
      };

      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(dataToSave)
          .eq('id', editingClient.id);

        if (error) throw error;
        toast({ title: 'Cliente atualizado com sucesso!' });
      } else {
        const { data: clientData, error } = await supabase
          .from('clients')
          .insert([{ ...dataToSave, created_by: user?.id }])
          .select()
          .single();

        if (error) throw error;

        const { data: userData, error: userError } = await supabase.functions.invoke('create-client-user', {
          body: {
            email: formData.email,
            nome: formData.nome_razao_social,
          },
        });

        if (userError) {
          await supabase.from('clients').delete().eq('id', clientData.id);
          throw new Error(`Erro ao criar usuário: ${userError.message}`);
        }

        toast({ title: 'Cliente criado com sucesso!' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchClients();
    } catch (error: any) {
      toast({
        title: editingClient ? 'Erro ao atualizar cliente' : 'Erro ao criar cliente',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome_razao_social: '',
      cnpj_cpf: '',
      cpf: '',
      cnpj: '',
      email: '',
      telefone: '',
      situacao: 'Ativo',
      nome_socio: '',
      data_nascimento: '',
      juceb_nire: '',
      juceb_protocolo: '',
      juceb_data_registro: '',
      numero_iptu: '',
      numero_titulo: '',
      codigo_simples: '',
      inscricao_estadual: '',
      inscricao_municipal: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      atividade_principal: '',
      regime_tributario: '',
      responsavel_legal: '',
    });
    setEditingClient(null);
    setCustomFields([]);
    setSocios([]);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      nome_razao_social: client.nome_razao_social,
      cnpj_cpf: client.cnpj_cpf,
      cpf: client.cpf || '',
      cnpj: client.cnpj || '',
      email: client.email,
      telefone: client.telefone || '',
      situacao: client.situacao,
      nome_socio: client.nome_socio || '',
      data_nascimento: client.data_nascimento || '',
      juceb_nire: client.juceb_nire || '',
      juceb_protocolo: client.juceb_protocolo || '',
      juceb_data_registro: client.juceb_data_registro || '',
      numero_iptu: client.numero_iptu || '',
      numero_titulo: client.numero_titulo || '',
      codigo_simples: client.codigo_simples || '',
      inscricao_estadual: client.inscricao_estadual || '',
      inscricao_municipal: client.inscricao_municipal || '',
      cep: client.cep || '',
      logradouro: client.logradouro || '',
      numero: client.numero || '',
      complemento: client.complemento || '',
      bairro: client.bairro || '',
      cidade: client.cidade || '',
      estado: client.estado || '',
      atividade_principal: client.atividade_principal || '',
      regime_tributario: client.regime_tributario || '',
      responsavel_legal: client.responsavel_legal || '',
    });
    
    if (client.campos_customizados) {
      const fields = Object.entries(client.campos_customizados).map(([key, value]) => ({
        key,
        value: value as string,
      }));
      setCustomFields(fields);
    }
    
    // Carregar sócios
    if (client.socios && Array.isArray(client.socios)) {
      setSocios(client.socios);
    } else {
      setSocios([]);
    }
    
    setIsDialogOpen(true);
  };

  const addSocio = () => {
    setSocios([...socios, { nome: '', cpf: '', capital: '', porcentagem: '' }]);
  };

  const removeSocio = (index: number) => {
    setSocios(socios.filter((_, i) => i !== index));
  };

  const updateSocio = (index: number, field: keyof Socio, value: string) => {
    const updated = [...socios];
    updated[index][field] = value;
    setSocios(updated);
  };

  const addCustomField = () => {
    if (newFieldName.trim()) {
      setCustomFields([...customFields, { key: newFieldName.trim(), value: '' }]);
      setNewFieldName('');
    }
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomFieldValue = (index: number, value: string) => {
    const updated = [...customFields];
    updated[index].value = value;
    setCustomFields(updated);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const fetchCNPJData = async (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    
    if (cleanCNPJ.length !== 14) return;

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      
      if (!response.ok) {
        throw new Error('CNPJ não encontrado');
      }

      const data = await response.json();

      // Preencher campos automaticamente
      setFormData(prev => ({
        ...prev,
        nome_razao_social: data.razao_social || prev.nome_razao_social,
        email: data.email || prev.email,
        telefone: data.ddd_telefone_1 || prev.telefone,
        cep: data.cep || prev.cep,
        logradouro: data.logradouro || prev.logradouro,
        numero: data.numero || prev.numero,
        complemento: data.complemento || prev.complemento,
        bairro: data.bairro || prev.bairro,
        cidade: data.municipio || prev.cidade,
        estado: data.uf || prev.estado,
        atividade_principal: data.cnae_fiscal_descricao || prev.atividade_principal,
        situacao: data.situacao_cadastral === 'ATIVA' ? 'Ativo' : prev.situacao,
        inscricao_municipal: data.numero_inscricao_municipal || prev.inscricao_municipal,
        codigo_simples: data.opcao_pelo_simples ? 'Sim' : prev.codigo_simples,
      }));

      // Preencher sócios se houver
      if (data.qsa && Array.isArray(data.qsa) && data.qsa.length > 0) {
        const sociosData = data.qsa.slice(0, 5).map((s: any) => ({
          nome: s.nome_socio || s.nome_representante_legal || '',
          cpf: '',
          capital: '',
          porcentagem: s.percentual_capital ? s.percentual_capital.toString() : '',
        }));
        setSocios(sociosData);
      }

      toast({
        title: 'Dados carregados com sucesso!',
        description: 'Informações do CNPJ preenchidas automaticamente',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao buscar CNPJ',
        description: error.message || 'Não foi possível buscar os dados do CNPJ',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Clientes</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                <DialogDescription>
                  Preencha as informações do cliente. Campos marcados com * são obrigatórios.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <Tabs defaultValue="basico" className="flex flex-col flex-1 overflow-hidden">
                  <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 gap-1 h-auto">
                    <TabsTrigger value="basico" className="text-xs lg:text-sm">Básico</TabsTrigger>
                    <TabsTrigger value="socios" className="text-xs lg:text-sm">Sócios</TabsTrigger>
                    <TabsTrigger value="societario" className="text-xs lg:text-sm">Societário</TabsTrigger>
                    <TabsTrigger value="registros" className="text-xs lg:text-sm">Registros</TabsTrigger>
                    <TabsTrigger value="endereco" className="text-xs lg:text-sm">Endereço</TabsTrigger>
                    <TabsTrigger value="fiscal" className="text-xs lg:text-sm">Fiscal</TabsTrigger>
                    <TabsTrigger value="custom" className="text-xs lg:text-sm">Extras</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basico" className="overflow-y-auto flex-1 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      <div className="col-span-2">
                        <Label htmlFor="nome_razao_social">Nome / Razão Social *</Label>
                        <Input
                          id="nome_razao_social"
                          value={formData.nome_razao_social}
                          onChange={(e) => setFormData({ ...formData, nome_razao_social: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <div className="flex gap-2">
                          <Input
                            id="cnpj"
                            value={formData.cnpj}
                            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                            onBlur={(e) => fetchCNPJData(e.target.value)}
                            placeholder="00.000.000/0000-00"
                          />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => fetchCNPJData(formData.cnpj)}
                                >
                                  <Search className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Buscar dados na Receita Federal</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Digite o CNPJ e clique em buscar para preencher automaticamente
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          value={formData.telefone}
                          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="situacao">Situação</Label>
                        <Select value={formData.situacao} onValueChange={(value) => setFormData({ ...formData, situacao: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Inativo">Inativo</SelectItem>
                            <SelectItem value="Suspenso">Suspenso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="socios" className="overflow-y-auto flex-1 pr-2">
                    <div className="py-4">
                      <SociosForm
                        socios={socios}
                        onAdd={addSocio}
                        onRemove={removeSocio}
                        onUpdate={updateSocio}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="societario" className="overflow-y-auto flex-1 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      <div className="col-span-2">
                        <Label htmlFor="nome_socio">Nome do Sócio</Label>
                        <Input
                          id="nome_socio"
                          value={formData.nome_socio}
                          onChange={(e) => setFormData({ ...formData, nome_socio: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                        <Input
                          id="data_nascimento"
                          type="date"
                          value={formData.data_nascimento}
                          onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="responsavel_legal">Responsável Legal</Label>
                        <Input
                          id="responsavel_legal"
                          value={formData.responsavel_legal}
                          onChange={(e) => setFormData({ ...formData, responsavel_legal: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="atividade_principal">Atividade Principal</Label>
                        <Input
                          id="atividade_principal"
                          value={formData.atividade_principal}
                          onChange={(e) => setFormData({ ...formData, atividade_principal: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="registros" className="overflow-y-auto flex-1 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      <div>
                        <Label htmlFor="juceb_nire">NIRE (JUCEB)</Label>
                        <Input
                          id="juceb_nire"
                          value={formData.juceb_nire}
                          onChange={(e) => setFormData({ ...formData, juceb_nire: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="juceb_protocolo">Protocolo JUCEB</Label>
                        <Input
                          id="juceb_protocolo"
                          value={formData.juceb_protocolo}
                          onChange={(e) => setFormData({ ...formData, juceb_protocolo: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="juceb_data_registro">Data de Registro JUCEB</Label>
                        <Input
                          id="juceb_data_registro"
                          type="date"
                          value={formData.juceb_data_registro}
                          onChange={(e) => setFormData({ ...formData, juceb_data_registro: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="numero_titulo">Número do Título</Label>
                        <Input
                          id="numero_titulo"
                          value={formData.numero_titulo}
                          onChange={(e) => setFormData({ ...formData, numero_titulo: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="endereco" className="overflow-y-auto flex-1 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      <div>
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                          id="cep"
                          value={formData.cep}
                          onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                          placeholder="00000-000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="numero_end">Número</Label>
                        <Input
                          id="numero_end"
                          value={formData.numero}
                          onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="logradouro">Logradouro</Label>
                        <Input
                          id="logradouro"
                          value={formData.logradouro}
                          onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="complemento">Complemento</Label>
                        <Input
                          id="complemento"
                          value={formData.complemento}
                          onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bairro">Bairro</Label>
                        <Input
                          id="bairro"
                          value={formData.bairro}
                          onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input
                          id="cidade"
                          value={formData.cidade}
                          onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="estado">Estado</Label>
                        <Input
                          id="estado"
                          value={formData.estado}
                          onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                          placeholder="BA"
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="numero_iptu">Número do IPTU</Label>
                        <Input
                          id="numero_iptu"
                          value={formData.numero_iptu}
                          onChange={(e) => setFormData({ ...formData, numero_iptu: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="fiscal" className="overflow-y-auto flex-1 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      <div>
                        <Label htmlFor="codigo_simples">Código Simples Nacional</Label>
                        <Input
                          id="codigo_simples"
                          value={formData.codigo_simples}
                          onChange={(e) => setFormData({ ...formData, codigo_simples: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="regime_tributario">Regime Tributário</Label>
                        <Select value={formData.regime_tributario} onValueChange={(value) => setFormData({ ...formData, regime_tributario: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                            <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                            <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                            <SelectItem value="MEI">MEI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                        <Input
                          id="inscricao_estadual"
                          value={formData.inscricao_estadual}
                          onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                        <Input
                          id="inscricao_municipal"
                          value={formData.inscricao_municipal}
                          onChange={(e) => setFormData({ ...formData, inscricao_municipal: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="custom" className="overflow-y-auto flex-1 pr-2">
                    <div className="py-4">
                      <Label className="text-base">Campos Personalizados</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Adicione campos customizados específicos para este cliente
                      </p>
                      
                      <div className="flex gap-2 mb-4">
                        <Input
                          placeholder="Nome do novo campo"
                          value={newFieldName}
                          onChange={(e) => setNewFieldName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomField())}
                        />
                        <Button type="button" onClick={addCustomField} size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {customFields.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            Nenhum campo personalizado adicionado
                          </p>
                        ) : (
                          customFields.map((field, index) => (
                            <div key={index} className="flex gap-2 items-start">
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">{field.key}</Label>
                                <Input
                                  placeholder="Valor"
                                  value={field.value}
                                  onChange={(e) => updateCustomFieldValue(index, e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCustomField(index)}
                                className="mt-6"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingClient ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome / Razão Social</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => {
                  const isOnline = client.user_id && onlineUsers.has(client.user_id);
                  
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="flex items-center gap-2">
                        {isOnline && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Online agora</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {client.nome_razao_social}
                      </TableCell>
                      <TableCell>{client.cpf || client.cnpj || client.cnpj_cpf}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.telefone || '-'}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            client.situacao === 'Ativo'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : client.situacao === 'Inativo'
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {client.situacao}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setViewingClient(client)}>
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ver Ficha Cadastral</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setResetPasswordClient(client)}
                                >
                                  <KeyRound className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Redefinir Senha</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {resetPasswordClient && (
        <ResetPasswordDialog
          open={!!resetPasswordClient}
          onOpenChange={(open) => !open && setResetPasswordClient(null)}
          clientId={resetPasswordClient.user_id || ''}
          clientName={resetPasswordClient.nome_razao_social}
        />
      )}

      {/* Dialog de Visualização da Ficha Cadastral */}
      {viewingClient && (
        <Dialog open={!!viewingClient} onOpenChange={(open) => !open && setViewingClient(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ficha Cadastral - {viewingClient.nome_razao_social}</DialogTitle>
              <DialogDescription>
                Visualize e imprima a ficha cadastral completa do cliente
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex justify-end mb-4">
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Ficha
              </Button>
            </div>

            <ClientSheet ref={printRef} client={viewingClient} />
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
