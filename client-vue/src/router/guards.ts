// Чистая логика редиректов — перенос middleware из старого routerConfig.js.
export const PUBLIC_ROUTES = ['/login', '/about', '/contacts']

export function decideRedirect(
  path: string,
  isAuthenticated: boolean,
  userRole?: string,
): string | null {
  if (!isAuthenticated && !PUBLIC_ROUTES.includes(path)) return '/login'
  if (isAuthenticated && path === '/login') return '/'
  if (path === '/profile' && userRole === 'admin') return '/admin'
  return null
}
