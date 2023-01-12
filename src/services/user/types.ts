export interface User {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  balance: number;
}

export interface UserSlug {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  id: string;
  balance: string;
}
