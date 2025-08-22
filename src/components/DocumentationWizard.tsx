import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, FileText, Save, Check, AlertTriangle } from "lucide-react";
import { HeaderStep } from "./steps/HeaderStep";
import { PlanningStep } from "./steps/PlanningStep";
import { ProjectStep } from "./steps/ProjectStep";
import { ExecutionStep } from "./steps/ExecutionStep";
import { DeliveryStep } from "./steps/DeliveryStep";
import { useToast } from "@/hooks/use-toast";

export interface ProjectData {
  // Header
  projectName: string;
  projectVersion: string;
  testResponsible: string;
  startDate: string;
  expectedDeliveryDate: string;
  
  // Planning
  planning: {
    phases: Array<{
      phase: string;
      responsible: string;
      startDate: string;
      endDate: string;
      status: string;
    }>;
    scopeIncluded: string[];
    scopeExcluded: string[];
    testStrategy: string[];
    environment: {
      description: string;
      urlAccess: string;
      equipment: string;
    };
    risks: {
      technical: string[];
      requirements: string[];
      schedule: string[];
      operational: string[];
      quality: string[];
    };
    successRate: number;
  };
  
  // Project
  project: {
    requirements: Array<{
      id: string;
      description: string;
    }>;
    testCases: Array<{
      id: string;
      title: string;
      preconditions?: string;
      steps: string;
      expectedResult: string;
    }>;
  };
  
  // Execution
  execution: {
    executions: Array<{
      caseId: string;
      status: string;
      evidence?: string;
    }>;
    defects: Array<{
      caseId: string;
      description: string;
      status: string;
      severity: string;
      responsible: string;
    }>;
  };
  
  // Delivery
  delivery: {
    indicators: {
      planned: number;
      executed: number;
      openDefects: number;
      fixedDefects: number;
      successRate: number;
    };
    summary: string;
    deliveryDate: string;
  };
}

const STEPS = [
  { id: 1, title: "Cabeçalho", component: HeaderStep },
  { id: 2, title: "Planejamento", component: PlanningStep },
  { id: 3, title: "Projeto", component: ProjectStep },
  { id: 4, title: "Execução", component: ExecutionStep },
  { id: 5, title: "Entrega", component: DeliveryStep },
];

export const DocumentationWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('docGenerator_visitedSteps');
    return saved ? new Set(JSON.parse(saved)) : new Set([1]);
  });
  const [projectData, setProjectData] = useState<ProjectData>(() => {
    const saved = localStorage.getItem('docGenerator_projectData');
    return saved ? JSON.parse(saved) : {
      projectName: '',
      projectVersion: '',
      testResponsible: '',
      startDate: '',
      expectedDeliveryDate: '',
      planning: {
        phases: [
          { phase: 'Planejamento', responsible: '', startDate: '', endDate: '', status: 'Pendente' },
          { phase: 'Projeto', responsible: '', startDate: '', endDate: '', status: 'Pendente' },
          { phase: 'Execução', responsible: '', startDate: '', endDate: '', status: 'Pendente' },
          { phase: 'Entrega', responsible: '', startDate: '', endDate: '', status: 'Pendente' },
        ],
        scopeIncluded: [],
        scopeExcluded: [],
        testStrategy: [],
        environment: { description: '', urlAccess: '', equipment: '' },
        risks: { technical: [], requirements: [], schedule: [], operational: [], quality: [] },
        successRate: 0,
      },
      project: { requirements: [], testCases: [] },
      execution: { executions: [], defects: [] },
      delivery: {
        indicators: { planned: 0, executed: 0, openDefects: 0, fixedDefects: 0, successRate: 0 },
        summary: '',
        deliveryDate: new Date().toISOString().split('T')[0],
      },
    };
  });
  
  const { toast } = useToast();

  // Auto-save functionality
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      localStorage.setItem('docGenerator_projectData', JSON.stringify(projectData));
      localStorage.setItem('docGenerator_visitedSteps', JSON.stringify([...visitedSteps]));
      console.log('Data auto-saved');
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [projectData, visitedSteps]);

  // Validation functions
  const validateHeaderStep = (data: ProjectData): boolean => {
    const isDateValid = data.startDate && data.expectedDeliveryDate 
      ? new Date(data.startDate) <= new Date(data.expectedDeliveryDate) 
      : false;
    
    return !!(
      data.projectName?.trim() &&
      data.projectVersion?.trim() &&
      data.testResponsible?.trim() &&
      data.startDate &&
      data.expectedDeliveryDate &&
      isDateValid
    );
  };

  const validatePlanningStep = (data: ProjectData): boolean => {
    const hasValidPhases = data.planning.phases.some(phase => 
      phase.phase?.trim() && phase.responsible?.trim()
    );
    const hasEnvironment = data.planning.environment.description?.trim();
    const hasStrategies = data.planning.testStrategy.length > 0;
    
    return hasValidPhases && !!hasEnvironment && hasStrategies;
  };

  const validateProjectStep = (data: ProjectData): boolean => {
    const hasRequirements = data.project.requirements.length > 0 && 
      data.project.requirements.some(req => req.description?.trim());
    const hasTestCases = data.project.testCases.length > 0 && 
      data.project.testCases.some(tc => tc.title?.trim() && tc.steps?.trim() && tc.expectedResult?.trim());
    
    return hasRequirements && hasTestCases;
  };

  const validateExecutionStep = (data: ProjectData): boolean => {
    return data.execution.executions.length > 0;
  };

  const validateDeliveryStep = (data: ProjectData): boolean => {
    return data.delivery.indicators.planned > 0 && !!data.delivery.summary?.trim();
  };

  const getStepStatus = (stepId: number): 'complete' | 'pending' | 'unvisited' => {
    if (!visitedSteps.has(stepId)) return 'unvisited';
    
    let isValid = false;
    switch (stepId) {
      case 1: isValid = validateHeaderStep(projectData); break;
      case 2: isValid = validatePlanningStep(projectData); break;
      case 3: isValid = validateProjectStep(projectData); break;
      case 4: isValid = validateExecutionStep(projectData); break;
      case 5: isValid = validateDeliveryStep(projectData); break;
    }
    
    return isValid ? 'complete' : 'pending';
  };

  const updateProjectData = (data: Partial<ProjectData>) => {
    setProjectData(prev => ({ ...prev, ...data }));
  };

  const goToStep = (stepId: number) => {
    // Allow navigation to visited steps or the next sequential step
    if (visitedSteps.has(stepId) || stepId === Math.max(...visitedSteps) + 1) {
      setCurrentStep(stepId);
      setVisitedSteps(prev => new Set([...prev, stepId]));
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      const nextStepId = currentStep + 1;
      setCurrentStep(nextStepId);
      setVisitedSteps(prev => new Set([...prev, nextStepId]));
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = () => {
    localStorage.setItem('docGenerator_projectData', JSON.stringify(projectData));
    toast({
      title: "Dados salvos",
      description: "Os dados do projeto foram salvos com sucesso.",
    });
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Gerador de Documentação de Teste
              </h1>
              <p className="text-muted-foreground mt-2">
                Crie documentos de teste padronizados de forma eficiente
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar Rascunho
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progresso: {currentStep} de {STEPS.length}</span>
              <span>{Math.round(progress)}% concluído</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step indicators */}
            <div className="flex justify-between">
              {STEPS.map((step) => {
                const status = getStepStatus(step.id);
                const isClickable = visitedSteps.has(step.id) || step.id === Math.max(...visitedSteps) + 1;
                
                return (
                  <div
                    key={step.id}
                    className={`flex items-center space-x-2 ${
                      step.id === currentStep
                        ? 'text-primary font-medium'
                        : status === 'complete'
                        ? 'text-success'
                        : status === 'pending'
                        ? 'text-warning'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      onClick={() => isClickable && goToStep(step.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'
                      } ${
                        step.id === currentStep
                          ? 'bg-primary text-primary-foreground'
                          : status === 'complete'
                          ? 'bg-success text-white'
                          : status === 'pending'
                          ? 'bg-warning text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                      title={
                        isClickable 
                          ? `Ir para ${step.title}`
                          : `Complete os passos anteriores para acessar ${step.title}`
                      }
                    >
                      {status === 'complete' ? (
                        <Check className="h-4 w-4" />
                      ) : status === 'pending' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className="text-xs lg:text-sm">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="bg-gradient-card border-0 shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {STEPS[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CurrentStepComponent
              projectData={projectData}
              updateProjectData={updateProjectData}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <div className="flex gap-4">
            {currentStep === STEPS.length ? (
              <Button
                className="bg-gradient-primary hover:opacity-90 flex items-center gap-2"
                onClick={() => toast({
                  title: "Funcionalidade em desenvolvimento",
                  description: "A geração de documentos será implementada na próxima versão.",
                })}
              >
                <FileText className="h-4 w-4" />
                Gerar Documentos
              </Button>
            ) : (
              <Button
                className="bg-gradient-primary hover:opacity-90 flex items-center gap-2"
                onClick={nextStep}
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};