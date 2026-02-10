const extractQuestions = (rawQuestions) => {
  if (!rawQuestions) return [];
  if (Array.isArray(rawQuestions)) return rawQuestions;
  if (typeof rawQuestions === "string") {
    try {
      const parsed = JSON.parse(rawQuestions);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.questions)) return parsed.questions;
    } catch (e) {
      return [];
    }
  }
  if (Array.isArray(rawQuestions?.questions)) return rawQuestions.questions;
  return [];
};

const waitForStableQuestion = (index) =>
  cy
    .get("#questions-panel .question", { timeout: 20000 })
    .should("have.length", 1)
    .should("have.class", "center")
    .should("have.attr", "data-question-index", String(index))
    .should("be.visible");

const goToQuestion = (index) => {
  cy.contains("#indicator-panel .page-button", String(index + 1), {
    timeout: 20000,
  }).click({ force: true });
  return waitForStableQuestion(index);
};

const stripQuery = (url) => String(url || "").split("?")[0];

const findTestWithImages = (tests) => {
  const queue = Array.isArray(tests) ? [...tests] : [];

  const tryNext = () => {
    const test = queue.shift();
    if (!test) {
      throw new Error("No tests with images found");
    }

    const testCode = test.testCode || test.test_code;
    const variant = test.variant || 1;

    if (!testCode) {
      return tryNext();
    }

    return cy
      .request({
        url: "/api/tests/test-with-images",
        qs: { testCode, variant },
      })
      .then((response) => {
        const images = response.body?.images || {};
        if (images && Object.keys(images).length > 0) {
          return { test, images };
        }
        return tryNext();
      });
  };

  return tryNext();
};

describe("Test images loading", () => {
  it("loads images for questions with images", () => {
    const email = Cypress.env("E2E_EMAIL") || "student@example.com";
    const password = Cypress.env("E2E_PASSWORD") || "Password123!";

    expect(email, "E2E_EMAIL is required").to.not.equal("");
    expect(password, "E2E_PASSWORD is required").to.not.equal("");

    cy.request("POST", "/api/auth/login", { email, password }).then(
      (loginResponse) => {
        const token =
          loginResponse.body?.access_token ||
          loginResponse.body?.accessToken ||
          loginResponse.body?.token ||
          "";
        expect(token, "auth token").to.not.equal("");

        cy.request("GET", "/api/tests").then((response) => {
          const tests = Array.isArray(response.body) ? response.body : [];
          const testsWithQuestions = tests.filter((test) => {
            const questions = extractQuestions(test.questions);
            return questions.length > 0;
          });

          expect(testsWithQuestions.length, "tests with questions").to.be.greaterThan(
            0
          );

          findTestWithImages(testsWithQuestions).then(({ test, images }) => {
            const questions = extractQuestions(test.questions);
            const testCode = test.testCode || test.test_code;
            const testTitle = test.testTitle || test.test_title || "Тест";
            const variant = test.variant || 1;

            expect(testCode, "test code").to.exist;
            expect(questions.length, "questions").to.be.greaterThan(0);

            const titleParam = encodeURIComponent(testTitle);
            cy.visit(
              `/test-page?variant=${variant}&testCode=${encodeURIComponent(
                testCode
              )}&title=${titleParam}`,
              {
                onBeforeLoad(win) {
                  win.localStorage.setItem("auth_token", token);
                },
              }
            );

            cy.location("pathname", { timeout: 10000 }).should("eq", "/test-page");

            const imageEntries = Object.entries(images).slice(0, 3);
            cy.wrap(imageEntries).each(([questionNumber, imageUrl]) => {
              const index = Number(questionNumber) - 1;
              if (!Number.isFinite(index) || index < 0 || index >= questions.length) {
                return;
              }

              goToQuestion(index);
              cy.get(
                "#questions-panel .question.center .question-image img",
                { timeout: 20000 }
              )
                .should("have.attr", "src")
                .then((src) => {
                  expect(stripQuery(src)).to.include(stripQuery(imageUrl));
                });
            });
          });
        });
      }
    );
  });
});

