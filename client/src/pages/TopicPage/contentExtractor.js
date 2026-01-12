// Утилита для извлечения текста из различных форматов content
export function extractTextFromContent(content) {
  console.log("[extractTextFromContent] Входные данные:", content);
  console.log("[extractTextFromContent] Тип:", typeof content);

  if (!content) {
    console.log("[extractTextFromContent] Content пустой или null");
    return null;
  }

  // Проверяем, является ли content массивом (для JSON из Prisma Studio)
  if (Array.isArray(content)) {
    console.log(
      "[extractTextFromContent] Content - массив, длина:",
      content.length
    );
    if (content.length === 0) {
      return null;
    }

    // Обрабатываем массив секций с полями sectionId, title, contentHtml
    const sectionsHtml = content
      .map((section, index) => {
        console.log(
          `[extractTextFromContent] Обрабатываем секцию ${index}:`,
          section
        );

        if (typeof section === "object" && section !== null) {
          // Ищем поле contentHtml (для JSON из файлов)
          if (section.contentHtml && typeof section.contentHtml === "string") {
            console.log(
              `[extractTextFromContent] Найдено contentHtml в секции ${index}`
            );
            return section.contentHtml.trim();
          }
          // Ищем поле html (для данных из CKEditor)
          if (section.html && typeof section.html === "string") {
            console.log(
              `[extractTextFromContent] Найдено html в секции ${index}`
            );
            return section.html.trim();
          }
          // Ищем другие текстовые поля
          const textFields = ["text", "content", "body", "description"];
          for (const field of textFields) {
            if (
              section[field] &&
              typeof section[field] === "string" &&
              section[field].trim().length > 0
            ) {
              console.log(
                `[extractTextFromContent] Найдено поле '${field}' в секции ${index}`
              );
              return section[field].trim();
            }
          }
        }
        return null;
      })
      .filter((html) => html && html.trim().length > 0);

    if (sectionsHtml.length > 0) {
      console.log("[extractTextFromContent] Извлечен HTML из массива секций");
      return sectionsHtml.join("\n\n");
    }

    console.warn("[extractTextFromContent] Не удалось извлечь HTML из массива");
    return null;
  }

  if (typeof content === "string") {
    console.log(
      "[extractTextFromContent] Content - строка, длина:",
      content.length
    );
    try {
      const parsed = JSON.parse(content);
      console.log(
        "[extractTextFromContent] Строка распарсена как JSON:",
        parsed
      );
      return extractTextFromContent(parsed);
    } catch (e) {
      console.log(
        "[extractTextFromContent] Строка не JSON, возвращаем как текст"
      );
      return content.trim();
    }
  }

  if (typeof content === "object" && content !== null) {
    console.log("[extractTextFromContent] Content - объект");
    const keys = Object.keys(content);
    console.log("[extractTextFromContent] Ключи объекта:", keys);

    if (keys.length === 0) {
      return null;
    }

    // Проверяем поле 'html' (для данных из CKEditor)
    if (content.html !== undefined && content.html !== null) {
      console.log(
        "[extractTextFromContent] Проверяем поле 'html':",
        content.html,
        "тип:",
        typeof content.html
      );
      if (typeof content.html === "string" && content.html.trim().length > 0) {
        console.log("[extractTextFromContent] Найдено поле 'html', возвращаем");
        return content.html.trim();
      } else if (typeof content.html === "object") {
        console.log(
          "[extractTextFromContent] Поле 'html' - объект, обрабатываем рекурсивно"
        );
        const htmlResult = extractTextFromContent(content.html);
        if (htmlResult) return htmlResult;
      }
    }

    if (content.text !== undefined && content.text !== null) {
      console.log(
        "[extractTextFromContent] Проверяем поле 'text':",
        content.text,
        "тип:",
        typeof content.text
      );
      if (typeof content.text === "string" && content.text.trim().length > 0) {
        console.log("[extractTextFromContent] Найдено поле 'text', возвращаем");
        return content.text.trim();
      } else if (typeof content.text === "object") {
        console.log(
          "[extractTextFromContent] Поле 'text' - объект, обрабатываем рекурсивно"
        );
        const textResult = extractTextFromContent(content.text);
        if (textResult) return textResult;
      }
    }

    if (content.content !== undefined && content.content !== null) {
      console.log(
        "[extractTextFromContent] Проверяем поле 'content':",
        content.content,
        "тип:",
        typeof content.content
      );
      if (
        typeof content.content === "string" &&
        content.content.trim().length > 0
      ) {
        console.log(
          "[extractTextFromContent] Найдено поле 'content', возвращаем"
        );
        return content.content.trim();
      } else if (typeof content.content === "object") {
        console.log(
          "[extractTextFromContent] Поле 'content' - объект, обрабатываем рекурсивно"
        );
        const contentResult = extractTextFromContent(content.content);
        if (contentResult) return contentResult;
      }
    }

    if (content.description !== undefined && content.description !== null) {
      console.log(
        "[extractTextFromContent] Проверяем поле 'description':",
        content.description
      );
      if (
        typeof content.description === "string" &&
        content.description.trim().length > 0
      ) {
        console.log(
          "[extractTextFromContent] Найдено поле 'description', возвращаем"
        );
        return content.description.trim();
      }
    }

    if (content.sections !== undefined && content.sections !== null) {
      console.log(
        "[extractTextFromContent] Проверяем поле 'sections':",
        content.sections
      );
      if (Array.isArray(content.sections) && content.sections.length > 0) {
        console.log(
          "[extractTextFromContent] Найден массив sections, длина:",
          content.sections.length
        );
        const sectionsText = content.sections
          .map((section, index) => {
            console.log(
              `[extractTextFromContent] Обрабатываем секцию ${index}:`,
              section
            );
            if (typeof section === "string") {
              return section.trim();
            }
            if (typeof section === "object" && section !== null) {
              const sectionTextFields = [
                "text",
                "content",
                "body",
                "title",
                "description",
              ];
              for (const field of sectionTextFields) {
                if (
                  section[field] &&
                  typeof section[field] === "string" &&
                  section[field].trim().length > 0
                ) {
                  console.log(
                    `[extractTextFromContent] Найдено поле '${field}' в секции ${index}`
                  );
                  return section[field].trim();
                }
              }
              const sectionStringValues = Object.values(section)
                .filter(
                  (val) => typeof val === "string" && val.trim().length > 0
                )
                .map((val) => val.trim())
                .join("\n");
              if (sectionStringValues) {
                return sectionStringValues;
              }
            }
            return null;
          })
          .filter((text) => text && text.trim().length > 0)
          .join("\n\n");

        if (sectionsText && sectionsText.trim().length > 0) {
          console.log(
            "[extractTextFromContent] Извлечен текст из sections, возвращаем"
          );
          return sectionsText;
        }
      }
    }

    if (content.document !== undefined && content.document !== null) {
      if (typeof content.document === "object") {
        const textFields = [
          "intro",
          "text",
          "content",
          "body",
          "description",
          "main",
        ];
        for (const field of textFields) {
          if (
            content.document[field] &&
            typeof content.document[field] === "string" &&
            content.document[field].trim().length > 0
          ) {
            return content.document[field].trim();
          }
        }

        const docStringValues = Object.values(content.document)
          .filter((val) => typeof val === "string" && val.trim().length > 0)
          .map((val) => val.trim())
          .join("\n\n");

        if (docStringValues && docStringValues.trim().length > 0) {
          return docStringValues;
        }
      } else if (
        typeof content.document === "string" &&
        content.document.trim().length > 0
      ) {
        return content.document.trim();
      }
    }

    const stringValues = Object.entries(content)
      .filter(
        ([key, val]) =>
          key !== "title" && typeof val === "string" && val.trim().length > 0
      )
      .map(([key, val]) => val.trim())
      .join("\n\n");

    console.log(
      "[extractTextFromContent] Объединенные строковые значения (без title):",
      stringValues
    );

    if (stringValues && stringValues.trim().length > 0) {
      console.log(
        "[extractTextFromContent] Найдены строковые значения, возвращаем"
      );
      return stringValues;
    }

    console.warn(
      "[extractTextFromContent] Не удалось извлечь текст из объекта"
    );
    console.warn(
      "[extractTextFromContent] Ключи объекта:",
      Object.keys(content)
    );
    console.warn(
      "[extractTextFromContent] Значения объекта:",
      Object.values(content)
    );
    return null;
  }

  console.warn(
    "[extractTextFromContent] Неизвестный тип content, возвращаем null"
  );
  return null;
}
