import {
  User,
  BloodRequest,
  DonationRecord,
  BloodInventoryItem,
  VerificationRequest,
  STORAGE_KEYS,
} from '@/types';

// Generic storage helpers
function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Users
export function getUsers(): User[] {
  return getFromStorage<User>(STORAGE_KEYS.USERS);
}

export function saveUser(user: User): void {
  const users = getUsers();
  const existingIndex = users.findIndex((u) => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  setToStorage(STORAGE_KEYS.USERS, users);
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

// Session
export function getSession(): User | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setSession(user: User | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

// Blood Requests
export function getRequests(): BloodRequest[] {
  return getFromStorage<BloodRequest>(STORAGE_KEYS.REQUESTS);
}

export function saveRequest(request: BloodRequest): void {
  const requests = getRequests();
  const existingIndex = requests.findIndex((r) => r.id === request.id);
  if (existingIndex >= 0) {
    requests[existingIndex] = request;
  } else {
    requests.push(request);
  }
  setToStorage(STORAGE_KEYS.REQUESTS, requests);
}

export function getRequestById(id: string): BloodRequest | undefined {
  return getRequests().find((r) => r.id === id);
}

export function getRequestsByReceiver(receiverId: string): BloodRequest[] {
  return getRequests().filter((r) => r.receiverId === receiverId);
}

export function getRequestsByCity(city: string): BloodRequest[] {
  return getRequests().filter((r) => r.city === city && r.status === 'pending');
}

// Donations
export function getDonations(): DonationRecord[] {
  return getFromStorage<DonationRecord>(STORAGE_KEYS.DONATIONS);
}

export function saveDonation(donation: DonationRecord): void {
  const donations = getDonations();
  donations.push(donation);
  setToStorage(STORAGE_KEYS.DONATIONS, donations);
}

export function getDonationsByDonor(donorId: string): DonationRecord[] {
  return getDonations().filter((d) => d.donorId === donorId);
}

// Inventory
export function getInventory(): BloodInventoryItem[] {
  return getFromStorage<BloodInventoryItem>(STORAGE_KEYS.INVENTORY);
}

export function saveInventoryItem(item: BloodInventoryItem): void {
  const inventory = getInventory();
  const existingIndex = inventory.findIndex((i) => i.id === item.id);
  if (existingIndex >= 0) {
    inventory[existingIndex] = item;
  } else {
    inventory.push(item);
  }
  setToStorage(STORAGE_KEYS.INVENTORY, inventory);
}

export function getInventoryByOrganization(orgId: string): BloodInventoryItem[] {
  return getInventory().filter((i) => i.organizationId === orgId);
}

export function getInventoryByCity(city: string): BloodInventoryItem[] {
  const users = getUsers();
  const orgIds = users
    .filter((u) => u.role === 'organization' && u.city === city)
    .map((u) => u.id);
  return getInventory().filter((i) => orgIds.includes(i.organizationId));
}

// Verifications
export function getVerifications(): VerificationRequest[] {
  return getFromStorage<VerificationRequest>(STORAGE_KEYS.VERIFICATIONS);
}

export function saveVerification(verification: VerificationRequest): void {
  const verifications = getVerifications();
  const existingIndex = verifications.findIndex((v) => v.id === verification.id);
  if (existingIndex >= 0) {
    verifications[existingIndex] = verification;
  } else {
    verifications.push(verification);
  }
  setToStorage(STORAGE_KEYS.VERIFICATIONS, verifications);
}

export function getPendingVerifications(): VerificationRequest[] {
  return getVerifications().filter((v) => v.status === 'pending');
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
