import { http } from "../lib/http";
import { LoginPayload, LoginResponse } from "../types/auth";

export async function loginRequest(payload: LoginPayload) {
  const { data } = await http.post<LoginResponse>("/auth/login", payload);
  return data;
}
