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

const selectTestWithAtLeastQuestions = (tests, minQuestions) => {
  const normalizedTests = Array.isArray(tests) ? tests : [];
  return normalizedTests.find((test) => {
    const questions = extractQuestions(test.questions);
    return questions.length >= minQuestions;
  });
};

const dragToIndex = (listSelector, itemText, targetIndex) => {
  const dataTransfer = new DataTransfer();

  cy.get(listSelector).within(() => {
    cy.contains(".draggable-item", itemText)
      .as("dragItem")
      .trigger("dragstart", { dataTransfer, force: true });

    cy.get(".draggable-item").then((items) => {
      const target =
        targetIndex >= items.length ? items[items.length - 1] : items[targetIndex];
      cy.get("@dragItem").then(($dragItem) => {
        const list = items[0]?.parentElement;
        const draggedItem = $dragItem[0];
        if (!list || !draggedItem) return;

        if (target === draggedItem) {
          cy.wrap(list).trigger("drop", { dataTransfer, force: true });
          return;
        }

        list.insertBefore(draggedItem, target);
        cy.wrap(list).trigger("drop", { dataTransfer, force: true });
      });
    });
  });
};

const normalizeAnswer = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[–—−]/g, "-")
    .replace(/°\s*[cс]/gi, "°c")
    .replace(/([+-])\s+(?=\d)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const normalizeCompact = (value) =>
  normalizeAnswer(value).replace(/\s+/g, "");

const matchesAnswer = (candidate, correct) => {
  const a = normalizeAnswer(candidate);
  const b = normalizeAnswer(correct);
  if (!a || !b) return false;
  if (a === b) return true;
  const ac = normalizeCompact(candidate);
  const bc = normalizeCompact(correct);
  return ac === bc || ac.includes(bc) || bc.includes(ac);
};

const waitForStableQuestion = (index) =>
  cy
    .get("#questions-panel .question", { timeout: 20000 })
    .should("have.length", 1)
    .should("have.class", "center")
    .should("have.attr", "data-question-index", String(index))
    .should("be.visible");

const getActiveQuestionRoot = (index) => {
  if (index === undefined || index === null) {
    return cy
      .get("#questions-panel .question.center", { timeout: 20000 })
      .should("be.visible");
  }
  return waitForStableQuestion(index).then(() =>
    cy.get("#questions-panel .question.center")
  );
};

const goToQuestion = (index) => {
  cy.contains("#indicator-panel .page-button", String(index + 1), {
    timeout: 20000,
  }).click({ force: true });
  return waitForStableQuestion(index);
};

const answerQuestion = (question, index) => {
  const questionRoot = getActiveQuestionRoot(index);

  if (question.type === "multiple_choice") {
    const correct = question.correct_answer;
    questionRoot.then(($root) => {
      const inputs = $root.find('input[type="radio"]');
      if (!inputs.length) return;
      let match = Array.from(inputs).find((input) => {
        if (matchesAnswer(input.value, correct)) return true;
        const labelText = input.parentElement?.textContent || "";
        return matchesAnswer(labelText, correct);
      });
      if (!match && Array.isArray(question.options)) {
        const optionIndex = question.options.findIndex((option) =>
          matchesAnswer(option, correct)
        );
        if (optionIndex >= 0 && inputs[optionIndex]) {
          match = inputs[optionIndex];
        }
      }
      expect(match, "correct option input").to.exist;
      cy.wrap(match).check({ force: true });
    });
    return;
  }

  if (question.type === "fill_in_the_blank") {
    const answers = Array.isArray(question.correct_answers)
      ? question.correct_answers
      : [];
    questionRoot.then(($root) => {
      const inputs = $root.find('input[type="text"]');
      if (!inputs.length) return;
      answers.forEach((answer, answerIndex) => {
        const input = inputs[answerIndex];
        if (!input) return;
        cy.wrap(input).clear().type(String(answer));
      });
    });
    return;
  }

  if (question.type === "matching") {
    questionRoot.then(($root) => {
      const items = $root.find("li");
      if (!items.length) return;
      cy.wrap(items).each(($item) => {
        const leftText = $item.find("label").text().trim();
        const normalizedLeft = normalizeAnswer(leftText);
        const matches = question.correct_matches || {};
        const matchedKey =
          Object.keys(matches).find(
            (key) => normalizeAnswer(key) === normalizedLeft
          ) || leftText;
        const correctMatch = matches[matchedKey];
        if (!correctMatch) return;
        cy.wrap($item).find("select").select(String(correctMatch));
      });
    });
    return;
  }

  if (question.type === "ordering") {
    const correctOrder = Array.isArray(question.correctOrder)
      ? question.correctOrder
      : [];
    if (!correctOrder.length) return;

    questionRoot.then(($root) => {
      const list = $root.find(".ordering-list");
      if (!list.length) return;
      const listSelector = `#${list.attr("id")}`;
      correctOrder.forEach((itemText, itemIndex) => {
        dragToIndex(listSelector, itemText, itemIndex);
      });
    });
  }
};

describe("Test result flow (questions 1, 5, 10)", () => {
  it("answers 1st, 5th, 10th questions and shows result", () => {
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
          const selected = selectTestWithAtLeastQuestions(response.body, 10);
          expect(selected, "test with at least 10 questions").to.exist;

          const questions = extractQuestions(selected.questions);
          const testCode = selected.testCode || selected.test_code;
          const testTitle = selected.testTitle || selected.test_title || "Тест";
          const variant = selected.variant || 1;

          expect(testCode, "test code").to.exist;
          expect(questions.length, "questions").to.be.at.least(10);

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

          const targetIndexes = [0, 4, 9];
          cy.wrap(targetIndexes).each((questionIndex) => {
            goToQuestion(questionIndex);
            answerQuestion(questions[questionIndex], questionIndex);
          });

          cy.get("#finishButton", { timeout: 10000 }).click();
          cy.contains("h2", "Итоги тестирования", { timeout: 20000 }).should(
            "be.visible"
          );
          cy.contains(".progress-container", "Ваша оценка").should("be.visible");
        });
      }
    );
  });
});

