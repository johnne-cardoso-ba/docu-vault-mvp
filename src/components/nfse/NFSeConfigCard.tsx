import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, FileText, Download } from "lucide-react";

interface NFSeConfigCardProps {
  config: any;
  clientName: string;
  onView: () => void;
  onEdit: () => void;
  onViewXML?: () => void;
  onDownloadPDF?: () => void;
  isAdmin?: boolean;
}

export function NFSeConfigCard({ 
  config, 
  clientName, 
  onView, 
  onEdit,
  onViewXML,
  onDownloadPDF,
  isAdmin = false 
}: NFSeConfigCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{clientName}</CardTitle>
            <CardDescription className="mt-1">
              IM: {config.inscricao_municipal}
            </CardDescription>
          </div>
          <Badge variant={config.ambiente === "producao" ? "default" : "secondary"}>
            {config.ambiente === "producao" ? "Produção" : "Homologação"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">CNAE:</span>
              <p className="font-medium">{config.cnae_fiscal}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Alíquota ISS:</span>
              <p className="font-medium">{config.aliquota_iss}%</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Cód. Tributação:</span>
              <p className="font-medium">{config.codigo_tributacao_municipio}</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Item Lista:</span>
              <p className="font-medium">{config.item_lista_servico}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={onView} className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                {onViewXML && (
                  <Button variant="outline" size="sm" onClick={onViewXML}>
                    <FileText className="h-4 w-4 mr-2" />
                    XML
                  </Button>
                )}
                {onDownloadPDF && (
                  <Button variant="outline" size="sm" onClick={onDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
