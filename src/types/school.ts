export interface School {
  id?: string;
  _id?: string;
  externalId?: string;
  slug?: string;
  name: string;
  city: string;
  state: string;
  country?: string;
  logoUrl?: string;
  website?: string;
  division?: string;
  conference?: string;
  tier?: string;
  enrollment?: number | null;
  acceptanceRate?: number | null;
  tuitionInState?: number | null;
  tuitionOutOfState?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
  coachCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolFilters {
  search?: string;
  state?: string;
  division?: string;
  conference?: string;
  tier?: string;
  isActive?: boolean;
}

export interface UpsertSchoolPayload {
  externalId: string;
  name: string;
  city: string;
  state: string;
  country: string;
  logoUrl?: string;
  website?: string;
  division?: string;
  conference?: string;
  tier?: string;
  enrollment?: number | null;
  acceptanceRate?: number | null;
  tuitionInState?: number | null;
  tuitionOutOfState?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
}
