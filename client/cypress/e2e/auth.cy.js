const topicsResponse = {
  success: true,
  topics: [
    {
      id: 1,
      name: "Основы кондитерского дела",
      project: {
        name: "Проект 1",
        description: "Описание проекта 1",
      },
    },
  ],
};

const useMocks =
  Cypress.env("USE_MOCKS") === true || Cypress.env("USE_MOCKS") === "true";

describe("Authentication flow", () => {
  it("redirects to login when unauthenticated", () => {
    cy.visit("/");

    cy.location("pathname").should("eq", "/login");
    cy.get("#login-form").should("exist");
    cy.get("#login-btn").should("be.visible");
  });

  it("logs in and shows topics catalog", () => {
    const email = Cypress.env("E2E_EMAIL") || "student@example.com";
    const password = Cypress.env("E2E_PASSWORD") || "Password123!";

    if (!useMocks) {
      expect(email, "E2E_EMAIL is required").to.not.equal("");
      expect(password, "E2E_PASSWORD is required").to.not.equal("");
    } else {
      cy.intercept("POST", "**/api/auth/login", {
        statusCode: 200,
        body: {
          access_token: "test-token",
          user: { id: 1, email: "student@example.com", role: "student" },
        },
      }).as("login");

      cy.intercept("GET", "**/api/users/profile", {
        statusCode: 200,
        body: { id: 1, email: "student@example.com", role: "student" },
      }).as("profile");

      cy.intercept("GET", "**/api/topics", {
        statusCode: 200,
        body: topicsResponse,
      }).as("topics");
    }

    cy.visit("/login");

    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.get("#login-btn").click();

    if (useMocks) {
      cy.wait("@login");
    }

    cy.location("pathname", { timeout: 10000 }).should("eq", "/");
    cy.get("#topics-section", { timeout: 10000 }).should("exist");
  });
});

