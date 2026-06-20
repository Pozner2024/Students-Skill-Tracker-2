const PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const testResponse = {
  testTitle: 'Тест по теме',
  variant: 1,
  questions: [
    { type: 'multiple_choice', question: 'Сколько будет 2 + 2?', options: ['3', '4', '5'] },
    { type: 'fill_in_the_blank', question: '___ является основой теста.' },
  ],
}

describe('Прохождение теста', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/users/profile', {
      statusCode: 200,
      body: { id: 1, email: 's@e.com', role: 'student' },
    }).as('profile')
    cy.intercept('GET', '**/api/topics', {
      statusCode: 200,
      body: { success: true, topics: [{ id: 1, name: 'Тема' }] },
    }).as('topics')
    cy.intercept('GET', '**/api/images/**', {
      statusCode: 200,
      body: { success: true, images: { 1: PIXEL } },
    }).as('images')
    cy.intercept('GET', '**/api/tests/test*', { statusCode: 200, body: testResponse }).as('getTest')
  })

  it('открывает тест и рендерит вопросы и изображение', () => {
    cy.visit('/test-page?variant=1&testCode=test1_1&title=%D0%A2%D0%B5%D0%BC%D0%B0', {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth_token', 'test-token')
      },
    })

    cy.location('pathname', { timeout: 10000 }).should('eq', '/test-page')
    cy.get('#questions-panel .question-text', { timeout: 20000 }).should('be.visible')
    cy.get('#questions-panel .question-image img', { timeout: 20000 }).should('exist')
    cy.contains('Вопрос 1 из 2').should('be.visible')
  })
})
