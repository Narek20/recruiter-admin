import { http } from "../lib/http";
import {
  CreateImportPayload,
  ImportDuplicateRow,
  ImportErrorRow,
  ImportResult,
} from "../types/import";

const importEndpointByEntity = {
  schools: "/admin/imports/schools",
  majors: "/admin/imports/majors",
  school_majors: "/admin/imports/school-majors",
  logos: "/admin/imports/logos",
} as const;

const CHUNKED_IMPORT_ROW_LIMITS: Partial<Record<CreateImportPayload["entity"], number>> = {
  majors: 250,
  school_majors: 250,
};

async function uploadImportFile(entity: CreateImportPayload["entity"], file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await http.post<ImportResult>(importEndpointByEntity[entity], formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 0,
  });

  return data;
}

function parseCsvRecords(csvText: string) {
  const records: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];

    if (char === '"') {
      if (inQuotes && csvText[index + 1] === '"') {
        current += '""';
        index += 1;
      } else {
        inQuotes = !inQuotes;
        current += char;
      }
      continue;
    }

    if (!inQuotes && char === "\n") {
      if (current.endsWith("\r")) {
        current = current.slice(0, -1);
      }
      records.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    records.push(current);
  }

  return records;
}

function createChunkFile(file: File, header: string, rows: string[], chunkIndex: number) {
  const csvContent = `${header}\n${rows.join("\n")}`;
  const extensionIndex = file.name.lastIndexOf(".");
  const baseName = extensionIndex >= 0 ? file.name.slice(0, extensionIndex) : file.name;
  const extension = extensionIndex >= 0 ? file.name.slice(extensionIndex) : ".csv";

  return new File([csvContent], `${baseName}.part-${chunkIndex}${extension}`, {
    type: file.type || "text/csv",
  });
}

function offsetErrorRows(errors: ImportErrorRow[], rowOffset: number) {
  return errors.map((error) => ({
    ...error,
    row: error.row + rowOffset,
  }));
}

function offsetDuplicateRows(duplicates: ImportDuplicateRow[] = [], rowOffset: number) {
  return duplicates.map((duplicate) => ({
    ...duplicate,
    row: duplicate.row + rowOffset,
    matchedRow: duplicate.matchedRow + rowOffset,
  }));
}

async function uploadChunkedImport(payload: CreateImportPayload, maxRowsPerChunk: number) {
  const csvText = await payload.file.text();
  const records = parseCsvRecords(csvText);

  if (records.length <= 2) {
    return uploadImportFile(payload.entity, payload.file);
  }

  const [header, ...dataRows] = records;
  const totalRows = dataRows.length;
  const totalChunks = Math.ceil(totalRows / maxRowsPerChunk);
  let aggregatedResult: ImportResult | null = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    const start = chunkIndex * maxRowsPerChunk;
    const chunkRows = dataRows.slice(start, start + maxRowsPerChunk);
    const chunkFile = createChunkFile(payload.file, header, chunkRows, chunkIndex + 1);

    payload.onProgress?.({
      chunkIndex: chunkIndex + 1,
      totalChunks,
      rowsInChunk: chunkRows.length,
      uploadedRows: start,
      totalRows,
    });

    const chunkResult = await uploadImportFile(payload.entity, chunkFile);
    const rowOffset = start;

    if (!aggregatedResult) {
      aggregatedResult = {
        ...chunkResult,
        filename: payload.file.name,
        processed: 0,
        created: 0,
        updated: 0,
        failed: 0,
        skippedDuplicates: 0,
        relationCreated: 0,
        relationUpdated: 0,
        duplicates: [],
        errors: [],
      };
    }

    aggregatedResult.processed += chunkResult.processed;
    aggregatedResult.created += chunkResult.created;
    aggregatedResult.updated += chunkResult.updated;
    aggregatedResult.failed += chunkResult.failed;
    aggregatedResult.skippedDuplicates =
      (aggregatedResult.skippedDuplicates || 0) + (chunkResult.skippedDuplicates || 0);
    aggregatedResult.relationCreated =
      (aggregatedResult.relationCreated || 0) + (chunkResult.relationCreated || 0);
    aggregatedResult.relationUpdated =
      (aggregatedResult.relationUpdated || 0) + (chunkResult.relationUpdated || 0);
    aggregatedResult.errors.push(...offsetErrorRows(chunkResult.errors, rowOffset));
    aggregatedResult.duplicates?.push(
      ...offsetDuplicateRows(chunkResult.duplicates, rowOffset),
    );

    payload.onProgress?.({
      chunkIndex: chunkIndex + 1,
      totalChunks,
      rowsInChunk: chunkRows.length,
      uploadedRows: Math.min(start + chunkRows.length, totalRows),
      totalRows,
    });
  }

  if (!aggregatedResult) {
    return uploadImportFile(payload.entity, payload.file);
  }

  return aggregatedResult;
}

export async function createImport(payload: CreateImportPayload) {
  const maxRowsPerChunk = CHUNKED_IMPORT_ROW_LIMITS[payload.entity];

  if (maxRowsPerChunk) {
    return uploadChunkedImport(payload, maxRowsPerChunk);
  }

  return uploadImportFile(payload.entity, payload.file);
}
