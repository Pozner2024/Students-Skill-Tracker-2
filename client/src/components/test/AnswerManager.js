// Модуль для управления ответами пользователя во время прохождения теста.
// Использует фабричную функцию для создания изолированного хранилища ответов.

function createAnswerManager() {
  const answers = {};

  return {
    saveAnswer(questionIndex, answerValue) {
      answers[questionIndex] = answerValue;
    },

    getAnswer(questionIndex) {
      return answers[questionIndex];
    },

    getAllAnswers() {
      return { ...answers };
    },

    clearAnswers() {
      Object.keys(answers).forEach((key) => delete answers[key]);
    },
  };
}

export default createAnswerManager;
