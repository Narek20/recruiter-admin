export interface Major {
  id?: string;
  _id?: string;
  externalId?: string;
  name: string;
  category?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MajorFilters {
  query?: string;
  category?: string;
  isActive?: boolean;
}

export interface UpsertMajorPayload {
  externalId?: string;
  name: string;
  category?: string;
  isActive?: boolean;
}
