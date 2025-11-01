# Tests API

Этот модуль предоставляет REST API для работы с тестами в системе отслеживания навыков студентов.

## Эндпоинты

### GET /tests

Получить все тесты

- **Ответ**: Массив объектов TestResponseDto

### GET /tests/test?testCode={code}&variant={number}

Получить тест по коду и варианту

- **Параметры**:
  - `testCode` (string) - код теста
  - `variant` (number) - вариант теста
- **Ответ**: TestResponseDto

### GET /tests/code/{testCode}

Получить все варианты теста по коду

- **Параметры**:
  - `testCode` (string) - код теста
- **Ответ**: Массив объектов TestResponseDto

### GET /tests/{id}

Получить тест по ID

- **Параметры**:
  - `id` (number) - ID теста
- **Ответ**: TestResponseDto

### POST /tests

Создать новый тест

- **Тело запроса**: CreateTestDto
- **Ответ**: TestResponseDto (201 Created)

### PUT /tests/{id}

Обновить существующий тест

- **Параметры**:
  - `id` (number) - ID теста
- **Тело запроса**: Partial<CreateTestDto>
- **Ответ**: TestResponseDto

### DELETE /tests/{id}

Удалить тест

- **Параметры**:
  - `id` (number) - ID теста
- **Ответ**: 204 No Content

## DTO

### TestResponseDto

```typescript
{
  id: number;
  testCode: string;
  testTitle: string;
  variant: number;
  questions: any; // JSON объект с вопросами
  createdAt: Date;
}
```

### CreateTestDto

```typescript
{
  testCode: string;
  testTitle: string;
  variant: number;
  questions: any; // JSON объект с вопросами
}
```

### GetTestDto

```typescript
{
  testCode: string;
  variant: number;
}
```

## Примеры использования

### Получение теста

```bash
GET /tests/test?testCode=test1_1&variant=1
```

### Создание теста

```bash
POST /tests
Content-Type: application/json

{
  "testCode": "test1_1",
  "testTitle": "Тема: Организация снабжения",
  "variant": 1,
  "questions": {
    "questions": [
      {
        "type": "multiple_choice",
        "options": ["+4 град.", "0 град.", "–12 град.", "+16 град."],
        "question": "Температура в морозильной камере составляет:",
        "correct_answer": "–12 град."
      }
    ]
  }
}
```

## Обработка ошибок

API возвращает стандартные HTTP коды ошибок:

- `400 Bad Request` - неверные параметры запроса
- `404 Not Found` - тест не найден
- `500 Internal Server Error` - внутренняя ошибка сервера

Все ошибки возвращаются в формате:

```json
{
  "statusCode": number,
  "timestamp": string,
  "path": string,
  "method": string,
  "message": string
}
```
