export type ImportEntity = "schools" | "majors";

export interface ImportErrorRow {
  row: number;
  message: string;
}

export interface ImportResult {
  entity: ImportEntity;
  filename: string;
  processed: number;
  created: number;
  updated: number;
  failed: number;
  relationCreated?: number;
  relationUpdated?: number;
  errors: ImportErrorRow[];
}

export interface CreateImportPayload {
  entity: ImportEntity;
  file: File;
}
