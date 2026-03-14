import { http } from "../lib/http";
import { CreateImportPayload, ImportResult } from "../types/import";

const importEndpointByEntity = {
  schools: "/admin/imports/schools",
  majors: "/admin/imports/majors",
  school_majors: "/admin/imports/school-majors",
  logos: "/admin/imports/logos",
} as const;

export async function createImport(payload: CreateImportPayload) {
  const formData = new FormData();
  formData.append("file", payload.file);

  const { data } = await http.post<ImportResult>(
    importEndpointByEntity[payload.entity],
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 0,
    },
  );

  return data;
}
