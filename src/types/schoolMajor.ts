export interface SchoolMajor {
  id?: string;
  _id?: string;
  schoolId: string;
  majorId: string;
  schoolName?: string;
  majorName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolMajorFilters {
  schoolId?: string;
  majorId?: string;
  isActive?: boolean;
}

export interface UpsertSchoolMajorPayload {
  schoolId: string;
  majorId: string;
  isActive?: boolean;
}
