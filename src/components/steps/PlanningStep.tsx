import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Calendar, 
  Target, 
  Shield, 
  Server, 
  AlertTriangle, 
  Plus, 
  X, 
  Users,
  Percent
} from "lucide-react";
import { ProjectData } from "../DocumentationWizard";

interface PlanningStepProps {
  projectData: ProjectData;
  updateProjectData: (data: Partial<ProjectData>) => void;
}

const TEST_STRATEGIES = [
  'Teste Funcional',
  'Teste de Integração',
  'Teste de Regressão',
  'Teste de Interface/UI',
  'Teste de API',
  'Teste de Performance',
  'Teste de Segurança',
  'Teste de Usabilidade',
  'Teste de Compatibilidade',
  'Teste de Carga'
];

const PHASE_STATUSES = [
  'Não Iniciado',
  'Em Andamento', 
  'Concluído',
  'Pendente',
  'Bloqueado'
];

export const PlanningStep: React.FC<PlanningStepProps> = ({ projectData, updateProjectData }) => {
  const [newScopeItem, setNewScopeItem] = useState('');
  const [newRiskItem, setNewRiskItem] = useState('');
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<keyof typeof projectData.planning.risks>('technical');

  const updatePlanning = (field: keyof typeof projectData.planning, value: any) => {
    updateProjectData({
      planning: {
        ...projectData.planning,
        [field]: value
      }
    });
  };

  const updatePhase = (index: number, field: string, value: string) => {
    const updatedPhases = [...projectData.planning.phases];
    updatedPhases[index] = { ...updatedPhases[index], [field]: value };
    updatePlanning('phases', updatedPhases);
  };

  const updateEnvironment = (field: keyof typeof projectData.planning.environment, value: string) => {
    updatePlanning('environment', {
      ...projectData.planning.environment,
      [field]: value
    });
  };

  const toggleTestStrategy = (strategy: string) => {
    const current = projectData.planning.testStrategy;
    const updated = current.includes(strategy)
      ? current.filter(s => s !== strategy)
      : [...current, strategy];
    updatePlanning('testStrategy', updated);
  };

  const addScopeItem = (type: 'included' | 'excluded') => {
    if (!newScopeItem.trim()) return;
    
    const field = type === 'included' ? 'scopeIncluded' : 'scopeExcluded';
    const current = projectData.planning[field];
    updatePlanning(field, [...current, newScopeItem.trim()]);
    setNewScopeItem('');
  };

  const removeScopeItem = (type: 'included' | 'excluded', index: number) => {
    const field = type === 'included' ? 'scopeIncluded' : 'scopeExcluded';
    const current = projectData.planning[field];
    updatePlanning(field, current.filter((_, i) => i !== index));
  };

  const addRiskItem = () => {
    if (!newRiskItem.trim()) return;
    
    const current = projectData.planning.risks[selectedRiskCategory];
    updatePlanning('risks', {
      ...projectData.planning.risks,
      [selectedRiskCategory]: [...current, newRiskItem.trim()]
    });
    setNewRiskItem('');
  };

  const removeRiskItem = (category: keyof typeof projectData.planning.risks, index: number) => {
    const current = projectData.planning.risks[category];
    updatePlanning('risks', {
      ...projectData.planning.risks,
      [category]: current.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      {/* Planning Phases */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Planejamento das Etapas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etapa</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Fim</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectData.planning.phases.map((phase, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={phase.phase}
                      onChange={(e) => updatePhase(index, 'phase', e.target.value)}
                      className="border-0 p-2 h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={phase.responsible}
                      onChange={(e) => updatePhase(index, 'responsible', e.target.value)}
                      placeholder="Nome do responsável"
                      className="border-0 p-2 h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={phase.startDate}
                      onChange={(e) => updatePhase(index, 'startDate', e.target.value)}
                      className="border-0 p-2 h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={phase.endDate}
                      onChange={(e) => updatePhase(index, 'endDate', e.target.value)}
                      className="border-0 p-2 h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={phase.status}
                      onValueChange={(value) => updatePhase(index, 'status', value)}
                    >
                      <SelectTrigger className="border-0 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PHASE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Scope */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-success" />
              Funcionalidades a serem testadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar funcionalidade no escopo"
                  value={newScopeItem}
                  onChange={(e) => setNewScopeItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addScopeItem('included')}
                />
                <Button
                  size="sm"
                  onClick={() => addScopeItem('included')}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {projectData.planning.scopeIncluded.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-success/10 rounded border border-success/20">
                    <span className="text-sm">{item}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeScopeItem('included', index)}
                      className="h-auto p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-warning" />
              Fora do escopo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar item fora do escopo"
                  value={newScopeItem}
                  onChange={(e) => setNewScopeItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addScopeItem('excluded')}
                />
                <Button
                  size="sm"
                  onClick={() => addScopeItem('excluded')}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {projectData.planning.scopeExcluded.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-warning/10 rounded border border-warning/20">
                    <span className="text-sm">{item}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeScopeItem('excluded', index)}
                      className="h-auto p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Strategy */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Estratégia de Teste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {TEST_STRATEGIES.map((strategy) => (
              <div key={strategy} className="flex items-center space-x-2">
                <Checkbox
                  id={strategy}
                  checked={projectData.planning.testStrategy.includes(strategy)}
                  onCheckedChange={() => toggleTestStrategy(strategy)}
                />
                <Label htmlFor={strategy} className="text-sm cursor-pointer">
                  {strategy}
                </Label>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Estratégias selecionadas:</p>
            <div className="flex flex-wrap gap-2">
              {projectData.planning.testStrategy.map((strategy) => (
                <Badge key={strategy} variant="secondary">{strategy}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Environment */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Ambiente de Teste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="envDescription">Ambiente necessário</Label>
            <Textarea
              id="envDescription"
              placeholder="Descreva o ambiente de teste necessário"
              value={projectData.planning.environment.description}
              onChange={(e) => updateEnvironment('description', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="envUrl">URL/Acesso</Label>
            <Input
              id="envUrl"
              placeholder="https://ambiente-teste.exemplo.com"
              value={projectData.planning.environment.urlAccess}
              onChange={(e) => updateEnvironment('urlAccess', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="envEquipment">Equipamentos/Configuração</Label>
            <Textarea
              id="envEquipment"
              placeholder="Equipamentos e configurações necessárias"
              value={projectData.planning.environment.equipment}
              onChange={(e) => updateEnvironment('equipment', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Risks */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Riscos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select
                value={selectedRiskCategory}
                onValueChange={(value: keyof typeof projectData.planning.risks) => setSelectedRiskCategory(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Técnicos</SelectItem>
                  <SelectItem value="requirements">Requisitos</SelectItem>
                  <SelectItem value="schedule">Cronograma</SelectItem>
                  <SelectItem value="operational">Operacionais</SelectItem>
                  <SelectItem value="quality">Qualidade</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Adicionar risco"
                value={newRiskItem}
                onChange={(e) => setNewRiskItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRiskItem()}
              />
              <Button onClick={addRiskItem} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {Object.entries(projectData.planning.risks).map(([category, risks]) => (
              <div key={category}>
                <h4 className="font-medium text-sm mb-2 capitalize">
                  {category === 'technical' ? 'Técnicos' :
                   category === 'requirements' ? 'Requisitos' :
                   category === 'schedule' ? 'Cronograma' :
                   category === 'operational' ? 'Operacionais' :
                   'Qualidade'}
                </h4>
                <div className="space-y-2">
                  {risks.map((risk, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-warning/10 rounded border border-warning/20">
                      <span className="text-sm">{risk}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRiskItem(category as keyof typeof projectData.planning.risks, index)}
                        className="h-auto p-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Success Rate Indicator */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Taxa de Sucesso do Projeto (Indicativa)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="successRate">Taxa de Sucesso (0-100%)</Label>
              <Input
                id="successRate"
                type="number"
                min="0"
                max="100"
                value={projectData.planning.successRate}
                onChange={(e) => updatePlanning('successRate', parseInt(e.target.value) || 0)}
                className="w-32"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Este campo é informativo e retrata a qualidade esperada no momento da geração do documento para referência futura.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};