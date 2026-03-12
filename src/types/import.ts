export type ImportEntity = "schools" | "majors" | "school_majors";

export interface ImportJob {
  id?: string;
  _id?: string;
  entity: ImportEntity;
  fileName: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalRows?: number;
  importedRows?: number;
  failedRows?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateImportPayload {
  entity: ImportEntity;
  file: File;
}
