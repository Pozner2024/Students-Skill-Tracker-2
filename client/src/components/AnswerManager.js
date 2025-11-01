// Этот класс AnswerManager предназначен для управления ответами пользователя во время
//  прохождения теста. Он предоставляет методы для сохранения, получения, удаления и
//  извлечения всех ответов пользователя.

class AnswerManager {
  constructor() {
    this.answers = {}; // Объект для хранения ответов пользователя
  }

  // Метод для сохранения ответа на определенный вопрос
  saveAnswer(questionIndex, answerValue) {
    this.answers[questionIndex] = answerValue;
  }

  // Метод для получения ответа на определенный вопрос
  getAnswer(questionIndex) {
    return this.answers[questionIndex];
  }

  // Метод для получения всех ответов пользователя
  getAllAnswers() {
    return this.answers;
  }

  // Метод для очистки всех ответов пользователя
  clearAnswers() {
    this.answers = {};
  }
}

export default AnswerManager;
