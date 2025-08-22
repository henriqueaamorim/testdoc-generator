import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp,
  Calendar,
  FileCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Target,
  Clock
} from "lucide-react";
import { getDeliveryStatus } from "@/utils/exportHelpers";
import { ProjectData } from "../DocumentationWizard";

interface DeliveryStepProps {
  projectData: ProjectData;
  updateProjectData: (data: Partial<ProjectData>) => void;
}

export const DeliveryStep: React.FC<DeliveryStepProps> = ({ projectData, updateProjectData }) => {
  const updateDelivery = (field: keyof typeof projectData.delivery, value: any) => {
    updateProjectData({
      delivery: {
        ...projectData.delivery,
        [field]: value
      }
    });
  };

  const updateIndicators = (field: keyof typeof projectData.delivery.indicators, value: number) => {
    updateDelivery('indicators', {
      ...projectData.delivery.indicators,
      [field]: value
    });
  };

  // Auto-calculate indicators based on execution data
  useEffect(() => {
    const totalTestCases = projectData.project.testCases.length;
    const executedTestCases = projectData.execution.executions.filter(
      exec => exec.status !== 'Pendente'
    ).length;
    
    const approvedTestCases = projectData.execution.executions.filter(
      exec => exec.status === 'Aprovado'
    ).length;
    
    const openDefects = projectData.execution.defects.filter(
      defect => !['Corrigido', 'Fechado', 'Rejeitado'].includes(defect.status)
    ).length;
    
    const fixedDefects = projectData.execution.defects.filter(
      defect => ['Corrigido', 'Fechado'].includes(defect.status)
    ).length;

    const successRate = totalTestCases > 0 
      ? Math.round((approvedTestCases / totalTestCases) * 100)
      : 0;

    // Auto-update indicators
    updateDelivery('indicators', {
      planned: totalTestCases,
      executed: executedTestCases,
      openDefects,
      fixedDefects,
      successRate
    });
  }, [projectData.execution.executions, projectData.execution.defects, projectData.project.testCases]);

  // Auto-set delivery date to current date if not set
  useEffect(() => {
    if (!projectData.delivery.deliveryDate) {
      updateDelivery('deliveryDate', new Date().toISOString().split('T')[0]);
    }
  }, []);

  const indicators = projectData.delivery.indicators;
  const executionProgress = indicators.planned > 0 
    ? (indicators.executed / indicators.planned) * 100 
    : 0;
  
  const approvalRate = indicators.executed > 0
    ? (indicators.successRate / 100) * 100
    : 0;

  const defectResolutionRate = (indicators.openDefects + indicators.fixedDefects) > 0
    ? (indicators.fixedDefects / (indicators.openDefects + indicators.fixedDefects)) * 100
    : 0;

  // Calculate quality metrics
  const qualityMetrics = {
    testCoverage: executionProgress,
    approvalRate: approvalRate,
    defectDensity: indicators.planned > 0 ? ((indicators.openDefects + indicators.fixedDefects) / indicators.planned) * 100 : 0,
    defectResolution: defectResolutionRate
  };

  // Status based on metrics
  const getProjectStatus = () => {
    if (qualityMetrics.testCoverage >= 95 && qualityMetrics.approvalRate >= 90 && indicators.openDefects === 0) {
      return { status: 'Excelente', color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/20' };
    } else if (qualityMetrics.testCoverage >= 80 && qualityMetrics.approvalRate >= 75 && indicators.openDefects <= 3) {
      return { status: 'Bom', color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/20' };
    } else if (qualityMetrics.testCoverage >= 60 && indicators.openDefects <= 10) {
      return { status: 'Aceitável', color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/20' };
    } else {
      return { status: 'Requer Atenção', color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive/20' };
    }
  };

  const projectStatus = getProjectStatus();

  // Get delivery status comparison
  const deliveryStatusInfo = getDeliveryStatus(projectData.expectedDeliveryDate, projectData.delivery.deliveryDate);

  return (
    <div className="space-y-6">
      {/* Project Status Overview */}
      <Card className={`border-2 ${projectStatus.borderColor} ${projectStatus.bgColor}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Status Geral do Projeto
            </div>
            <Badge variant="outline" className={`${projectStatus.color} border-current`}>
              {projectStatus.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${projectStatus.color}`}>
                {Math.round(qualityMetrics.testCoverage)}%
              </div>
              <div className="text-sm text-muted-foreground">Cobertura de Testes</div>
              <Progress value={qualityMetrics.testCoverage} className="mt-2 h-2" />
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold ${projectStatus.color}`}>
                {Math.round(qualityMetrics.approvalRate)}%
              </div>
              <div className="text-sm text-muted-foreground">Taxa de Aprovação</div>
              <Progress value={qualityMetrics.approvalRate} className="mt-2 h-2" />
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold ${indicators.openDefects === 0 ? 'text-success' : 'text-destructive'}`}>
                {indicators.openDefects}
              </div>
              <div className="text-sm text-muted-foreground">Defeitos Abertos</div>
              <div className="mt-2 h-2 bg-muted rounded">
                <div 
                  className={`h-full rounded transition-all ${indicators.openDefects === 0 ? 'bg-success' : 'bg-destructive'}`}
                  style={{ width: indicators.openDefects > 0 ? '100%' : '0%' }}
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold ${qualityMetrics.defectResolution >= 80 ? 'text-success' : 'text-warning'}`}>
                {Math.round(qualityMetrics.defectResolution)}%
              </div>
              <div className="text-sm text-muted-foreground">Resolução de Defeitos</div>
              <Progress value={qualityMetrics.defectResolution} className="mt-2 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Indicadores de Execução
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planned">Casos Planejados</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="planned"
                    type="number"
                    value={indicators.planned}
                    onChange={(e) => updateIndicators('planned', parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <Badge variant="outline">{indicators.planned}</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="executed">Casos Executados</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="executed"
                    type="number"
                    value={indicators.executed}
                    onChange={(e) => updateIndicators('executed', parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <Badge variant="outline">{indicators.executed}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progresso da Execução</span>
                <span>{Math.round(executionProgress)}%</span>
              </div>
              <Progress value={executionProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Indicadores de Defeitos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openDefects">Defeitos Abertos</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="openDefects"
                    type="number"
                    value={indicators.openDefects}
                    onChange={(e) => updateIndicators('openDefects', parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <Badge variant="destructive">{indicators.openDefects}</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fixedDefects">Defeitos Corrigidos</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="fixedDefects"
                    type="number"
                    value={indicators.fixedDefects}
                    onChange={(e) => updateIndicators('fixedDefects', parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <Badge className="bg-success text-white">{indicators.fixedDefects}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Taxa de Resolução</span>
                <span>{Math.round(defectResolutionRate)}%</span>
              </div>
              <Progress value={defectResolutionRate} className="h-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Taxa de Sucesso Final
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="finalSuccessRate">Taxa de Sucesso (%)</Label>
                <Input
                  id="finalSuccessRate"
                  type="number"
                  min="0"
                  max="100"
                  value={indicators.successRate}
                  onChange={(e) => updateIndicators('successRate', parseInt(e.target.value) || 0)}
                  className="w-32"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Taxa de Sucesso do Projeto</span>
                  <span className={`font-bold ${indicators.successRate >= 90 ? 'text-success' : indicators.successRate >= 70 ? 'text-warning' : 'text-destructive'}`}>
                    {indicators.successRate}%
                  </span>
                </div>
                <Progress value={indicators.successRate} className="h-4" />
              </div>
            </div>
            
            <div className="p-4 bg-primary-light/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> A taxa de sucesso é calculada automaticamente baseada nos casos de teste aprovados, 
                mas pode ser ajustada manualmente para refletir considerações adicionais do projeto.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary and Conclusions */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Sumário e Conclusões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="summary">Resumo da Entrega</Label>
              <Textarea
                id="summary"
                placeholder="Descreva os principais resultados, funcionalidades validadas, riscos residuais e recomendações para a entrega..."
                value={projectData.delivery.summary}
                onChange={(e) => updateDelivery('summary', e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background/50 rounded-lg">
              <div>
                <h4 className="font-medium text-sm mb-2 text-success">Funcionalidades Validadas</h4>
                <div className="text-2xl font-bold text-success">
                  {projectData.execution.executions.filter(e => e.status === 'Aprovado').length}
                </div>
                <div className="text-sm text-muted-foreground">casos aprovados</div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2 text-warning">Riscos Residuais</h4>
                <div className="text-2xl font-bold text-warning">
                  {indicators.openDefects + projectData.execution.executions.filter(e => e.status === 'Bloqueado').length}
                </div>
                <div className="text-sm text-muted-foreground">itens pendentes</div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2 text-primary">Cobertura Total</h4>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(qualityMetrics.testCoverage)}%
                </div>
                <div className="text-sm text-muted-foreground">dos testes executados</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Information */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Informações da Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Data da Entrega</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={projectData.delivery.deliveryDate}
                onChange={(e) => updateDelivery('deliveryDate', e.target.value)}
                className="w-fit"
              />
              <p className="text-sm text-muted-foreground">
                Data preenchida automaticamente com a data atual, mas pode ser modificada se necessário.
              </p>
            </div>

            {/* Final Status Summary */}
            <div className={`p-4 rounded-lg border-2 ${projectStatus.borderColor} ${projectStatus.bgColor}`}>
              <h4 className="font-medium mb-2">Status Final do Projeto</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>{projectData.execution.executions.filter(e => e.status === 'Aprovado').length} Aprovados</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span>{projectData.execution.executions.filter(e => e.status === 'Reprovado').length} Reprovados</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <span>{indicators.openDefects} Defeitos Abertos</span>
                </div>
                <div className="flex items-center gap-2">
                  {deliveryStatusInfo.icon === 'CheckCircle' ? (
                    <CheckCircle className={`h-4 w-4 ${deliveryStatusInfo.color}`} />
                  ) : (
                    <Clock className={`h-4 w-4 ${deliveryStatusInfo.color}`} />
                  )}
                  <span className={deliveryStatusInfo.color}>
                    {deliveryStatusInfo.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className={`h-4 w-4 ${projectStatus.color}`} />
                  <span className={projectStatus.color}>
                    {projectStatus.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};