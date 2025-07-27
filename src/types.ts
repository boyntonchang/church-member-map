export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Member {
  memberId: string;
  firstName: string;
  role: string;
  photoUrl: string;
}

export interface Household {
  householdId: string;
  familyName: string;
  address: string;
  coordinates: Coordinates;
  familyPhotoUrl: string;
  householdBio: string;
  ministryInvolvement: string[];
  members: Member[];
  careGroupName: string;
}

export interface ChurchInfo {
  name: string;
  address: string;
  coordinates: Coordinates;
}

export interface ChurchData {
  churchInfo: ChurchInfo;
  households: Household[];
}