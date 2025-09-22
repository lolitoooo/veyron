export interface User {
  _id: string; // Propriété MongoDB
  id?: string; // Propriété utilisée par l'API
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  profilePhotoUrl?: string;
  phone?: string;
  birthDate?: string;
  newsletterSubscribed?: boolean;
  smsNotifications?: boolean;
}
