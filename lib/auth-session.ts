const USER_ID_KEY = 'chope:userId'
const LAST_EMAIL_KEY = 'chope:lastEmail'
const LEGACY_SESSION_USER_ID_KEY = 'userId'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getStoredUserId(): string | null {
  if (!isBrowser()) return null
  return localStorage.getItem(USER_ID_KEY)
}

export function setStoredUserId(id: string): void {
  if (!isBrowser()) return
  localStorage.setItem(USER_ID_KEY, id)
}

export function getLastEmail(): string | null {
  if (!isBrowser()) return null
  return localStorage.getItem(LAST_EMAIL_KEY)
}

export function setLastEmail(email: string): void {
  if (!isBrowser()) return
  localStorage.setItem(LAST_EMAIL_KEY, email.trim().toLowerCase())
}

export function clearAuthSession(): void {
  if (!isBrowser()) return
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(LAST_EMAIL_KEY)
}

/** One-time upgrade from sessionStorage for users who logged in before this change. */
export function migrateSessionFromSessionStorage(): void {
  if (!isBrowser()) return
  const legacyId = sessionStorage.getItem(LEGACY_SESSION_USER_ID_KEY)
  if (!legacyId) return
  if (!localStorage.getItem(USER_ID_KEY)) {
    localStorage.setItem(USER_ID_KEY, legacyId)
  }
  sessionStorage.removeItem(LEGACY_SESSION_USER_ID_KEY)
}
