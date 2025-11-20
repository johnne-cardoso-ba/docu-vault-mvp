import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Check } from "lucide-react";

interface CertificateUploadProps {
  onCertificateConverted: (base64: string) => void;
  currentCertificate?: string;
}

export function CertificateUpload({ onCertificateConverted, currentCertificate }: CertificateUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
      toast.error("Por favor, selecione um arquivo .pfx ou .p12");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        // Remove o prefixo "data:application/x-pkcs12;base64," se existir
        const base64Clean = base64.split(',')[1] || base64;
        onCertificateConverted(base64Clean);
        setFileName(file.name);
        toast.success("Certificado carregado com sucesso!");
      };
      reader.onerror = () => {
        toast.error("Erro ao ler o arquivo");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro ao processar certificado:", error);
      toast.error("Erro ao processar o certificado");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="certificate">
        Certificado Digital A1 (.pfx ou .p12)
        {currentCertificate && " (já configurado)"}
      </Label>
      <div className="flex gap-2">
        <Input
          id="certificate"
          type="file"
          accept=".pfx,.p12"
          onChange={handleFileUpload}
          disabled={uploading}
          className="flex-1"
        />
        {(fileName || currentCertificate) && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              {fileName || "Certificado configurado"}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        O arquivo será automaticamente convertido para Base64 e armazenado de forma segura
      </p>
    </div>
  );
}
