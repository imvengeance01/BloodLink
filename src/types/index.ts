// User Roles
export type UserRole = 'receiver' | 'donor' | 'organization';
export type ReceiverType = 'individual' | 'hospital';
export type OrganizationType = 'blood_bank' | 'ngo';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type UrgencyLevel = 'emergency' | 'within_24_hours' | 'planned';
export type RequestStatus = 'pending' | 'matched' | 'fulfilled' | 'cancelled';
export type StockLevel = 'critical' | 'low' | 'adequate' | 'full';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

// Base User Interface
export interface BaseUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  city: string;
  contactNumber: string;
  createdAt: string;
}

// Receiver User
export interface ReceiverUser extends BaseUser {
  role: 'receiver';
  receiverType: ReceiverType;
  isVerified: boolean;
}

// Donor User
export interface DonorUser extends BaseUser {
  role: 'donor';
  bloodGroup: BloodGroup;
  lastDonationDate?: string;
  cooldownEndDate?: string;
}

// Organization User
export interface OrganizationUser extends BaseUser {
  role: 'organization';
  organizationType: OrganizationType;
  licenseId: string;
}

export type User = ReceiverUser | DonorUser | OrganizationUser;

// Blood Request
export interface BloodRequest {
  id: string;
  receiverId: string;
  receiverName: string;
  receiverContact: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  hospitalName: string;
  city: string;
  urgencyLevel: UrgencyLevel;
  notes?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  donorId?: string;
  donorName?: string;
  donorContact?: string;
  fulfilledBy?: 'donor' | 'organization';
  organizationId?: string;
}

// Donation Record
export interface DonationRecord {
  id: string;
  donorId: string;
  requestId: string;
  receiverName: string;
  bloodGroup: BloodGroup;
  hospitalName: string;
  donationDate: string;
  cooldownEndDate: string;
}

// Blood Inventory
export interface BloodInventoryItem {
  id: string;
  organizationId: string;
  bloodGroup: BloodGroup;
  units: number;
  stockLevel: StockLevel;
  expiryDate: string;
  lastUpdated: string;
}

// Verification Request
export interface VerificationRequest {
  id: string;
  hospitalId: string;
  hospitalName: string;
  hospitalEmail: string;
  city: string;
  status: VerificationStatus;
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

// Cities List
export const CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Chennai',
  'Kolkata',
  'Hyderabad',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Kochi',
  'Bhopal',
  'Patna',
  'Surat',
] as const;

export type City = typeof CITIES[number];

// Blood Group Compatibility Matrix
// Key: Donor blood group, Value: Array of receiver blood groups that can receive
export const BLOOD_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

// Storage Keys
export const STORAGE_KEYS = {
  USERS: 'bloodlink_users',
  REQUESTS: 'bloodlink_requests',
  DONATIONS: 'bloodlink_donations',
  INVENTORY: 'bloodlink_inventory',
  SESSION: 'bloodlink_session',
  VERIFICATIONS: 'bloodlink_verifications',
} as const;
