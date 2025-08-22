import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  FileSpreadsheet, 
  Code, 
  FileEdit,
  Download, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { ProjectData } from "../DocumentationWizard";
import { ExportFormat, ExportProgress } from "@/types/export.types";
import { generatePDF } from "./PDFExporter";
import { generateExcel } from "./ExcelExporter";
import { generateMarkdown } from "./MarkdownExporter";
import { validateProjectData } from "@/utils/exportHelpers";
import { useToast } from "@/hooks/use-toast";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectData: ProjectData;
}

const formatConfigs = [
  {
    id: 'pdf' as ExportFormat,
    name: 'PDF',
    description: 'Documento completo formatado',
    icon: FileText,
    color: 'text-red-600'
  },
  {
    id: 'excel' as ExportFormat,
    name: 'Excel',
    description: 'Planilhas com dados tabulares',
    icon: FileSpreadsheet,
    color: 'text-green-600'
  },
  {
    id: 'json' as ExportFormat,
    name: 'JSON',
    description: 'Backup completo dos dados',
    icon: Code,
    color: 'text-blue-600'
  },
  {
    id: 'markdown' as ExportFormat,
    name: 'Markdown',
    description: 'Documento em formato Markdown',
    icon: FileEdit,
    color: 'text-purple-600'
  }
];

export const ExportModal: React.FC<ExportModalProps> = ({ open, onOpenChange, projectData }) => {
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>(['pdf']);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress[]>([]);
  const { toast } = useToast();

  const validation = validateProjectData(projectData);

  const handleFormatToggle = (format: ExportFormat, checked: boolean) => {
    if (checked) {
      setSelectedFormats(prev => [...prev, format]);
    } else {
      setSelectedFormats(prev => prev.filter(f => f !== format));
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateJSONExport = (): Blob => {
    const exportData = {
      ...projectData,
      exportMetadata: {
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
    };
    return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  };

  const handleExport = async () => {
    if (!validation.isValid) {
      toast({
        title: "Dados incompletos",
        description: `Complete os seguintes campos: ${validation.missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    if (selectedFormats.length === 0) {
      toast({
        title: "Selecione um formato",
        description: "Escolha pelo menos um formato para exportação.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    const progress: ExportProgress[] = selectedFormats.map(format => ({
      format,
      progress: 0,
      status: 'pending'
    }));
    setExportProgress(progress);

    const projectName = projectData.projectName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];

    for (let i = 0; i < selectedFormats.length; i++) {
      const format = selectedFormats[i];
      
      setExportProgress(prev => prev.map(p => 
        p.format === format ? { ...p, status: 'generating' } : p
      ));

      try {
        let blob: Blob;
        let filename: string;

        switch (format) {
          case 'pdf':
            blob = await generatePDF(projectData, (progress) => {
              setExportProgress(prev => prev.map(p => 
                p.format === format ? { ...p, progress } : p
              ));
            });
            filename = `${projectName}_Documentacao_${timestamp}.pdf`;
            break;

          case 'excel':
            blob = await generateExcel(projectData, (progress) => {
              setExportProgress(prev => prev.map(p => 
                p.format === format ? { ...p, progress } : p
              ));
            });
            filename = `${projectName}_Dados_${timestamp}.xlsx`;
            break;

          case 'json':
            blob = generateJSONExport();
            filename = `${projectName}_Backup_${timestamp}.json`;
            setExportProgress(prev => prev.map(p => 
              p.format === format ? { ...p, progress: 100 } : p
            ));
            break;

          case 'markdown':
            blob = await generateMarkdown(projectData, (progress) => {
              setExportProgress(prev => prev.map(p => 
                p.format === format ? { ...p, progress } : p
              ));
            });
            filename = `${projectName}_Documentacao_${timestamp}.md`;
            break;

          default:
            throw new Error(`Formato não suportado: ${format}`);
        }

        downloadFile(blob, filename);
        
        setExportProgress(prev => prev.map(p => 
          p.format === format ? { ...p, status: 'complete', progress: 100 } : p
        ));

      } catch (error) {
        console.error(`Erro ao gerar ${format}:`, error);
        setExportProgress(prev => prev.map(p => 
          p.format === format ? { ...p, status: 'error' } : p
        ));
        
        toast({
          title: `Erro na exportação`,
          description: `Não foi possível gerar o arquivo ${format.toUpperCase()}`,
          variant: "destructive"
        });
      }
    }

    // Show success message if all exports completed
    const allComplete = exportProgress.every(p => p.status === 'complete');
    if (allComplete) {
      toast({
        title: "Exportação concluída",
        description: "Todos os documentos foram gerados com sucesso!",
      });
    }

    setTimeout(() => {
      setIsExporting(false);
      setExportProgress([]);
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generating': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'complete': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Documentação
          </DialogTitle>
          <DialogDescription>
            Selecione os formatos de arquivo que deseja gerar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Status */}
          {!validation.isValid && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Dados incompletos</span>
              </div>
              <p className="text-xs text-destructive/80 mt-1">
                Complete os campos obrigatórios: {validation.missingFields.join(', ')}
              </p>
            </div>
          )}

          {/* Format Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Formatos de Exportação</h4>
            {formatConfigs.map((config) => {
              const Icon = config.icon;
              const isSelected = selectedFormats.includes(config.id);
              const progressItem = exportProgress.find(p => p.format === config.id);
              
              return (
                <div 
                  key={config.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    isSelected ? 'bg-primary/5 border-primary/20' : 'border-border'
                  }`}
                >
                  <Checkbox
                    id={config.id}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleFormatToggle(config.id, checked as boolean)}
                    disabled={isExporting}
                  />
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <label 
                        htmlFor={config.id} 
                        className="text-sm font-medium cursor-pointer"
                      >
                        {config.name}
                      </label>
                      {progressItem && getStatusIcon(progressItem.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                    {progressItem && progressItem.status === 'generating' && (
                      <Progress value={progressItem.progress} className="h-1 mt-2" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Export Summary */}
          {selectedFormats.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <h5 className="text-sm font-medium mb-2">Resumo da Exportação</h5>
              <div className="flex flex-wrap gap-1">
                {selectedFormats.map(format => (
                  <Badge key={format} variant="secondary" className="text-xs">
                    {format.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedFormats.length === 0 || !validation.isValid}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? 'Gerando...' : 'Exportar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};