const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:9000",
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/e2e/**/*.cy.js",
    viewportWidth: 1280,
    viewportHeight: 720,
    env: {
      USE_MOCKS: false,
      E2E_EMAIL: "test@gmail.com",
      E2E_PASSWORD: "11",
    },
  },
});

