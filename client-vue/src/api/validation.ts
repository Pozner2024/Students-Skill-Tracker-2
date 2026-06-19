const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | null {
  if (!email || !EMAIL_RE.test(email)) return 'Введите корректный email адрес'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Введите пароль'
  return null
}

export function validateLoginInput(email: string, password: string): string | null {
  return validateEmail(email) || validatePassword(password) || null
}
