// Модуль для управления ответами пользователя во время прохождения теста.
// Использует фабричную функцию для создания изолированного хранилища ответов.

function createAnswerManager() {
  const answers = {}; // Объект для хранения ответов пользователя

  return {
    // Сохраняет ответ на определенный вопрос
    saveAnswer(questionIndex, answerValue) {
      answers[questionIndex] = answerValue;
    },

    // Получает ответ на определенный вопрос
    getAnswer(questionIndex) {
      return answers[questionIndex];
    },

    // Получает все ответы пользователя
    getAllAnswers() {
      return { ...answers }; // Возвращаем копию для предотвращения мутаций
    },

    // Очищает все ответы пользователя
    clearAnswers() {
      Object.keys(answers).forEach((key) => delete answers[key]);
    },
  };
}

export default createAnswerManager;
