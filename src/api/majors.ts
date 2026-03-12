import { http } from "../lib/http";
import {
  ApiItemResponse,
  ApiListResponse,
  PaginationParams,
} from "../types/api";
import { Major, MajorFilters, UpsertMajorPayload } from "../types/major";

export async function getMajors(params?: PaginationParams & MajorFilters) {
  const { data } = await http.get<ApiListResponse<Major>>("/admin/majors", {
    params,
  });
  return data;
}

export async function getMajorById(id: string) {
  const { data } = await http.get<ApiItemResponse<Major>>(
    `/admin/majors/${id}`,
  );
  return data;
}

export async function createMajor(payload: UpsertMajorPayload) {
  const { data } = await http.post<ApiItemResponse<Major>>(
    "/admin/majors",
    payload,
  );
  return data;
}

export async function updateMajor(id: string, payload: UpsertMajorPayload) {
  const { data } = await http.patch<ApiItemResponse<Major>>(
    `/admin/majors/${id}`,
    payload,
  );
  return data;
}

export async function deleteMajor(id: string) {
  const { data } = await http.delete<ApiItemResponse<Major>>(
    `/admin/majors/${id}`,
  );
  return data;
}
