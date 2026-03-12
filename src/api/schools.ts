import { http } from "../lib/http";
import {
  ApiItemResponse,
  ApiListResponse,
  PaginationParams,
} from "../types/api";
import { School, SchoolFilters, UpsertSchoolPayload } from "../types/school";

export async function getSchools(params?: PaginationParams & SchoolFilters) {
  const { data } = await http.get<ApiListResponse<School>>("/admin/schools", {
    params,
  });
  return data;
}

export async function getSchoolById(id: string) {
  const { data } = await http.get<ApiItemResponse<School>>(
    `/admin/schools/${id}`,
  );
  return data;
}

export async function createSchool(payload: UpsertSchoolPayload) {
  const { data } = await http.post<ApiItemResponse<School>>(
    "/admin/schools",
    payload,
  );
  return data;
}

export async function updateSchool(id: string, payload: UpsertSchoolPayload) {
  const { data } = await http.put<ApiItemResponse<School>>(
    `/admin/schools/${id}`,
    payload,
  );
  return data;
}

export async function archiveSchool(id: string) {
  const { data } = await http.patch<ApiItemResponse<School>>(
    `/admin/schools/${id}/archive`,
  );
  return data;
}
