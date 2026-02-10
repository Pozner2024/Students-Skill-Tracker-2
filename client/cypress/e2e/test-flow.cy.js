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

const testResponse = {
  testTitle: "Тест по теме",
  variant: 1,
  questions: [
    {
      type: "multiple_choice",
      question: "Сколько будет 2 + 2?",
      options: ["3", "4", "5"],
    },
    {
      type: "fill_in_the_blank",
      question: "___ является основой теста.",
    },
  ],
};

const useMocks =
  Cypress.env("USE_MOCKS") === true || Cypress.env("USE_MOCKS") === "true";

describe("Test execution flow", () => {
  beforeEach(() => {
    if (!useMocks) {
      return;
    }

    cy.intercept("GET", "**/api/users/profile", {
      statusCode: 200,
      body: { id: 1, email: "student@example.com", role: "student" },
    }).as("profile");

    cy.intercept("GET", "**/api/topics", {
      statusCode: 200,
      body: topicsResponse,
    }).as("topics");

    cy.intercept("GET", "**/api/images/**", {
      statusCode: 200,
      body: { success: true, images: {} },
    }).as("images");

    cy.intercept("GET", "**/api/tests/test*", {
      statusCode: 200,
      body: testResponse,
    }).as("test");
  });

  it("starts a test from the catalog and renders questions", () => {
    const email = Cypress.env("E2E_EMAIL") || "student@example.com";
    const password = Cypress.env("E2E_PASSWORD") || "Password123!";

    if (!useMocks) {
      expect(email, "E2E_EMAIL is required").to.not.equal("");
      expect(password, "E2E_PASSWORD is required").to.not.equal("");
    }

    if (useMocks) {
      cy.visit("/", {
        onBeforeLoad(win) {
          win.localStorage.setItem("auth_token", "test-token");
        },
      });
    } else {
      cy.request("POST", "/api/auth/login", { email, password }).then(
        (response) => {
          const token =
            response.body?.access_token ||
            response.body?.accessToken ||
            response.body?.token ||
            "";
          expect(token, "auth token").to.not.equal("");

          cy.visit("/", {
            onBeforeLoad(win) {
              win.localStorage.setItem("auth_token", token);
            },
          });
        }
      );
    }

    const openTestPage = (topicId, topicName) => {
      const testCode = `test${topicId}_1`;
      const title = encodeURIComponent(topicName || "Тест");
      cy.visit(`/test-page?variant=1&testCode=${testCode}&title=${title}`);
    };

    if (useMocks) {
      const topic = topicsResponse.topics[0];
      openTestPage(topic.id, topic.name);
    } else {
      cy.request("GET", "/api/topics").then((response) => {
        const topic = response.body?.topics?.[0];
        expect(topic?.id, "topic id").to.exist;
        openTestPage(topic.id, topic.name);
      });
    }

    cy.location("pathname", { timeout: 10000 }).should("eq", "/test-page");
    cy.get("#questions-panel .question-text", { timeout: 20000 }).should(
      "be.visible"
    );
    cy.get("#questions-panel .question-image img", { timeout: 20000 }).should(
      "exist"
    );
  });
});

