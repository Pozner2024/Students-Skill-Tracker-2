const TOKEN_KEY = 'auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null | undefined): void {
  if (!token || token === 'undefined' || token === 'null') {
    removeToken()
    return
  }
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function hasValidToken(): boolean {
  const token = getToken()
  return !!token && token !== 'undefined' && token !== 'null'
}
