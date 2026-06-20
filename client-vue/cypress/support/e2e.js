// Глобальные хуки Cypress.
// Подавляем падение тестов из-за посторонних ошибок страницы (HMR/антивирус/CKEditor warnings).
Cypress.on('uncaught:exception', () => false)
