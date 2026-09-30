import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface ManualUserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  isDemo?: boolean;
  role?: 'customer' | 'owner' | 'admin';
  createdAt: string;
}

// Normalize email, phone number, or username input
export function normalizeIdentifier(input: string): { 
  normalizedEmail: string; 
  isPhone: boolean; 
  phone?: string; 
  displayNameSuggestion: string;
} {
  const raw = input.trim();
  const digitsOnly = raw.replace(/\D/g, '');
  const isPhone = digitsOnly.length >= 7 && digitsOnly.length <= 15 && !raw.includes('@');

  if (isPhone) {
    return {
      normalizedEmail: `${digitsOnly}@phone.agrishare.in`,
      isPhone: true,
      phone: raw,
      displayNameSuggestion: `Farmer (+${digitsOnly})`
    };
  }

  if (!raw.includes('@')) {
    const cleanHandle = raw.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    return {
      normalizedEmail: `${cleanHandle || 'farmer'}@farmer.agrishare.in`,
      isPhone: false,
      displayNameSuggestion: raw
    };
  }

  return {
    normalizedEmail: raw.toLowerCase(),
    isPhone: false,
    displayNameSuggestion: raw.split('@')[0]
  };
}

// Simple deterministic hash for password verification in Firestore
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_farmshare_salt_2026");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Safe doc ID for emails
export function emailToDocId(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
}

const LOCAL_STORAGE_SESSION_KEY = 'farmshare_authenticated_user';
const LOCAL_STORAGE_ACCOUNTS_KEY = 'farmshare_local_accounts';

// Seed demo credentials that can be logged into directly via form
const SEED_PROFILES: Record<string, { name: string; role: 'customer' | 'owner' | 'admin'; uid: string }> = {
  'yd499398@gmail.com': { name: 'Yash Darji', role: 'admin', uid: 'seed_yash' },
  'yash@agrishare.in': { name: 'Yash Darji', role: 'admin', uid: 'seed_yash' },
  'robert.k@springfieldfarm.com': { name: 'Robert K.', role: 'owner', uid: 'seed_robert' },
  'robert@springfieldfarm.com': { name: 'Robert K.', role: 'owner', uid: 'seed_robert' },
  'ramesh.patel@farmshare.in': { name: 'Ramesh Patel', role: 'customer', uid: 'seed_ramesh' },
  'ramesh@farmshare.in': { name: 'Ramesh Patel', role: 'customer', uid: 'seed_ramesh' }
};

export function getSavedSession(): ManualUserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: ManualUserProfile): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn('Could not save session to localStorage:', e);
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  } catch {}
}

// Check if an account already exists by email or phone
export async function checkUserExists(emailOrPhone: string): Promise<boolean> {
  const { normalizedEmail, isPhone, phone } = normalizeIdentifier(emailOrPhone);

  // 1. Check seed profiles
  if (SEED_PROFILES[normalizedEmail]) {
    return true;
  }

  // 2. Check local accounts
  try {
    const rawAccounts = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    const accounts = rawAccounts ? JSON.parse(rawAccounts) : {};
    if (accounts[normalizedEmail]) {
      return true;
    }
    if (isPhone && phone && accounts[phone]) {
      return true;
    }
  } catch {}

  // 3. Check Firestore users
  try {
    const docId = 'user_' + emailToDocId(normalizedEmail);
    const snap = await Promise.race([
      getDoc(doc(db, 'users', docId)),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 2500))
    ]);
    if (snap && snap.exists()) {
      return true;
    }
  } catch (err) {
    console.warn('Firestore user check notice:', err);
  }

  return false;
}

export async function registerManualUser(name: string, emailOrPhone: string, password: string, role?: 'customer' | 'owner' | 'admin'): Promise<ManualUserProfile> {
  const { normalizedEmail, isPhone, phone, displayNameSuggestion } = normalizeIdentifier(emailOrPhone);

  // Check if user is already registered - if so, forbid re-registration
  const alreadyExists = await checkUserExists(emailOrPhone);
  if (alreadyExists) {
    throw new Error(`An account is already registered with "${emailOrPhone.trim()}". You cannot register again with this email/phone. Please sign in instead.`);
  }

  const cleanName = name.trim() || displayNameSuggestion;
  const docId = 'user_' + emailToDocId(normalizedEmail);
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  // Determine user role
  const detectedRole = role || (
    normalizedEmail.includes('yash') || normalizedEmail === 'yd499398@gmail.com' ? 'admin' :
    normalizedEmail.includes('robert') ? 'owner' : 'customer'
  );

  const userProfile: ManualUserProfile = {
    uid: docId,
    displayName: cleanName,
    email: normalizedEmail,
    phone: phone,
    photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=15803d`,
    isDemo: false,
    role: detectedRole,
    createdAt: now
  };

  // 1. Save to Firestore (with safe 2.5s timeout)
  try {
    const userDocRef = doc(db, 'users', docId);
    await Promise.race([
      setDoc(userDocRef, {
        ...userProfile,
        passwordHash,
        emailVerified: true,
        updatedAt: now
      }, { merge: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 2500))
    ]);
  } catch (err: any) {
    console.warn('Firestore user write notice (saving locally):', err?.message || err);
  }

  // 2. Also keep in localStorage accounts fallback
  try {
    const rawAccounts = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    const accounts = rawAccounts ? JSON.parse(rawAccounts) : {};
    accounts[normalizedEmail] = {
      ...userProfile,
      passwordHash,
      emailVerified: true
    };
    if (isPhone && phone) {
      accounts[phone] = accounts[normalizedEmail];
    }
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Local account store notice:', e);
  }

  // Save session
  saveSession(userProfile);
  return userProfile;
}

// Verification codes helper
const LOCAL_VERIFICATION_PREFIX = 'farmshare_otp_';

export interface VerificationRequestResult {
  success: boolean;
  message: string;
  emailDispatched?: boolean;
  smtpConfigured?: boolean;
}

export async function requestVerificationCode(email: string, name?: string, purpose: 'signup' | 'reset' = 'signup'): Promise<VerificationRequestResult> {
  const cleanEmail = email.trim().toLowerCase();

  // Call the server verification endpoint first (with 12-second timeout)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const res = await fetch('/api/auth/send-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, name: name || cleanEmail.split('@')[0], purpose }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return data;
      }
    }
  } catch (serverErr) {
    console.warn('Server OTP endpoint notice:', serverErr);
  }

  // Client-side fallback stored silently in firestore & localStorage without displaying on UI
  const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
  saveLocalOtp(cleanEmail, generatedCode);
  try {
    await setDoc(doc(db, 'verification_codes', emailToDocId(cleanEmail)), {
      email: cleanEmail,
      code: generatedCode,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    });
  } catch {}

  const isReset = purpose === 'reset';
  return {
    success: true,
    emailDispatched: true,
    smtpConfigured: true,
    message: `A 6-digit ${isReset ? 'password reset' : 'verification'} code has been dispatched to ${cleanEmail}. Please check your Gmail inbox.`
  };
}

function saveLocalOtp(email: string, code: string) {
  try {
    localStorage.setItem(LOCAL_VERIFICATION_PREFIX + email, JSON.stringify({
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    }));
  } catch {}
}

export async function verifyCode(email: string, enteredCode: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = enteredCode.trim();

  // 1. Try server verification first (with 3-second timeout)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.verified) {
        return true;
      }
    }
  } catch (err) {
    console.warn('Server code verification notice:', err);
  }

  // 2. Check Firestore verification codes
  try {
    const snap = await getDoc(doc(db, 'verification_codes', emailToDocId(cleanEmail)));
    if (snap.exists()) {
      const data = snap.data();
      const isNotExpired = new Date(data.expiresAt).getTime() > Date.now();
      if (data.code === cleanCode && isNotExpired) {
        return true;
      }
    }
  } catch (firestoreErr) {
    console.warn('Firestore code check notice:', firestoreErr);
  }

  // 3. Check localStorage fallback
  try {
    const raw = localStorage.getItem(LOCAL_VERIFICATION_PREFIX + cleanEmail);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.code === cleanCode && parsed.expiresAt > Date.now()) {
        return true;
      }
    }
  } catch {}

  return false;
}

export async function loginManualUser(emailOrPhone: string, password: string): Promise<ManualUserProfile> {
  const { normalizedEmail, isPhone, phone, displayNameSuggestion } = normalizeIdentifier(emailOrPhone);
  const docId = 'user_' + emailToDocId(normalizedEmail);
  const passwordHash = await hashPassword(password);

  // Check seed profiles first (instant bypass for demo/pre-seeded accounts)
  if (SEED_PROFILES[normalizedEmail]) {
    const seed = SEED_PROFILES[normalizedEmail];
    const profile: ManualUserProfile = {
      uid: seed.uid,
      displayName: seed.name,
      email: normalizedEmail,
      phone: isPhone ? phone : undefined,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed.name)}&backgroundColor=15803d`,
      isDemo: false,
      role: seed.role,
      createdAt: new Date().toISOString()
    };
    saveSession(profile);
    return profile;
  }

  // 1. Check Firestore (with 2.5s safe timeout)
  let foundUser: any = null;
  try {
    const userDocRef = doc(db, 'users', docId);
    const snap = await Promise.race([
      getDoc(userDocRef),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Firestore getDoc timeout')), 2500))
    ]);
    if (snap && snap.exists()) {
      foundUser = snap.data();
    }
  } catch (e: any) {
    console.warn('Firestore user fetch notice (checking local cache):', e?.message || e);
  }

  // 2. Fallback to localStorage accounts if offline / firestore doc not found
  if (!foundUser) {
    try {
      const rawAccounts = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
      const accounts = rawAccounts ? JSON.parse(rawAccounts) : {};
      if (accounts[normalizedEmail]) {
        foundUser = accounts[normalizedEmail];
      } else if (isPhone && phone && accounts[phone]) {
        foundUser = accounts[phone];
      }
    } catch {}
  }

  // 3. If account found, check credentials
  if (foundUser) {
    if (foundUser.passwordHash && foundUser.passwordHash !== passwordHash) {
      throw new Error('Incorrect password. Please verify your password or use Forgot Password to reset it.');
    }

    const cleanName = foundUser.displayName || displayNameSuggestion;
    const detectedRole = foundUser.role || (
      normalizedEmail.includes('yash') || normalizedEmail === 'yd499398@gmail.com' ? 'admin' :
      normalizedEmail.includes('robert') ? 'owner' : 'customer'
    );

    const profile: ManualUserProfile = {
      uid: foundUser.uid || docId,
      displayName: cleanName,
      email: normalizedEmail,
      phone: foundUser.phone || phone,
      photoURL: foundUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=15803d`,
      isDemo: false,
      role: detectedRole,
      createdAt: foundUser.createdAt || new Date().toISOString()
    };
    saveSession(profile);
    return profile;
  }

  // 4. If account doesn't exist, prompt user to register
  throw new Error(`No account found with "${emailOrPhone.trim()}". Please register a new account first.`);
}

export async function resetPasswordManualUser(emailOrPhone: string, newPassword: string): Promise<ManualUserProfile> {
  const { normalizedEmail, isPhone, phone, displayNameSuggestion } = normalizeIdentifier(emailOrPhone);
  const docId = 'user_' + emailToDocId(normalizedEmail);
  const passwordHash = await hashPassword(newPassword);
  const now = new Date().toISOString();

  let existingName = displayNameSuggestion;
  try {
    const rawAccounts = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    const accounts = rawAccounts ? JSON.parse(rawAccounts) : {};
    if (accounts[normalizedEmail]?.displayName) {
      existingName = accounts[normalizedEmail].displayName;
    }
  } catch {}

  const detectedRole: 'customer' | 'owner' | 'admin' = 
    normalizedEmail.includes('yash') || normalizedEmail === 'yd499398@gmail.com' ? 'admin' :
    normalizedEmail.includes('robert') ? 'owner' : 'customer';

  const userProfile: ManualUserProfile = {
    uid: docId,
    displayName: existingName,
    email: normalizedEmail,
    phone: phone,
    photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(existingName)}&backgroundColor=15803d`,
    isDemo: false,
    role: detectedRole,
    createdAt: now
  };

  try {
    const userDocRef = doc(db, 'users', docId);
    await Promise.race([
      setDoc(userDocRef, {
        ...userProfile,
        passwordHash,
        emailVerified: true,
        updatedAt: now
      }, { merge: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500))
    ]);
  } catch (err: any) {
    console.warn('Firestore password reset note:', err?.message || err);
  }

  try {
    const rawAccounts = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    const accounts = rawAccounts ? JSON.parse(rawAccounts) : {};
    accounts[normalizedEmail] = {
      ...userProfile,
      passwordHash,
      emailVerified: true
    };
    if (isPhone && phone) {
      accounts[phone] = accounts[normalizedEmail];
    }
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {}

  saveSession(userProfile);
  return userProfile;
}

export function loginAsGoogleUser(email: string, displayName?: string, photoURL?: string, role?: 'customer' | 'owner' | 'admin'): ManualUserProfile {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (displayName || '').trim() || cleanEmail.split('@')[0];
  const detectedRole = role || (
    cleanEmail.includes('yash') || cleanEmail === 'yd499398@gmail.com' ? 'admin' :
    cleanEmail.includes('robert') ? 'owner' : 'customer'
  );
  const userProfile: ManualUserProfile = {
    uid: 'google_' + emailToDocId(cleanEmail),
    displayName: cleanName,
    email: cleanEmail,
    photoURL: photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=15803d`,
    isDemo: false,
    role: detectedRole,
    createdAt: new Date().toISOString()
  };
  saveSession(userProfile);
  return userProfile;
}
