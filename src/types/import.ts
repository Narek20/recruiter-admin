export type ImportEntity = "schools" | "majors" | "school_majors" | "logos";

export interface ImportErrorRow {
  row: number;
  message: string;
}

export interface ImportDuplicateRow {
  row: number;
  matchedRow: number;
  reason: string;
  identifier?: string | null;
  message: string;
}

export interface ImportResult {
  entity: ImportEntity;
  filename: string;
  processed: number;
  created: number;
  updated: number;
  failed: number;
  skippedDuplicates?: number;
  duplicates?: ImportDuplicateRow[];
  relationCreated?: number;
  relationUpdated?: number;
  errors: ImportErrorRow[];
}

export interface CreateImportPayload {
  entity: ImportEntity;
  file: File;
}
