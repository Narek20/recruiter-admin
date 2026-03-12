import { http } from "../lib/http";
import {
  ApiItemResponse,
  ApiListResponse,
  PaginationParams,
} from "../types/api";
import {
  SchoolMajor,
  SchoolMajorFilters,
  UpsertSchoolMajorPayload,
} from "../types/schoolMajor";

export async function getSchoolMajors(
  params?: PaginationParams & SchoolMajorFilters,
) {
  const { data } = await http.get<ApiListResponse<SchoolMajor>>(
    "/admin/school-majors",
    { params },
  );
  return data;
}

export async function createSchoolMajor(payload: UpsertSchoolMajorPayload) {
  const { data } = await http.post<ApiItemResponse<SchoolMajor>>(
    "/admin/school-majors",
    payload,
  );
  return data;
}

export async function updateSchoolMajor(
  id: string,
  payload: UpsertSchoolMajorPayload,
) {
  const { data } = await http.put<ApiItemResponse<SchoolMajor>>(
    `/admin/school-majors/${id}`,
    payload,
  );
  return data;
}

export async function archiveSchoolMajor(id: string) {
  const { data } = await http.patch<ApiItemResponse<SchoolMajor>>(
    `/admin/school-majors/${id}/archive`,
  );
  return data;
}
