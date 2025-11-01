const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const testData = [
  {
    test_code: 'test1_1',
    test_title: 'Тема: Организация снабжения',
    variant: 1,
    questions: {
      "questions": [
        {
          "type": "multiple_choice",
          "options": ["+4 град.", "0 град.", "–12 град.", "+16 град."],
          "question": "Температура в морозильной камере составляет:",
          "questionTitle": "Вопрос 1",
          "correct_answer": "–12 град."
        },
        {
          "type": "multiple_choice",
          "options": ["централизованная, децентрализованная", "кольцевая, линейная", "транзитная, складская", "продовольственная, материально-техническая"],
          "question": "Виды поставки товаров:",
          "questionTitle": "Вопрос 2",
          "correct_answer": "транзитная, складская"
        },
        {
          "type": "multiple_choice",
          "options": ["60-65%", "70-75%", "80-85%", "50-55%"],
          "question": "Относительная влажность воздуха при хранении сухих продуктов:",
          "questionTitle": "Вопрос 3",
          "correct_answer": "60-65%"
        },
        {
          "type": "multiple_choice",
          "options": ["12 часов", "24 часа", "48 часов", "10 суток"],
          "question": "Срок проверки качества для скоропортящихся товаров:",
          "questionTitle": "Вопрос 4",
          "correct_answer": "24 часа"
        },
        {
          "type": "fill_in_the_blank",
          "blanks": 1,
          "question": "Снабжение объектов общественного питания оборудованием, посудой, инвентарем является ___",
          "questionTitle": "Вопрос 5",
          "correct_answers": ["материально-техническое"]
        },
        {
          "type": "fill_in_the_blank",
          "blanks": 1,
          "question": "Тара, поступающая к потребителю с товаром и не выполняющая функцию транспортной тары является ___",
          "questionTitle": "Вопрос 6",
          "correct_answers": ["потребительская"]
        },
        {
          "type": "fill_in_the_blank",
          "blanks": 2,
          "question": "По назначению тара делится на: 1) ___; 2) ___",
          "questionTitle": "Вопрос 7",
          "allow_any_order": true,
          "correct_answers": ["универсальная", "специализированная"]
        },
        {
          "type": "fill_in_the_blank",
          "blanks": 3,
          "question": "Весы в зависимости от механизма взвешивания делятся на: 1) ___; 2) ___; 3) ___",
          "questionTitle": "Вопрос 8",
          "allow_any_order": true,
          "correct_answers": ["механические", "электромеханические", "электронные"]
        },
        {
          "type": "fill_in_the_blank",
          "blanks": 1,
          "question": "Приемка товаров по качеству производится по ___ показателям качества.",
          "questionTitle": "Вопрос 9",
          "correct_answers": ["органолептические"]
        },
        {
          "type": "matching",
          "question": "Установите соответствие между видом тары по материалу изготовления и видом тары по степени жесткости:",
          "left_column": ["керамическая", "картонная", "металлическая", "текстильная"],
          "right_column": ["жесткая", "полужесткая", "мягкая", "хрупкая"],
          "questionTitle": "Вопрос 10",
          "correct_matches": {
            "картонная": "полужесткая",
            "текстильная": "мягкая",
            "керамическая": "хрупкая",
            "металлическая": "жесткая"
          }
        }
      ]
    }
  }
];

async function fillTests() {
  try {
    console.log('Начинаем заполнение таблицы tests...');
    
    // Очищаем существующие данные
    await prisma.tests.deleteMany({});
    console.log('Существующие данные удалены');
    
    // Читаем данные из SQL файла
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, 'src', 'tests', 'tests_202510221959.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Парсим SQL и извлекаем данные
    const insertMatches = sqlContent.match(/INSERT INTO public\.tests[^;]+;/g);
    
    if (!insertMatches) {
      throw new Error('Не найдены INSERT команды в SQL файле');
    }
    
    let totalInserted = 0;
    
    for (const insertStatement of insertMatches) {
      // Извлекаем VALUES из INSERT statement
      const valuesMatch = insertStatement.match(/VALUES\s*\(([^)]+)\)/);
      if (!valuesMatch) continue;
      
      const valuesString = valuesMatch[1];
      
      // Парсим каждую строку значений
      const rows = valuesString.split('),(').map(row => {
        // Убираем скобки и парсим значения
        const cleanRow = row.replace(/^\(|\)$/g, '');
        const values = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < cleanRow.length; i++) {
          const char = cleanRow[i];
          
          if (!inQuotes && (char === "'" || char === '"')) {
            inQuotes = true;
            quoteChar = char;
            current += char;
          } else if (inQuotes && char === quoteChar) {
            // Проверяем, не экранированная ли это кавычка
            if (i + 1 < cleanRow.length && cleanRow[i + 1] === quoteChar) {
              current += char + char;
              i++; // Пропускаем следующую кавычку
            } else {
              inQuotes = false;
              current += char;
            }
          } else if (!inQuotes && char === ',') {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        if (current.trim()) {
          values.push(current.trim());
        }
        
        return values;
      });
      
      // Обрабатываем каждую строку
      for (const row of rows) {
        if (row.length >= 5) {
          const testCode = row[0].replace(/'/g, '');
          const testTitle = row[1].replace(/'/g, '');
          const variant = parseInt(row[2]);
          const questions = JSON.parse(row[3]);
          const createdAt = new Date(row[4].replace(/'/g, ''));
          
          await prisma.tests.create({
            data: {
              test_code: testCode,
              test_title: testTitle,
              variant: variant,
              questions: questions,
              created_at: createdAt
            }
          });
          
          totalInserted++;
          console.log(`Добавлен тест: ${testCode} - ${testTitle}`);
        }
      }
    }
    
    console.log(`\nУспешно добавлено ${totalInserted} тестов!`);
    
  } catch (error) {
    console.error('Ошибка при заполнении базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fillTests();
