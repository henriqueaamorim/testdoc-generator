import type { ProjectData } from "@/components/DocumentationWizard";

export function backendToProjectData(doc: any): ProjectData {
	return {
		projectName: doc.projectName || "",
		projectVersion: doc.projectVersion || "",
		testResponsible: doc.testResponsible || "",
		startDate: doc.startDate || "",
		expectedDeliveryDate: doc.expectedDeliveryDate || "",
		planning: {
			phases: [],
			scopeIncluded: [],
			scopeExcluded: [],
			testStrategy: [],
			environment: { description: "", urlAccess: "", equipment: "" },
			risks: { technical: [], requirements: [], schedule: [], operational: [], quality: [] },
			successRate: 0,
		},
		project: {
			requirements: (doc.project?.requirements || []).map((r: any) => ({ id: r.id || "", description: r.descricao || r.description || "" })),
			testCases: (doc.project?.testCases || []).map((c: any) => ({ id: c.id || "", functionality: c.functionality || "", testScript: c.testScript || "" })),
		},
		execution: { executions: doc.execution?.executions || [], defects: doc.execution?.defects || [] },
		delivery: { indicators: doc.delivery?.indicators || { planned: 0, executed: 0, openDefects: 0, fixedDefects: 0, successRate: 0 }, summary: doc.delivery?.summary || "", deliveryDate: doc.delivery?.deliveryDate || "", finalStatus: (doc.delivery as any)?.finalStatus || "" },
	};
}

export function projectDataToBackend(doc: ProjectData): any {
	return {
		projectName: doc.projectName,
		projectVersion: doc.projectVersion,
		testResponsible: doc.testResponsible,
		startDate: doc.startDate,
		expectedDeliveryDate: doc.expectedDeliveryDate,
		planning: {},
		project: {
			requirements: doc.project.requirements.map((r) => ({ id: r.id, descricao: r.description })),
			testCases: doc.project.testCases.map((c) => ({ id: c.id, functionality: c.functionality, testScript: c.testScript })),
		},
		execution: { executions: doc.execution.executions, defects: doc.execution.defects },
		delivery: { indicators: doc.delivery.indicators, summary: doc.delivery.summary, deliveryDate: doc.delivery.deliveryDate },
	};
}