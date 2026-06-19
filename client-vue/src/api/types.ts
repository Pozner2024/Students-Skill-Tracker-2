export interface User {
  id: number | string
  email: string
  role?: string
  fullName?: string
  groupNumber?: string
  [key: string]: unknown
}

export interface AuthResult {
  success: boolean
  user?: User | null
  token?: string | null
  error?: string
}

export interface CurrentUserResult {
  success: boolean
  user?: User
  error?: string
}

export interface TestResult {
  test_title?: string
  test_code?: string
  completed_at: string
  grade?: number | string
}

export interface UpdateProfileResult {
  success: boolean
  user?: User
  error?: string
}

export interface TestResultsResult {
  success: boolean
  results: TestResult[]
  error?: string
}
