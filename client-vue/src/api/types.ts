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

export interface UserFile {
  key: string
  fileName: string
  size: number
  lastModified: string
}

export interface FilesResult {
  success: boolean
  files: UserFile[]
  error?: string
}

export interface UploadResult {
  success: boolean
  data?: unknown
  error?: string
}

export interface DeleteResult {
  success: boolean
  message?: string
  error?: string
}

export interface DownloadUrlResult {
  success: boolean
  url?: string
  error?: string
}

export interface TopicProject {
  name?: string
  description?: string
  content?: { projectTitle?: string; content?: string; html?: string }
}

export interface Topic {
  id: number | string
  name?: string
  project?: TopicProject
  questions?: string[]
  content?: unknown
}

export interface TopicsResult {
  success: boolean
  topics: Topic[]
  error?: string
}

export interface TopicResult {
  success: boolean
  topic: Topic | null
  error?: string
}
