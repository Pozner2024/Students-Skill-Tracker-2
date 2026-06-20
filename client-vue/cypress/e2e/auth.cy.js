const topicsResponse = {
  success: true,
  topics: [{ id: 1, name: 'Основы кондитерского дела', project: { name: 'Проект 1' } }],
}

describe('Аутентификация', () => {
  it('перенаправляет на /login без авторизации', () => {
    cy.visit('/')
    cy.location('pathname').should('eq', '/login')
    cy.get('#email').should('be.visible')
    cy.get('#password').should('be.visible')
    cy.contains('button', 'Войти').should('be.visible')
  })

  it('логинится и показывает каталог тем', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: { access_token: 'test-token', user: { id: 1, email: 's@e.com', role: 'student' } },
    }).as('login')
    cy.intercept('GET', '**/api/users/profile', {
      statusCode: 200,
      body: { id: 1, email: 's@e.com', role: 'student' },
    }).as('profile')
    cy.intercept('GET', '**/api/topics', { statusCode: 200, body: topicsResponse }).as('topics')

    cy.visit('/login')
    cy.get('#email').type('s@e.com')
    cy.get('#password').type('Password123!')
    cy.contains('button', 'Войти').click()

    cy.wait('@login')
    cy.location('pathname', { timeout: 10000 }).should('eq', '/')
    cy.get('#topics-section', { timeout: 10000 }).should('exist')
    cy.contains('Основы кондитерского дела').should('be.visible')
  })
})
