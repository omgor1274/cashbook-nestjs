export enum SalaryCycle {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export interface UserAddressDetails {
  pincode?: number;
  city?: string;
  state?: string;
  building?: string;
  landmark?: string;
}

export interface UserEmergencyContact {
  fullname?: string;
  phonenumber?: number;
  relation?: string;
}

export const createDefaultAddressDetails = (): UserAddressDetails => ({
  pincode: undefined,
  city: '',
  state: '',
  building: '',
  landmark: '',
});

export const createDefaultEmergencyContact = (): UserEmergencyContact => ({
  fullname: '',
  phonenumber: undefined,
  relation: '',
});
