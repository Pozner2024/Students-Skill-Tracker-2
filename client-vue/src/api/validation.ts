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

const GROUP_RE = /^(?:\d-\d{2}|\d{2}-\d{2})$/

export function validateGroupNumber(group: string): string | null {
  if (group && !GROUP_RE.test(group)) return 'Номер группы должен быть в формате X-XX или XX-XX'
  return null
}
