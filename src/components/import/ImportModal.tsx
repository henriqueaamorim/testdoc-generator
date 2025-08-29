import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { ProjectData } from '@/components/DocumentationWizard';
import { parseMarkdownToProjectData } from './MarkdownImporter';
import { useToast } from '@/hooks/use-toast';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ProjectData) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  open,
  onOpenChange,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.md')) {
        setError('Por favor, selecione um arquivo .md válido');
        return;
      }
      setFile(selectedFile);
      setError(null);
      handleParseFile(selectedFile);
    }
  };

  const handleParseFile = async (fileToRead: File) => {
    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(20);
      
      const content = await fileToRead.text();
      setProgress(50);

      const data = parseMarkdownToProjectData(content);
      setProgress(80);

      console.log('[PASSO 1 - MODAL] Dados Parseados:', data);

      setParsedData(data);
      setProgress(100);
      
      toast({
        title: "Arquivo processado com sucesso",
        description: "Os dados foram extraídos do arquivo Markdown.",
      });
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao processar o arquivo');
      setParsedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (parsedData) {
      onImport(parsedData);
      toast({
        title: "Dados importados",
        description: "Os dados foram importados com sucesso para o wizard.",
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData(null);
    setLoading(false);
    setProgress(0);
    setError(null);
    onOpenChange(false);
  };

  const getDataSummary = () => {
    if (!parsedData) return null;

    const sections = [];
    if (parsedData.projectName) sections.push('Cabeçalho');
    if (parsedData.planning.phases.some(p => p.responsible)) sections.push('Planejamento');
    if (parsedData.project.requirements.length > 0) sections.push('Requisitos');
    if (parsedData.project.testCases.length > 0) sections.push('Casos de Teste');
    if (parsedData.execution.executions.length > 0) sections.push('Execuções');
    if (parsedData.delivery.summary) sections.push('Entrega');

    return sections;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar Documentação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Selecione um arquivo .md gerado por esta aplicação para importar os dados automaticamente.
            </div>
            
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".md"
                onChange={handleFileChange}
                disabled={loading}
                className="flex-1"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando arquivo...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert className="border-destructive/50 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Preview */}
          {parsedData && !loading && (
            <div className="space-y-4">
              <Alert className="border-success/50 text-success">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Arquivo processado com sucesso! As seguintes seções foram encontradas:
                </AlertDescription>
              </Alert>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Dados Encontrados:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {getDataSummary()?.map((section) => (
                    <div key={section} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      {section}
                    </div>
                  ))}
                </div>
                
                {parsedData.projectName && (
                  <div className="pt-2 border-t border-border">
                    <div className="text-sm">
                      <strong>Projeto:</strong> {parsedData.projectName} v{parsedData.projectVersion}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <strong>Atenção:</strong> Os dados atuais do wizard serão substituídos pelos dados do arquivo. 
                    Esta ação não pode ser desfeita.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!parsedData || loading}
              className="bg-gradient-primary hover:opacity-90"
            >
              Importar Dados
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};