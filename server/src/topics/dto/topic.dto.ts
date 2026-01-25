// DTO (Data Transfer Object) для работы с темами.
// Определяет формат данных для ответов API при получении тем.

export interface TopicDto {
  id: number;
  name: string;
  project: {
    name: string;
    description: string;
    content?: any;
  };
  questions: string[];
  content?: any;
}
