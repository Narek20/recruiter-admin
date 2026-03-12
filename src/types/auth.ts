export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: {
    _id?: string;
    uid?: string;
    email?: string;
    displayName?: string;
    roles?: string[];
  } | null;
}
