import { forwardRef } from 'react';
import { format } from 'date-fns';

type Socio = {
  nome: string;
  cpf: string;
  capital: string;
  porcentagem: string;
};

type ClientData = {
  nome_razao_social: string;
  cpf?: string | null;
  cnpj?: string | null;
  email: string;
  telefone?: string | null;
  situacao: string;
  nome_socio?: string | null;
  data_nascimento?: string | null;
  socios?: Socio[];
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
  campos_customizados?: Record<string, string>;
};

interface ClientSheetProps {
  client: ClientData;
}

export const ClientSheet = forwardRef<HTMLDivElement, ClientSheetProps>(
  ({ client }, ref) => {
    const totalCapital = client.socios?.reduce((sum, s) => sum + parseFloat(s.capital || '0'), 0) || 0;

    return (
      <div ref={ref} className="bg-background p-8 max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="border-b-2 border-primary pb-4 mb-6">
          <h1 className="text-3xl font-bold text-primary">Ficha Cadastral</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Documento gerado em {format(new Date(), 'dd/MM/yyyy às HH:mm')}
          </p>
        </div>

        {/* Dados Básicos */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4 text-primary">
            Dados Básicos
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome / Razão Social</label>
              <p className="text-base font-medium">{client.nome_razao_social}</p>
            </div>
            {client.cpf && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">CPF</label>
                <p className="text-base font-medium">{client.cpf}</p>
              </div>
            )}
            {client.cnpj && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
                <p className="text-base font-medium">{client.cnpj}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-base font-medium">{client.email}</p>
            </div>
            {client.telefone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                <p className="text-base font-medium">{client.telefone}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Situação</label>
              <p className="text-base font-medium">{client.situacao}</p>
            </div>
          </div>
        </section>

        {/* Quadro Societário */}
        {client.socios && client.socios.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4 text-primary">
              Quadro Societário
            </h2>
            <div className="overflow-hidden border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold">Nome do Sócio</th>
                    <th className="text-left p-3 font-semibold">CPF</th>
                    <th className="text-right p-3 font-semibold">Capital (R$)</th>
                    <th className="text-right p-3 font-semibold">Participação (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {client.socios.map((socio, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{socio.nome}</td>
                      <td className="p-3">{socio.cpf}</td>
                      <td className="p-3 text-right">
                        {parseFloat(socio.capital || '0').toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-3 text-right">{socio.porcentagem}%</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-muted font-semibold">
                    <td className="p-3" colSpan={2}>Total</td>
                    <td className="p-3 text-right">
                      {totalCapital.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-3 text-right">
                      {client.socios.reduce((sum, s) => sum + parseFloat(s.porcentagem || '0'), 0)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Dados Societários */}
        {(client.nome_socio || client.data_nascimento || client.responsavel_legal || client.atividade_principal) && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4 text-primary">
              Informações Societárias
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {client.nome_socio && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome do Sócio</label>
                  <p className="text-base font-medium">{client.nome_socio}</p>
                </div>
              )}
              {client.data_nascimento && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
                  <p className="text-base font-medium">
                    {format(new Date(client.data_nascimento), 'dd/MM/yyyy')}
                  </p>
                </div>
              )}
              {client.responsavel_legal && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Responsável Legal</label>
                  <p className="text-base font-medium">{client.responsavel_legal}</p>
                </div>
              )}
              {client.atividade_principal && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Atividade Principal</label>
                  <p className="text-base font-medium">{client.atividade_principal}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Registros */}
        {(client.juceb_nire || client.juceb_protocolo || client.juceb_data_registro || client.numero_titulo) && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4 text-primary">
              Registros e Documentos
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {client.juceb_nire && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">NIRE (JUCEB)</label>
                  <p className="text-base font-medium">{client.juceb_nire}</p>
                </div>
              )}
              {client.juceb_protocolo && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Protocolo JUCEB</label>
                  <p className="text-base font-medium">{client.juceb_protocolo}</p>
                </div>
              )}
              {client.juceb_data_registro && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Registro JUCEB</label>
                  <p className="text-base font-medium">
                    {format(new Date(client.juceb_data_registro), 'dd/MM/yyyy')}
                  </p>
                </div>
              )}
              {client.numero_titulo && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Número do Título</label>
                  <p className="text-base font-medium">{client.numero_titulo}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Endereço */}
        {(client.cep || client.logradouro || client.cidade || client.estado) && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4 text-primary">
              Endereço
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {client.cep && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CEP</label>
                  <p className="text-base font-medium">{client.cep}</p>
                </div>
              )}
              {client.logradouro && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Logradouro</label>
                  <p className="text-base font-medium">
                    {client.logradouro}
                    {client.numero && `, ${client.numero}`}
                  </p>
                </div>
              )}
              {client.complemento && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Complemento</label>
                  <p className="text-base font-medium">{client.complemento}</p>
                </div>
              )}
              {client.bairro && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bairro</label>
                  <p className="text-base font-medium">{client.bairro}</p>
                </div>
              )}
              {client.cidade && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cidade</label>
                  <p className="text-base font-medium">{client.cidade}</p>
                </div>
              )}
              {client.estado && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <p className="text-base font-medium">{client.estado}</p>
                </div>
              )}
              {client.numero_iptu && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Número do IPTU</label>
                  <p className="text-base font-medium">{client.numero_iptu}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Informações Fiscais */}
        {(client.codigo_simples || client.regime_tributario || client.inscricao_estadual || client.inscricao_municipal) && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4 text-primary">
              Informações Fiscais
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {client.codigo_simples && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Código Simples Nacional</label>
                  <p className="text-base font-medium">{client.codigo_simples}</p>
                </div>
              )}
              {client.regime_tributario && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Regime Tributário</label>
                  <p className="text-base font-medium">{client.regime_tributario}</p>
                </div>
              )}
              {client.inscricao_estadual && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Inscrição Estadual</label>
                  <p className="text-base font-medium">{client.inscricao_estadual}</p>
                </div>
              )}
              {client.inscricao_municipal && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Inscrição Municipal</label>
                  <p className="text-base font-medium">{client.inscricao_municipal}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Campos Customizados */}
        {client.campos_customizados && Object.keys(client.campos_customizados).length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4 text-primary">
              Informações Adicionais
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(client.campos_customizados).map(([key, value]) => (
                <div key={key}>
                  <label className="text-sm font-medium text-muted-foreground">{key}</label>
                  <p className="text-base font-medium">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rodapé */}
        <div className="mt-8 pt-4 border-t border-border text-center text-sm text-muted-foreground">
          <p>Documento gerado automaticamente pelo Sistema de Contabilidade</p>
          <p className="mt-1">Este documento é válido apenas para fins cadastrais</p>
        </div>
      </div>
    );
  }
);

ClientSheet.displayName = 'ClientSheet';
