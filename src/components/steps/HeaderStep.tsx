import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarIcon, User, FileText, Hash } from "lucide-react";
import { ProjectData } from "../DocumentationWizard";

interface HeaderStepProps {
  projectData: ProjectData;
  updateProjectData: (data: Partial<ProjectData>) => void;
}

export const HeaderStep: React.FC<HeaderStepProps> = ({ projectData, updateProjectData }) => {
  const handleInputChange = (field: keyof ProjectData, value: string) => {
    updateProjectData({ [field]: value });
  };

  const validateDate = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      return new Date(startDate) <= new Date(endDate);
    }
    return true;
  };

  const isDateValid = validateDate(projectData.startDate, projectData.expectedDeliveryDate);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Informações do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-sm font-medium">
                Nome do Projeto *
              </Label>
              <Input
                id="projectName"
                placeholder="Ex: Sistema de Gestão Comercial"
                value={projectData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                className="bg-background"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="projectVersion" className="text-sm font-medium">
                Versão do Projeto *
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="projectVersion"
                  placeholder="Ex: 1.0.0"
                  value={projectData.projectVersion}
                  onChange={(e) => handleInputChange('projectVersion', e.target.value)}
                  className="pl-10 bg-background"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Responsável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="testResponsible" className="text-sm font-medium">
                Responsável pelo Teste *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="testResponsible"
                  placeholder="Nome do responsável pelos testes"
                  value={projectData.testResponsible}
                  onChange={(e) => handleInputChange('testResponsible', e.target.value)}
                  className="pl-10 bg-background"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Cronograma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">
                Data de Início *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={projectData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="bg-background"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expectedDeliveryDate" className="text-sm font-medium">
                Data Prevista de Entrega *
              </Label>
              <Input
                id="expectedDeliveryDate"
                type="date"
                value={projectData.expectedDeliveryDate}
                onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
                className={`bg-background ${!isDateValid ? 'border-destructive' : ''}`}
                required
              />
              {!isDateValid && (
                <p className="text-sm text-destructive">
                  A data de entrega deve ser posterior à data de início
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <div className="mt-6 p-4 bg-primary-light/10 rounded-lg border border-primary/20">
        <h4 className="font-medium text-sm mb-2">Status da Validação:</h4>
        <div className="space-y-1 text-sm">
          <div className={`flex items-center gap-2 ${projectData.projectName ? 'text-success' : 'text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${projectData.projectName ? 'bg-success' : 'bg-muted-foreground'}`} />
            Nome do Projeto {projectData.projectName ? '✓' : '(obrigatório)'}
          </div>
          <div className={`flex items-center gap-2 ${projectData.projectVersion ? 'text-success' : 'text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${projectData.projectVersion ? 'bg-success' : 'bg-muted-foreground'}`} />
            Versão do Projeto {projectData.projectVersion ? '✓' : '(obrigatório)'}
          </div>
          <div className={`flex items-center gap-2 ${projectData.testResponsible ? 'text-success' : 'text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${projectData.testResponsible ? 'bg-success' : 'bg-muted-foreground'}`} />
            Responsável pelo Teste {projectData.testResponsible ? '✓' : '(obrigatório)'}
          </div>
          <div className={`flex items-center gap-2 ${projectData.startDate ? 'text-success' : 'text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${projectData.startDate ? 'bg-success' : 'bg-muted-foreground'}`} />
            Data de Início {projectData.startDate ? '✓' : '(obrigatório)'}
          </div>
          <div className={`flex items-center gap-2 ${projectData.expectedDeliveryDate && isDateValid ? 'text-success' : 'text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${projectData.expectedDeliveryDate && isDateValid ? 'bg-success' : 'bg-muted-foreground'}`} />
            Data de Entrega {projectData.expectedDeliveryDate && isDateValid ? '✓' : '(obrigatório)'}
          </div>
        </div>
      </div>
    </div>
  );
};