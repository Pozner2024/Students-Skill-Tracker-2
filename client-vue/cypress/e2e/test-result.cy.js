const PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

// 10 вопросов нужно для ненулевой шкалы баллов (scales[10]).
const questions = [
  { type: 'multiple_choice', question: 'Столица Беларуси?', options: ['Минск', 'Рим'], correct_answer: 'Минск' },
  { type: 'multiple_choice', question: '2 + 2?', options: ['3', '4'], correct_answer: '4' },
  { type: 'multiple_choice', question: 'Цвет неба?', options: ['синий', 'красный'], correct_answer: 'синий' },
  { type: 'multiple_choice', question: 'Сахар сладкий?', options: ['да', 'нет'], correct_answer: 'да' },
  { type: 'fill_in_the_blank', question: 'Столица Франции — ___.', correct_answers: ['Париж'] },
  { type: 'fill_in_the_blank', question: 'Дважды два — ___.', correct_answers: ['четыре'] },
  { type: 'fill_in_the_blank', question: 'Антоним «день» — ___.', correct_answers: ['ночь'] },
  { type: 'fill_in_the_blank', question: 'Вода это H2___.', correct_answers: ['O'] },
  {
    type: 'matching',
    question: 'Страна и столица',
    left_column: ['Беларусь', 'Италия'],
    right_column: ['Минск', 'Рим'],
    correct_matches: { Беларусь: 'Минск', Италия: 'Рим' },
  },
  { type: 'multiple_choice', question: 'Лёд холодный?', options: ['да', 'нет'], correct_answer: 'да' },
]

const mockTest = {
  testCode: 'test1_1',
  testTitle: 'Тема: Тестовые вопросы',
  variant: 1,
  questions: { questions },
}

function answerQuestion(q, index) {
  cy.get(`#questions-panel .question[data-question-index="${index}"]`, { timeout: 20000 })
    .should('be.visible')
    .within(() => {
      if (q.type === 'multiple_choice') {
        cy.get('input[type="radio"]').check(q.correct_answer, { force: true })
      } else if (q.type === 'fill_in_the_blank') {
        q.correct_answers.forEach((ans, i) => {
          cy.get('input[type="text"]').eq(i).clear().type(String(ans))
        })
      } else if (q.type === 'matching') {
        q.left_column.forEach((left) => {
          cy.contains('li', left).find('select').select(q.correct_matches[left])
        })
      }
    })
}

describe('Результат теста', () => {
  it('отвечает правильно и показывает итоги', () => {
    cy.intercept('GET', '**/api/users/profile', {
      statusCode: 200,
      body: { id: 1, email: 's@e.com', role: 'student' },
    }).as('profile')
    cy.intercept('GET', '**/api/images/**', {
      statusCode: 200,
      body: { success: true, images: { 1: PIXEL } },
    }).as('images')
    cy.intercept('GET', '**/api/tests/test*', {
      statusCode: 200,
      body: {
        testCode: mockTest.testCode,
        testTitle: mockTest.testTitle,
        variant: mockTest.variant,
        questions: mockTest.questions,
      },
    }).as('getTest')
    cy.intercept('POST', '**/api/test-results', {
      statusCode: 200,
      body: { result: { max_points: 100, grade: 10 } },
    }).as('saveResult')

    cy.visit('/test-page?variant=1&testCode=test1_1&title=%D0%A2%D0%B5%D0%BC%D0%B0', {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth_token', 'test-token')
      },
    })

    cy.location('pathname', { timeout: 10000 }).should('eq', '/test-page')

    questions.forEach((q, index) => {
      answerQuestion(q, index)
      if (index < questions.length - 1) {
        cy.get(`#questions-panel .question[data-question-index="${index}"] #nextButton`).click({
          force: true,
        })
      }
    })

    cy.get('#finishButton', { timeout: 10000 }).click()
    cy.wait('@saveResult')
    cy.contains('h2', 'Итоги тестирования', { timeout: 20000 }).should('be.visible')
    cy.contains('.progress-container', 'Ваша оценка').should('be.visible')
  })
})
