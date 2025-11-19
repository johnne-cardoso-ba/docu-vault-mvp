import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

interface FileUploadStatus {
  filename: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface UploadProgressProps {
  uploads: FileUploadStatus[];
}

export function UploadProgress({ uploads }: UploadProgressProps) {
  if (uploads.length === 0) return null;

  return (
    <div className="space-y-3">
      {uploads.map((upload, index) => (
        <div key={index} className="p-3 border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-2">
            {upload.status === 'uploading' && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
            {upload.status === 'success' && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
            {upload.status === 'error' && (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{upload.filename}</p>
              {upload.error && (
                <p className="text-xs text-red-600 mt-1">{upload.error}</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {upload.progress}%
            </span>
          </div>
          {upload.status === 'uploading' && (
            <Progress value={upload.progress} className="h-1" />
          )}
        </div>
      ))}
    </div>
  );
}
