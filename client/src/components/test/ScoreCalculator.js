// Класс ScoreCalculator используется для расчета итогового балла за тест на основе
// ответов пользователя и для вычисления процента отвеченных вопросов. Он также включает
// методы для сравнения ответов пользователя с правильными ответами, учитывая особенности
// каждого типа вопроса (например, вопросы с выбором ответа, вопросы с заполнением пропусков и т.д.)

class ScoreCalculator {
  constructor(testInstance) {
    this.testInstance = testInstance;
    this.lastDetails = [];
    this.scales = {
      10: [8, 8, 8, 10, 10, 10, 10, 10, 10, 16],
      15: [4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 10, 12, 12],
    };
  }

  getMaxScore() {
    const qn = this.testInstance?.questions?.length || 0;
    const scale = this.scales[qn];
    return Array.isArray(scale) ? scale.reduce((a, b) => a + b, 0) : 0;
  }

  normalizeString(str) {
    if (typeof str !== "string") {
      return str;
    }
    return str
      .replace(/&nbsp;/gi, " ")
      .replace(/\u00a0/g, " ")
      .replace(/[–—−]/g, "-")
      .replace(/([+-])\s+(?=\d)/g, "$1")
      .replace(/(\d)\s*-\s*(\d)/g, "$1-$2")
      .replace(/\s*%/g, "%")
      .replace(/°\s*[cс]/gi, "°c")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  normalizeChoiceValue(value) {
    const normalized = this.normalizeString(value);
    return typeof normalized === "string"
      ? normalized
          .replace(/[\u00a0\u202f\u2007]/g, "")
          .replace(/\s+/g, "")
      : normalized;
  }

  isNumericLike(value) {
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value !== "string") return false;
    const trimmed = value.trim();
    if (trimmed === "") return false;
    return /^-?\d+(?:[.,]\d+)?$/.test(trimmed);
  }

  toCanonicalToken(value) {
    if (this.isNumericLike(value)) {
      const num = Number(String(value).replace(",", "."));
      return `##NUM:${Number.isFinite(num) ? num : "NaN"}`;
    }
    return `##STR:${this.normalizeString(String(value))}`;
  }

  compareCanonicalArrays(arr1, arr2, allowAnyOrder = false) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
    const norm1 = arr1.map((v) => this.toCanonicalToken(v));
    const norm2 = arr2.map((v) => this.toCanonicalToken(v));
    return allowAnyOrder
      ? norm1.length === norm2.length &&
          norm1.every((item) => norm2.includes(item))
      : norm1.length === norm2.length &&
          norm1.every((item, i) => item === norm2[i]);
  }

  levenshteinDistance(str1, str2) {
    const dp = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i++) dp[0][i] = i;
    for (let j = 0; j <= str2.length; j++) dp[j][0] = j;
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[j][i] = Math.min(
          dp[j][i - 1] + 1,
          dp[j - 1][i] + 1,
          dp[j - 1][i - 1] + indicator
        );
        if (
          i > 1 &&
          j > 1 &&
          str1[i - 1] === str2[j - 2] &&
          str1[i - 2] === str2[j - 1]
        ) {
          dp[j][i] = Math.min(dp[j][i], dp[j - 2][i - 2] + indicator);
        }
      }
    }
    return dp[str2.length][str1.length];
  }

  jaccardSimilarityForWords(userAnswer, correctAnswer, maxDistance = 3) {
    const userWords = userAnswer.toLowerCase().split(" ");
    const correctWords = correctAnswer.toLowerCase().split(" ");
    const matchedWords = correctWords.filter((correctWord) =>
      userWords.some(
        (userWord) =>
          this.levenshteinDistance(userWord, correctWord) <= maxDistance
      )
    );
    const unionSize = new Set([...userWords, ...correctWords]).size;
    return matchedWords.length / unionSize >= 0.5;
  }

  compareArrays(arr1, arr2, allowAnyOrder = false) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
      return false;
    }

    const normArr1 = arr1.map(this.normalizeString);
    const normArr2 = arr2.map(this.normalizeString);

    return allowAnyOrder
      ? normArr1.length === normArr2.length &&
          normArr1.every((item) => normArr2.includes(item))
      : normArr1.length === normArr2.length &&
          normArr1.every((item, index) => item === normArr2[index]);
  }

  calculateTotalScore(userAnswers) {
    const questions = this.testInstance.questions;
    const questionCount = questions.length;
    const scale = this.scales[questionCount];

    if (!scale) {
      return 0;
    }

    const details = [];
    let totalScore = questions.reduce((acc, question, index) => {
      const userAnswer = userAnswers[index];
      let isCorrect = false;
      let questionScore = 0;

      switch (question.type) {
        case "multiple_choice":
          isCorrect =
            this.normalizeString(userAnswer) ===
              this.normalizeString(question.correct_answer) ||
            this.normalizeChoiceValue(userAnswer) ===
              this.normalizeChoiceValue(question.correct_answer);
          questionScore = isCorrect ? scale[index] : 0;
          details.push({
            questionNumber: index + 1,
            type: "multiple_choice",
            userAnswer,
            correct: question.correct_answer,
            isCorrect,
            score: questionScore,
          });
          break;

        case "fill_in_the_blank":
          if (
            Array.isArray(userAnswer) &&
            Array.isArray(question.correct_answers)
          ) {
            const hasNumeric = question.correct_answers.some((v) =>
              this.isNumericLike(v)
            );
            if (hasNumeric) {
              isCorrect = this.compareCanonicalArrays(
                userAnswer,
                question.correct_answers,
                question.allow_any_order
              );
            } else {
              isCorrect =
                this.compareArrays(
                  userAnswer,
                  question.correct_answers,
                  question.allow_any_order
                ) ||
                this.jaccardSimilarityForWords(
                  userAnswer.join(" "),
                  question.correct_answers.join(" ")
                );
            }
            questionScore = isCorrect ? scale[index] : 0;
            details.push({
              questionNumber: index + 1,
              type: "fill_in_the_blank",
              userAnswer,
              correct: question.correct_answers,
              isCorrect,
              score: questionScore,
            });
          }
          break;

        case "matching":
          if (
            typeof userAnswer === "object" &&
            typeof question.correct_matches === "object"
          ) {
            isCorrect = Object.keys(question.correct_matches).every(
              (key) =>
                this.normalizeString(userAnswer[key]) ===
                this.normalizeString(question.correct_matches[key])
            );
            questionScore = isCorrect ? scale[index] : 0;
            details.push({
              questionNumber: index + 1,
              type: "matching",
              userAnswer,
              correct: question.correct_matches,
              isCorrect,
              score: questionScore,
            });
          }
          break;

        case "ordering":
          if (
            Array.isArray(userAnswer) &&
            Array.isArray(question.correctOrder)
          ) {
            const correctOrder = question.correctOrder;
            const matches = userAnswer.reduce(
              (acc, item, i) => acc + (item === correctOrder[i] ? 1 : 0),
              0
            );
            const matchPercentage = (matches / correctOrder.length) * 100;

            if (matchPercentage > 50) {
              questionScore = scale[index];
            } else if (matchPercentage === 50) {
              questionScore = scale[index] * 0.5;
            }

            details.push({
              questionNumber: index + 1,
              type: "ordering",
              userAnswer,
              correct: correctOrder,
              isCorrect: questionScore > 0,
              score: questionScore,
              matchPercentage,
            });
          }
          break;

        default:
          break;
      }

      return acc + questionScore;
    }, 0);

    this.lastDetails = details;
    return totalScore;
  }

  getAnsweredPercentage(userAnswers) {
    const totalQuestions = this.testInstance.questions.length;
    const answeredQuestionsCount = userAnswers.filter(
      (answer) => answer !== undefined
    ).length;
    return totalQuestions ? (answeredQuestionsCount / totalQuestions) * 100 : 0;
  }

  getGrade(scorePercent, questionCount) {
    const gradingScale = {
      10: [
        [1, 8, 1],
        [9, 16, 2],
        [17, 27, 3],
        [28, 38, 4],
        [39, 49, 5],
        [50, 65, 6],
        [66, 76, 7],
        [86, 90, 8],
        [91, 95, 9],
        [96, 100, 10],
      ],
      15: [
        [1, 8, 1],
        [9, 16, 2],
        [17, 26, 3],
        [27, 36, 4],
        [37, 48, 5],
        [49, 59, 6],
        [60, 70, 7],
        [71, 80, 8],
        [81, 91, 9],
        [92, 100, 10],
      ],
    };

    const percent = Number.isFinite(scorePercent) ? scorePercent : 0;
    const normalized = Math.max(0, Math.min(100, percent));
    const scale = gradingScale[questionCount] || gradingScale[10];

    if (normalized === 0) {
      return 1;
    }

    return (
      scale.find(([min, max]) => normalized >= min && normalized <= max)?.[2] ||
      1
    );
  }
}

export default ScoreCalculator;
