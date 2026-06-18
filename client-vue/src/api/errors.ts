export const ERROR_MESSAGES = {
  network: 'Проблема с подключением к серверу. Проверьте интернет-соединение.',
  timeout: 'Превышено время ожидания ответа от сервера.',
  fetch: 'Ошибка при выполнении запроса к серверу.',
  unauthorized: 'Вы не авторизованы. Пожалуйста, войдите в систему.',
  forbidden: 'У вас нет доступа к этому ресурсу.',
  tokenExpired: 'Ваша сессия истекла. Пожалуйста, войдите снова.',
  validation: 'Проверьте правильность введенных данных.',
  server: 'Ошибка на сервере. Попробуйте позже.',
  notFound: 'Запрашиваемый ресурс не найден.',
  conflict: 'Конфликт данных. Возможно, запись уже существует.',
  unknown: 'Произошла неизвестная ошибка. Попробуйте еще раз.',
} as const

export function isAuthError(error: unknown): boolean {
  const raw =
    typeof error === 'string'
      ? error
      : ((error as { message?: string; error?: string })?.message ??
        (error as { error?: string })?.error ??
        '')
  const message = String(raw).toLowerCase()
  return (
    message.includes('unauthorized') ||
    message.includes('401') ||
    message.includes('токен') ||
    message.includes('сессия') ||
    message.includes('авторизац')
  )
}

export function getErrorMessage(error: unknown, context = ''): string {
  if (typeof error === 'string') return error

  if (error && typeof error === 'object') {
    const obj = error as { error?: unknown; message?: string; success?: boolean }
    if (obj.error) return getErrorMessage(obj.error, context)
    if (obj.success === false) return obj.message || ERROR_MESSAGES.unknown
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed to fetch')
    )
      return ERROR_MESSAGES.network
    if (message.includes('timeout') || message.includes('время ожидания'))
      return ERROR_MESSAGES.timeout
    if (
      message.includes('unauthorized') ||
      message.includes('401') ||
      message.includes('токен') ||
      message.includes('сессия')
    )
      return ERROR_MESSAGES.tokenExpired
    if (message.includes('forbidden') || message.includes('403') || message.includes('доступ'))
      return ERROR_MESSAGES.forbidden
    if (message.includes('500') || message.includes('internal server error'))
      return ERROR_MESSAGES.server
    if (message.includes('404') || message.includes('not found') || message.includes('не найден'))
      return ERROR_MESSAGES.notFound
    if (message.includes('409') || message.includes('conflict') || message.includes('конфликт'))
      return ERROR_MESSAGES.conflict
    if (error.message && error.message.length < 200) return error.message
  }

  return context ? `${ERROR_MESSAGES.unknown} (${context})` : ERROR_MESSAGES.unknown
}
