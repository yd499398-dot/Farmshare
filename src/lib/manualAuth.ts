import { apiFetch } from './api';

export interface ManualUserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  address?: string;
  photoURL?: string;
  isDemo?: boolean;
  role?: 'customer' | 'owner' | 'admin';
  createdAt: string;
}

const SESSION_KEY = 'farmshare_authenticated_user';
const TOKEN_KEY = 'farmshare_access_token';

export function normalizeIdentifier(input: string): { normalizedEmail: string; isPhone: boolean; phone?: string; displayNameSuggestion: string } {
  const raw = input.trim();
  const digitsOnly = raw.replace(/\D/g, '');
  const isPhone = digitsOnly.length >= 7 && digitsOnly.length <= 15 && !raw.includes('@');
  if (isPhone) return { normalizedEmail: `${digitsOnly}@phone.farmshare.in`, isPhone: true, phone: raw, displayNameSuggestion: `Farmer (+${digitsOnly})` };
  if (!raw.includes('@')) {
    const handle = raw.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    return { normalizedEmail: `${handle || 'farmer'}@farmer.farmshare.in`, isPhone: false, displayNameSuggestion: raw };
  }
  return { normalizedEmail: raw.toLowerCase(), isPhone: false, displayNameSuggestion: raw.split('@')[0] };
}

export interface PasswordValidationResult {
  isValid: boolean; hasUpper: boolean; hasLower: boolean; hasNumber: boolean; hasSpecial: boolean; hasMinLength: boolean; score: number; errors: string[];
}

export function validateStrongPassword(password: string): PasswordValidationResult {
  const pwd = password || '';
  const hasUpper = /[A-Z]/.test(pwd), hasLower = /[a-z]/.test(pwd), hasNumber = /[0-9]/.test(pwd), hasSpecial = /[^A-Za-z0-9]/.test(pwd), hasMinLength = pwd.length >= 8;
  const errors: string[] = [];
  if (!hasUpper) errors.push('At least one uppercase letter (A-Z)');
  if (!hasLower) errors.push('At least one lowercase letter (a-z)');
  if (!hasNumber) errors.push('At least one number (0-9)');
  if (!hasSpecial) errors.push('At least one special character (!@#$%^&*...)');
  if (!hasMinLength) errors.push('At least 8 characters');
  return { isValid: errors.length === 0, hasUpper, hasLower, hasNumber, hasSpecial, hasMinLength, score: [hasUpper, hasLower, hasNumber, hasSpecial, hasMinLength].filter(Boolean).length, errors };
}

export function getSavedSession(): ManualUserProfile | null {
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function saveSession(user: ManualUserProfile, token?: string): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
}
export function clearSession(): void { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(TOKEN_KEY); }

export async function checkUserExists(emailOrPhone: string): Promise<boolean> {
  const { normalizedEmail } = normalizeIdentifier(emailOrPhone);
  const data = await apiFetch<{ exists: boolean }>(`/api/auth/check-user?email=${encodeURIComponent(normalizedEmail)}`);
  return !!data.exists;
}

export async function requestVerificationCode(email: string, name?: string, purpose: 'signup' | 'reset' = 'signup') {
  const { normalizedEmail } = normalizeIdentifier(email);
  return apiFetch<{ success: boolean; message: string; emailDispatched?: boolean; smtpConfigured?: boolean }>('/api/auth/send-verification-code', {
    method: 'POST', body: JSON.stringify({ email: normalizedEmail, name, purpose })
  });
}

export async function verifyCode(email: string, enteredCode: string): Promise<boolean> {
  const { normalizedEmail } = normalizeIdentifier(email);
  const data = await apiFetch<{ verified: boolean }>('/api/auth/verify-code', { method: 'POST', body: JSON.stringify({ email: normalizedEmail, code: enteredCode }) });
  return !!data.verified;
}

export async function registerManualUser(name: string, emailOrPhone: string, password: string, role?: 'customer' | 'owner' | 'admin'): Promise<ManualUserProfile> {
  const validation = validateStrongPassword(password);
  if (!validation.isValid) throw new Error(`Password does not meet required criteria: ${validation.errors.join(', ')}`);
  const { normalizedEmail, phone, displayNameSuggestion } = normalizeIdentifier(emailOrPhone);
  const data = await apiFetch<{ user: ManualUserProfile; token: string }>('/api/auth/register', {
    method: 'POST', body: JSON.stringify({ name: name.trim() || displayNameSuggestion, email: normalizedEmail, phone, password, role })
  });
  saveSession(data.user, data.token);
  return data.user;
}

export async function loginManualUser(emailOrPhone: string, password: string): Promise<ManualUserProfile> {
  const { normalizedEmail, phone } = normalizeIdentifier(emailOrPhone);
  const data = await apiFetch<{ user: ManualUserProfile; token: string }>('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ email: normalizedEmail, phone, password })
  });
  saveSession(data.user, data.token);
  return data.user;
}

export async function resetPasswordManualUser(emailOrPhone: string, newPassword: string): Promise<ManualUserProfile> {
  const validation = validateStrongPassword(newPassword);
  if (!validation.isValid) throw new Error(`Password does not meet required criteria: ${validation.errors.join(', ')}`);
  const { normalizedEmail } = normalizeIdentifier(emailOrPhone);
  const data = await apiFetch<{ user: ManualUserProfile; token: string }>('/api/auth/reset-password', {
    method: 'POST', body: JSON.stringify({ email: normalizedEmail, newPassword })
  });
  saveSession(data.user, data.token);
  return data.user;
}

export async function updateManualUserProfile(uid: string, updates: { displayName: string; email: string; phone?: string; address?: string }): Promise<ManualUserProfile> {
  const data = await apiFetch<{ user: ManualUserProfile }>('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(updates) });
  saveSession(data.user);
  return data.user;
}

export async function updateUserPassword(_emailOrUid: string, newPassword: string): Promise<void> {
  const validation = validateStrongPassword(newPassword);
  if (!validation.isValid) throw new Error(`Password does not meet required criteria: ${validation.errors.join(', ')}`);
  await apiFetch('/api/auth/password', { method: 'PATCH', body: JSON.stringify({ newPassword }) });
}

export function clearAllWebsiteDataAndLogins(): void {
  try {
    Object.keys(localStorage).filter(k => k.startsWith('farmshare_') || k.startsWith('firebase:')).forEach(k => localStorage.removeItem(k));
  } catch {}
}

export async function loginAsGoogleUser(email: string, displayName?: string, photoURL?: string, role?: 'customer' | 'owner' | 'admin'): Promise<ManualUserProfile> {
  const data = await apiFetch<{ user: ManualUserProfile; token: string }>('/api/auth/google-profile', {
    method: 'POST', body: JSON.stringify({ email, displayName, photoURL, role })
  });
  saveSession(data.user, data.token);
  return data.user;
}
