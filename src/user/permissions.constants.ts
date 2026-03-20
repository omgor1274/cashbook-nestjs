export interface UserPermissionsUsers {
  subAdmin: boolean;
  supervisor: boolean;
  worker: boolean;
  vendor: boolean;
}

export interface UserPermissions {
  bills: boolean;
  funds: boolean;
  attendance: boolean;
  users: UserPermissionsUsers;
  salary: boolean;
  invoiceGeneration: boolean;
  bankAccountManagement: boolean;
}

export const createDefaultUserPermissions = (): UserPermissions => ({
  bills: false,
  funds: false,
  attendance: false,
  users: {
    subAdmin: false,
    supervisor: false,
    worker: false,
    vendor: false,
  },
  salary: false,
  invoiceGeneration: false,
  bankAccountManagement: false,
});
