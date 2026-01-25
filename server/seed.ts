import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

type JsonValue = Prisma.InputJsonValue;

type TopicSeed = {
  id: number;
  name: string;
  project_name: string;
  project_description: string;
  content?: JsonValue;
};

type QuestionSeed = {
  id: number;
  topic_id: number;
  text: string;
};

type TestSeed = {
  id: number;
  test_code: string;
  test_title: string;
  variant: number;
  questions: JsonValue;
};

type TestImageSeed = {
  id: number;
  test_code: string;
  variant: number;
  topic_id: number;
  image_url?: string | null;
};

const prisma = new PrismaClient();

const loadJson = <T>(fileName: string): T => {
  const filePath = path.join(__dirname, 'src', 'data', fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
};

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

const seedTopics = async (topics: TopicSeed[]): Promise<void> => {
  for (const topic of topics) {
    await prisma.topic.upsert({
      where: { id: topic.id },
      create: {
        id: topic.id,
        name: topic.name,
        project_name: topic.project_name,
        project_description: topic.project_description,
        content: toJsonInput(topic.content ?? null),
      },
      update: {
        name: topic.name,
        project_name: topic.project_name,
        project_description: topic.project_description,
        content: toJsonInput(topic.content ?? null),
      },
    });
  }
};

const seedQuestions = async (questions: QuestionSeed[]): Promise<void> => {
  for (const question of questions) {
    await prisma.question.upsert({
      where: { id: question.id },
      create: {
        id: question.id,
        topic_id: question.topic_id,
        text: question.text,
      },
      update: {
        topic_id: question.topic_id,
        text: question.text,
      },
    });
  }
};

const seedTests = async (tests: TestSeed[]): Promise<void> => {
  for (const test of tests) {
    await prisma.tests.upsert({
      where: { test_code: test.test_code },
      create: {
        test_code: test.test_code,
        test_title: test.test_title,
        variant: test.variant,
        questions: toJsonInput(test.questions),
      },
      update: {
        test_title: test.test_title,
        variant: test.variant,
        questions: toJsonInput(test.questions),
      },
    });
  }
};

const seedTestImages = async (images: TestImageSeed[]): Promise<void> => {
  for (const image of images) {
    await prisma.testImages.upsert({
      where: {
        test_code_variant_topic_id: {
          test_code: image.test_code,
          variant: image.variant,
          topic_id: image.topic_id,
        },
      },
      create: {
        test_code: image.test_code,
        variant: image.variant,
        topic_id: image.topic_id,
        image_url: image.image_url ?? null,
      },
      update: {
        image_url: image.image_url ?? null,
      },
    });
  }
};

const main = async (): Promise<void> => {
  const topics = loadJson<TopicSeed[]>('topics.json');
  const questions = loadJson<QuestionSeed[]>('question.json');
  const tests = loadJson<TestSeed[]>('tests.json');
  const testImages = loadJson<TestImageSeed[]>('test_images.json');

  await seedTopics(topics);
  await seedQuestions(questions);
  await seedTests(tests);
  await seedTestImages(testImages);
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });

