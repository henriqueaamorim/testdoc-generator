import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Play,
  Bug,
  Search,
  Hash,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Ban
} from "lucide-react";
import { ProjectData } from "../DocumentationWizard";

interface ExecutionStepProps {
  projectData: ProjectData;
  updateProjectData: (data: Partial<ProjectData>) => void;
}

const EXECUTION_STATUSES = [
  { value: 'Pendente', label: 'Pendente', icon: Clock, color: 'text-muted-foreground' },
  { value: 'Em execução', label: 'Em execução', icon: Play, color: 'text-primary' },
  { value: 'Aprovado', label: 'Aprovado', icon: CheckCircle, color: 'text-success' },
  { value: 'Reprovado', label: 'Reprovado', icon: XCircle, color: 'text-destructive' },
  { value: 'Bloqueado', label: 'Bloqueado', icon: Ban, color: 'text-warning' }
];

const DEFECT_SEVERITIES = [
  { value: 'baixa', label: 'Baixa', color: 'text-muted-foreground' },
  { value: 'media', label: 'Média', color: 'text-warning' },
  { value: 'alta', label: 'Alta', color: 'text-orange-500' },
  { value: 'critica', label: 'Crítica', color: 'text-destructive' }
];

export const ExecutionStep: React.FC<ExecutionStepProps> = ({ projectData, updateProjectData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newDefect, setNewDefect] = useState({
    caseId: '',
    description: '',
    status: 'Aberto',
    severity: 'media',
    responsible: ''
  });

  // Initialize executions from test cases if not already done
  useEffect(() => {
    const existingExecutions = projectData.execution.executions;
    const testCaseIds = projectData.project.testCases.map(tc => tc.id);
    
    // Add missing executions for new test cases
    const missingExecutions = testCaseIds.filter(id => 
      !existingExecutions.some(exec => exec.caseId === id)
    ).map(id => ({
      caseId: id,
      status: 'Pendente',
      evidence: ''
    }));

    // Remove executions for deleted test cases
    const validExecutions = existingExecutions.filter(exec => 
      testCaseIds.includes(exec.caseId)
    );

    if (missingExecutions.length > 0 || validExecutions.length !== existingExecutions.length) {
      updateExecution('executions', [...validExecutions, ...missingExecutions]);
    }
  }, [projectData.project.testCases]);

  const updateExecution = (field: keyof typeof projectData.execution, value: any) => {
    updateProjectData({
      execution: {
        ...projectData.execution,
        [field]: value
      }
    });
  };

  const updateExecutionItem = (caseId: string, field: keyof typeof projectData.execution.executions[0], value: string) => {
    const updated = projectData.execution.executions.map(exec =>
      exec.caseId === caseId ? { ...exec, [field]: value } : exec
    );
    updateExecution('executions', updated);
  };

  const addDefect = () => {
    if (!newDefect.caseId || !newDefect.description) return;
    
    const defect = { ...newDefect };
    updateExecution('defects', [...projectData.execution.defects, defect]);
    setNewDefect({
      caseId: '',
      description: '',
      status: 'Aberto',
      severity: 'media',
      responsible: ''
    });
  };

  const updateDefect = (index: number, field: keyof typeof projectData.execution.defects[0], value: string) => {
    const updated = [...projectData.execution.defects];
    updated[index] = { ...updated[index], [field]: value };
    updateExecution('defects', updated);
  };

  const removeDefect = (index: number) => {
    const updated = projectData.execution.defects.filter((_, i) => i !== index);
    updateExecution('defects', updated);
  };

  const getTestCaseTitle = (caseId: string) => {
    const testCase = projectData.project.testCases.find(tc => tc.id === caseId);
    return testCase?.title || 'Caso de teste não encontrado';
  };

  const getStatusIcon = (status: string) => {
    const statusConfig = EXECUTION_STATUSES.find(s => s.value === status);
    if (!statusConfig) return Clock;
    return statusConfig.icon;
  };

  const getStatusColor = (status: string) => {
    const statusConfig = EXECUTION_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'text-muted-foreground';
  };

  const filteredExecutions = projectData.execution.executions.filter(exec => {
    const testCase = projectData.project.testCases.find(tc => tc.id === exec.caseId);
    const searchLower = searchTerm.toLowerCase();
    return exec.caseId.toLowerCase().includes(searchLower) ||
           exec.status.toLowerCase().includes(searchLower) ||
           (testCase?.title.toLowerCase().includes(searchLower) || false);
  });

  const executionStats = {
    total: projectData.execution.executions.length,
    pending: projectData.execution.executions.filter(e => e.status === 'Pendente').length,
    inProgress: projectData.execution.executions.filter(e => e.status === 'Em execução').length,
    approved: projectData.execution.executions.filter(e => e.status === 'Aprovado').length,
    failed: projectData.execution.executions.filter(e => e.status === 'Reprovado').length,
    blocked: projectData.execution.executions.filter(e => e.status === 'Bloqueado').length,
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4 text-center bg-gradient-card">
          <div className="text-2xl font-bold text-primary">{executionStats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-card">
          <div className="text-2xl font-bold text-muted-foreground">{executionStats.pending}</div>
          <div className="text-sm text-muted-foreground">Pendente</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-card">
          <div className="text-2xl font-bold text-primary">{executionStats.inProgress}</div>
          <div className="text-sm text-muted-foreground">Em Execução</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-card">
          <div className="text-2xl font-bold text-success">{executionStats.approved}</div>
          <div className="text-sm text-muted-foreground">Aprovado</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-card">
          <div className="text-2xl font-bold text-destructive">{executionStats.failed}</div>
          <div className="text-sm text-muted-foreground">Reprovado</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-card">
          <div className="text-2xl font-bold text-warning">{executionStats.blocked}</div>
          <div className="text-sm text-muted-foreground">Bloqueado</div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID do caso ou status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Case Executions */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Execução dos Casos de Teste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredExecutions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {projectData.execution.executions.length === 0 
                  ? "Nenhum caso de teste disponível para execução. Adicione casos de teste na etapa anterior."
                  : `Nenhuma execução encontrada para "${searchTerm}"`
                }
              </p>
            ) : (
              filteredExecutions.map((execution) => {
                const testCase = projectData.project.testCases.find(tc => tc.id === execution.caseId);
                const StatusIcon = getStatusIcon(execution.status);
                
                return (
                  <div key={execution.caseId} className="p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">ID do Caso</Label>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline" className="font-mono">
                            {execution.caseId}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {testCase?.title || 'Título não disponível'}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Status</Label>
                        <Select
                          value={execution.status}
                          onValueChange={(value) => updateExecutionItem(execution.caseId, 'status', value)}
                        >
                          <SelectTrigger>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${getStatusColor(execution.status)}`} />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {EXECUTION_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                <div className="flex items-center gap-2">
                                  <status.icon className={`h-4 w-4 ${status.color}`} />
                                  {status.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="lg:col-span-2 space-y-2">
                        <Label className="text-sm font-medium">Evidência (URL/Arquivo/Imagem)</Label>
                        <Input
                          placeholder="Link para evidência ou descrição do arquivo"
                          value={execution.evidence || ''}
                          onChange={(e) => updateExecutionItem(execution.caseId, 'evidence', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Defects */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-destructive" />
              Defeitos Encontrados
              <Badge variant="secondary">{projectData.execution.defects.length}</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add New Defect */}
          <Card className="mb-6 border-dashed border-2 border-muted-foreground/30">
            <CardHeader>
              <CardTitle className="text-lg">Adicionar Novo Defeito</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID do Caso de Teste</Label>
                  <Select
                    value={newDefect.caseId}
                    onValueChange={(value) => setNewDefect(prev => ({ ...prev, caseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um caso de teste" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectData.project.testCases.map((testCase) => (
                        <SelectItem key={testCase.id} value={testCase.id}>
                          {testCase.id} - {testCase.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Severidade</Label>
                  <Select
                    value={newDefect.severity}
                    onValueChange={(value) => setNewDefect(prev => ({ ...prev, severity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFECT_SEVERITIES.map((severity) => (
                        <SelectItem key={severity.value} value={severity.value}>
                          <span className={severity.color}>{severity.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Descrição do Defeito</Label>
                  <Textarea
                    placeholder="Descreva o defeito encontrado..."
                    value={newDefect.description}
                    onChange={(e) => setNewDefect(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Input
                    placeholder="Nome do responsável pela correção"
                    value={newDefect.responsible}
                    onChange={(e) => setNewDefect(prev => ({ ...prev, responsible: e.target.value }))}
                  />
                </div>
              </div>
              
              <Button
                onClick={addDefect}
                disabled={!newDefect.caseId || !newDefect.description}
                className="mt-4"
              >
                Adicionar Defeito
              </Button>
            </CardContent>
          </Card>

          {/* Defects List */}
          <div className="space-y-4">
            {projectData.execution.defects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum defeito registrado. Use o formulário acima para adicionar defeitos.
              </p>
            ) : (
              projectData.execution.defects.map((defect, index) => (
                <div key={index} className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">ID do Caso</Label>
                      <Badge variant="outline" className="font-mono">
                        {defect.caseId}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {getTestCaseTitle(defect.caseId)}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Severidade</Label>
                      <Select
                        value={defect.severity}
                        onValueChange={(value) => updateDefect(index, 'severity', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFECT_SEVERITIES.map((severity) => (
                            <SelectItem key={severity.value} value={severity.value}>
                              <span className={severity.color}>{severity.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Status</Label>
                      <Select
                        value={defect.status}
                        onValueChange={(value) => updateDefect(index, 'status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aberto">Aberto</SelectItem>
                          <SelectItem value="Em análise">Em análise</SelectItem>
                          <SelectItem value="Em correção">Em correção</SelectItem>
                          <SelectItem value="Corrigido">Corrigido</SelectItem>
                          <SelectItem value="Fechado">Fechado</SelectItem>
                          <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Responsável</Label>
                      <Input
                        value={defect.responsible}
                        onChange={(e) => updateDefect(index, 'responsible', e.target.value)}
                        placeholder="Responsável"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Ações</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeDefect(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm font-medium">Descrição</Label>
                    <Textarea
                      value={defect.description}
                      onChange={(e) => updateDefect(index, 'description', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};