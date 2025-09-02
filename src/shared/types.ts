export type Requirement = { id: string; descricao: string };

export type TestCase = {
	id: string;
	functionality: string;
	testScript?: string;
	preConditions?: string;
	expectedResult?: string;
	extra?: Record<string, unknown>;
};

export type ExecutionEntry = {
	caseId: string;
	status: "Pendente" | "Em execução" | "Aprovado" | "Reprovado" | "Bloqueado";
	evidence?: string;
	extra?: Record<string, unknown>;
};

export type DefectEntry = {
	caseId: string;
	description: string;
	status: string;
	severity: "baixa" | "média" | "alta" | "crítica";
	owner?: string;
	extra?: Record<string, unknown>;
};

export type NormalizedDocument = {
	projectName: string;
	projectVersion: string;
	testResponsible: string;
	startDate: string; // YYYY-MM-DD
	expectedDeliveryDate: string; // YYYY-MM-DD
	planning?: Record<string, unknown>;
	project: {
		requirements: Requirement[];
		testCases: TestCase[];
	};
	execution?: { executions?: ExecutionEntry[]; defects?: DefectEntry[] };
	delivery?: { indicators?: Record<string, unknown>; summary?: string; deliveryDate?: string };
	warnings: Array<{ scope: string; row?: number; type: string; message: string }>;
};