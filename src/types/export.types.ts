export interface ExportOptions {
  formats: ExportFormat[];
  sections: ExportSection[];
}

export type ExportFormat = 'pdf' | 'excel' | 'json' | 'markdown';

export interface ExportSection {
  id: string;
  name: string;
  enabled: boolean;
}

export interface ExportProgress {
  format: ExportFormat;
  progress: number;
  status: 'pending' | 'generating' | 'complete' | 'error';
}