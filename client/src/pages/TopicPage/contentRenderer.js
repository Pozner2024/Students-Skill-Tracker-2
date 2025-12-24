import { extractTextFromContent } from "./contentExtractor.js";

function sanitizeHtml(html) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const allowedTags = [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
    "span",
    "div",
    "pre",
    "code",
  ];

  const scripts = tempDiv.querySelectorAll(
    "script, iframe, object, embed, form, input"
  );
  scripts.forEach((el) => el.remove());

  const allElements = tempDiv.querySelectorAll("*");
  allElements.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name !== "href" && attr.name !== "class" && attr.name !== "id") {
        el.removeAttribute(attr.name);
      }
      if (
        attr.name === "href" &&
        (attr.value.startsWith("javascript:") || attr.value.startsWith("data:"))
      ) {
        el.removeAttribute(attr.name);
      }
    });

    if (!allowedTags.includes(el.tagName.toLowerCase())) {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
    }
  });

  return tempDiv.innerHTML;
}

export function renderContent(topic) {
  if (!topic) {
    console.warn("[renderContent] Топик не передан");
    return `
      <div class="topic-page">
        <p class="error-note">Тема не найдена.</p>
      </div>
    `;
  }

  console.log("[renderContent] Получен топик:", topic);
  console.log("[renderContent] topic.content:", topic.content);
  console.log("[renderContent] Тип topic.content:", typeof topic.content);

  const textContent = extractTextFromContent(topic.content);

  console.log("[renderContent] Извлеченный текст:", textContent);
  console.log("[renderContent] Длина текста:", textContent?.length);

  if (!textContent || textContent.trim().length === 0) {
    console.warn("[renderContent] Текст пустой или не извлечен");
    console.warn(
      "[renderContent] Структура content для отладки:",
      JSON.stringify(topic.content, null, 2)
    );
    return `
      <div class="topic-page">
        <p class="placeholder-note">Содержание темы пока не добавлено.</p>
      </div>
    `;
  }

  console.log("[renderContent] Обрабатываем контент как HTML");
  const formattedText = sanitizeHtml(textContent);

  return `
    <div class="topic-page">
      <div class="topic-content">${formattedText}</div>
    </div>
  `;
}
