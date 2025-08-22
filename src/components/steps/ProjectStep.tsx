import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  FileText, 
  TestTube,
  Search,
  Hash
} from "lucide-react";
import { ProjectData } from "../DocumentationWizard";

interface ProjectStepProps {
  projectData: ProjectData;
  updateProjectData: (data: Partial<ProjectData>) => void;
}

export const ProjectStep: React.FC<ProjectStepProps> = ({ projectData, updateProjectData }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const generateId = (prefix: string, existingIds: string[]): string => {
    let counter = 1;
    let newId: string;
    do {
      newId = `${prefix}${counter.toString().padStart(4, '0')}`;
      counter++;
    } while (existingIds.includes(newId));
    return newId;
  };

  const updateProject = (field: keyof typeof projectData.project, value: any) => {
    updateProjectData({
      project: {
        ...projectData.project,
        [field]: value
      }
    });
  };

  // Requirements functions
  const addRequirement = () => {
    const existingIds = projectData.project.requirements.map(req => req.id);
    const newId = generateId('REQ-', existingIds);
    const newRequirement = {
      id: newId,
      description: ''
    };
    updateProject('requirements', [...projectData.project.requirements, newRequirement]);
  };

  const updateRequirement = (index: number, field: keyof typeof projectData.project.requirements[0], value: string) => {
    const updated = [...projectData.project.requirements];
    updated[index] = { ...updated[index], [field]: value };
    updateProject('requirements', updated);
  };

  const removeRequirement = (index: number) => {
    const updated = projectData.project.requirements.filter((_, i) => i !== index);
    updateProject('requirements', updated);
  };

  // Test Cases functions
  const addTestCase = () => {
    const existingIds = projectData.project.testCases.map(tc => tc.id);
    const newId = generateId('CT-', existingIds);
    const newTestCase = {
      id: newId,
      title: '',
      preconditions: '',
      steps: '',
      expectedResult: ''
    };
    updateProject('testCases', [...projectData.project.testCases, newTestCase]);
  };

  const updateTestCase = (index: number, field: keyof typeof projectData.project.testCases[0], value: string) => {
    const updated = [...projectData.project.testCases];
    updated[index] = { ...updated[index], [field]: value };
    updateProject('testCases', updated);
  };

  const removeTestCase = (index: number) => {
    const updated = projectData.project.testCases.filter((_, i) => i !== index);
    updateProject('testCases', updated);
  };

  // Filter functions
  const filteredRequirements = projectData.project.requirements.filter(req =>
    req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTestCases = projectData.project.testCases.filter(tc =>
    tc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tc.steps.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Requisitos
              <Badge variant="secondary">{projectData.project.requirements.length}</Badge>
            </CardTitle>
            <Button onClick={addRequirement} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Requisito
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequirements.length === 0 && projectData.project.requirements.length > 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum requisito encontrado para "{searchTerm}"
              </p>
            ) : filteredRequirements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum requisito adicionado. Clique em "Adicionar Requisito" para começar.
              </p>
            ) : (
              filteredRequirements.map((requirement, index) => {
                const actualIndex = projectData.project.requirements.findIndex(req => req.id === requirement.id);
                return (
                  <div key={requirement.id} className="grid grid-cols-12 gap-4 p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="col-span-12 sm:col-span-2">
                      <Label className="text-sm font-medium">ID</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="font-mono">
                          {requirement.id}
                        </Badge>
                      </div>
                    </div>
                    <div className="col-span-12 sm:col-span-9">
                      <Label className="text-sm font-medium">Descrição do Requisito</Label>
                      <Textarea
                        placeholder="Descreva o requisito..."
                        value={requirement.description}
                        onChange={(e) => updateRequirement(actualIndex, 'description', e.target.value)}
                        className="mt-1 min-h-[80px]"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-1 flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRequirement(actualIndex)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Cases */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-primary" />
              Casos de Teste
              <Badge variant="secondary">{projectData.project.testCases.length}</Badge>
            </CardTitle>
            <Button onClick={addTestCase} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Caso de Teste
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {filteredTestCases.length === 0 && projectData.project.testCases.length > 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum caso de teste encontrado para "{searchTerm}"
              </p>
            ) : filteredTestCases.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum caso de teste adicionado. Clique em "Adicionar Caso de Teste" para começar.
              </p>
            ) : (
              filteredTestCases.map((testCase, index) => {
                const actualIndex = projectData.project.testCases.findIndex(tc => tc.id === testCase.id);
                return (
                  <div key={testCase.id} className="p-4 bg-background/50 rounded-lg border border-border/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="font-mono">
                          {testCase.id}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTestCase(actualIndex)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Título/Descrição</Label>
                        <Input
                          placeholder="Título do caso de teste"
                          value={testCase.title}
                          onChange={(e) => updateTestCase(actualIndex, 'title', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Pré-condições (opcional)</Label>
                        <Input
                          placeholder="Condições necessárias antes da execução"
                          value={testCase.preconditions || ''}
                          onChange={(e) => updateTestCase(actualIndex, 'preconditions', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Passos para Execução</Label>
                        <Textarea
                          placeholder="1. Primeiro passo&#10;2. Segundo passo&#10;3. Terceiro passo..."
                          value={testCase.steps}
                          onChange={(e) => updateTestCase(actualIndex, 'steps', e.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Resultado Esperado</Label>
                        <Textarea
                          placeholder="Descreva o resultado esperado após a execução"
                          value={testCase.expectedResult}
                          onChange={(e) => updateTestCase(actualIndex, 'expectedResult', e.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {projectData.project.testCases.length > 10 && (
            <div className="mt-6 p-4 bg-primary-light/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <strong>Performance:</strong> {projectData.project.testCases.length} casos de teste carregados. 
                A aplicação suporta grandes volumes de dados com virtualização para manter a performance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader>
          <CardTitle className="text-lg">Resumo do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{projectData.project.requirements.length}</div>
              <div className="text-sm text-muted-foreground">Requisitos</div>
            </div>
            <div className="p-4 bg-success/10 rounded-lg">
              <div className="text-2xl font-bold text-success">{projectData.project.testCases.length}</div>
              <div className="text-sm text-muted-foreground">Casos de Teste</div>
            </div>
            <div className="p-4 bg-warning/10 rounded-lg">
              <div className="text-2xl font-bold text-warning">
                {projectData.project.testCases.filter(tc => !tc.title || !tc.steps || !tc.expectedResult).length}
              </div>
              <div className="text-sm text-muted-foreground">Incompletos</div>
            </div>
            <div className="p-4 bg-accent/10 rounded-lg">
              <div className="text-2xl font-bold text-accent">
                {Math.round((projectData.project.testCases.filter(tc => tc.title && tc.steps && tc.expectedResult).length / Math.max(projectData.project.testCases.length, 1)) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Completos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};