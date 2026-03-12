import { http } from "../lib/http";
import {
  ApiItemResponse,
  ApiListResponse,
  PaginationParams,
} from "../types/api";
import { CreateImportPayload, ImportJob } from "../types/import";

const importEndpointByEntity = {
  schools: "/admin/imports/schools",
  majors: "/admin/imports/majors",
  school_majors: "/admin/imports/school-majors",
} as const;

export async function getImports(params?: PaginationParams) {
  const { data } = await http.get<ApiListResponse<ImportJob>>(
    "/admin/imports",
    { params },
  );
  return data;
}

export async function createImport(payload: CreateImportPayload) {
  const formData = new FormData();
  formData.append("file", payload.file);

  const { data } = await http.post<ApiItemResponse<ImportJob>>(
    importEndpointByEntity[payload.entity],
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data;
}
