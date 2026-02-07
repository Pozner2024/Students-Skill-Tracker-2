// Утилита для извлечения текста из различных форматов content
export function extractTextFromContent(content) {
  if (!content) {
    return null;
  }

  // Проверяем, является ли content массивом (для JSON из Prisma Studio)
  if (Array.isArray(content)) {
    if (content.length === 0) {
      return null;
    }

    // Обрабатываем массив секций с полями sectionId, title, contentHtml
    const sectionsHtml = content
      .map((section, index) => {
        if (typeof section === "object" && section !== null) {
          // Ищем поле contentHtml (для JSON из файлов)
          if (section.contentHtml && typeof section.contentHtml === "string") {
            return section.contentHtml.trim();
          }
          // Ищем поле html (для данных из CKEditor)
          if (section.html && typeof section.html === "string") {
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
              return section[field].trim();
            }
          }
        }
        return null;
      })
      .filter((html) => html && html.trim().length > 0);

    if (sectionsHtml.length > 0) {
      return sectionsHtml.join("\n\n");
    }

    return null;
  }

  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      return extractTextFromContent(parsed);
    } catch (e) {
      return content.trim();
    }
  }

  if (typeof content === "object" && content !== null) {
    const keys = Object.keys(content);

    if (keys.length === 0) {
      return null;
    }

    // Проверяем поле 'html' (для данных из CKEditor)
    if (content.html !== undefined && content.html !== null) {
      if (typeof content.html === "string" && content.html.trim().length > 0) {
        return content.html.trim();
      } else if (typeof content.html === "object") {
        const htmlResult = extractTextFromContent(content.html);
        if (htmlResult) return htmlResult;
      }
    }

    if (content.text !== undefined && content.text !== null) {
      if (typeof content.text === "string" && content.text.trim().length > 0) {
        return content.text.trim();
      } else if (typeof content.text === "object") {
        const textResult = extractTextFromContent(content.text);
        if (textResult) return textResult;
      }
    }

    if (content.content !== undefined && content.content !== null) {
      if (
        typeof content.content === "string" &&
        content.content.trim().length > 0
      ) {
        return content.content.trim();
      } else if (typeof content.content === "object") {
        const contentResult = extractTextFromContent(content.content);
        if (contentResult) return contentResult;
      }
    }

    if (content.description !== undefined && content.description !== null) {
      if (
        typeof content.description === "string" &&
        content.description.trim().length > 0
      ) {
        return content.description.trim();
      }
    }

    if (content.sections !== undefined && content.sections !== null) {
      if (Array.isArray(content.sections) && content.sections.length > 0) {
        const sectionsText = content.sections
          .map((section, index) => {
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

    if (stringValues && stringValues.trim().length > 0) {
      return stringValues;
    }

    return null;
  }

  return null;
}
