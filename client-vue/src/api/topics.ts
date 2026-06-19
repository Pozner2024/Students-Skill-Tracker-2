import { API_CONFIG } from './config'
import { http } from './http'
import type { Topic, TopicResult, TopicsResult } from './types'

const CACHE_TTL_MS = 5 * 60 * 1000
let topicsCache: Topic[] | null = null
let topicsCacheAt = 0

export async function getTopics(): Promise<TopicsResult> {
  if (topicsCache && Date.now() - topicsCacheAt < CACHE_TTL_MS) {
    return { success: true, topics: topicsCache }
  }
  try {
    const data = await http.publicRequest<{ success?: boolean; topics?: Topic[] }>(
      API_CONFIG.ENDPOINTS.TOPICS,
      { context: 'topics.getTopics' },
    )
    if (data.success && data.topics) {
      topicsCache = data.topics
      topicsCacheAt = Date.now()
      return { success: true, topics: data.topics }
    }
    return { success: false, topics: [], error: 'Неверный формат ответа сервера' }
  } catch (error) {
    return { success: false, topics: [], error: (error as Error).message }
  }
}

export async function getTopic(id: string | number): Promise<TopicResult> {
  try {
    const data = await http.publicRequest<{ success?: boolean; topic?: Topic }>(
      `${API_CONFIG.ENDPOINTS.TOPICS}/${id}`,
      { context: 'topics.getTopic' },
    )
    if (data?.success && data.topic) {
      return { success: true, topic: data.topic }
    }
    return { success: false, topic: null }
  } catch (error) {
    return { success: false, topic: null, error: (error as Error).message }
  }
}
