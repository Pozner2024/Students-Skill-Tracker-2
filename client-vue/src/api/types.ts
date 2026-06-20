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

export type TestQuestionType =
  | 'multiple_choice'
  | 'fill_in_the_blank'
  | 'ordering'
  | 'matching'

export interface TestQuestionData {
  type: TestQuestionType
  question?: string
  questionDescription?: string
  // multiple_choice
  options?: string[]
  correct_answer?: string
  // fill_in_the_blank
  correct_answers?: string[]
  allow_any_order?: boolean
  // ordering
  sequence?: string[]
  correctOrder?: string[]
  // matching
  left_column?: string[]
  right_column?: string[]
  correct_matches?: Record<string, string>
}

export interface TestData {
  testCode: string
  testTitle: string
  variant: number | string
  questions: TestQuestionData[]
}

export interface TestResultMeta {
  success: boolean
  data: TestData | null
  topicName: string
  error?: string
}

export interface TestImagesResult {
  success: boolean
  images: Record<string, string>
}

export interface TestResultPayload {
  testCode: string
  variant: number
  score: number
  totalQuestions: number
  maxPoints: number
  percentage: number
  grade: number
  answersDetails: unknown[]
}

export interface SavedTestResult {
  max_points?: number
  grade?: number
  [key: string]: unknown
}

export interface AdminTest {
  test_title?: string
  test_code?: string
  variant?: number
  score?: number
  max_points?: number
  total_questions?: number
  grade?: number
  completed_at?: string
  answers_details?: Array<{
    type?: string
    questionNumber?: number
    userAnswer?: unknown
    correct?: unknown
    isCorrect?: boolean
    score?: number
  }>
}

export interface AdminStudent {
  id: number
  fullName?: string
  email?: string
  groupNumber?: string
  tests?: AdminTest[]
  files?: UserFile[]
}

export interface AdminGroup {
  groupNumber: string
  students: AdminStudent[]
}

export interface GroupedResults {
  groups: AdminGroup[]
  noGroup: AdminStudent[]
}

export interface GroupedResultsResult {
  success: boolean
  data: GroupedResults
  error?: string
}
