-- AlterTable
ALTER TABLE "users" ADD COLUMN     "averageScore" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "fullName" VARCHAR(255),
ADD COLUMN     "groupNumber" VARCHAR(50),
ADD COLUMN     "role" VARCHAR(20) NOT NULL DEFAULT 'student',
ADD COLUMN     "testResults" JSONB,
ADD COLUMN     "totalQuestionsAnswered" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "tests" (
    "id" SERIAL NOT NULL,
    "test_code" VARCHAR(20) NOT NULL,
    "test_title" TEXT NOT NULL,
    "variant" INTEGER NOT NULL,
    "questions" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_images" (
    "id" SERIAL NOT NULL,
    "test_code" VARCHAR(20) NOT NULL,
    "variant" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "test_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_files" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fileName" VARCHAR(500) NOT NULL,
    "fileKey" VARCHAR(1000) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "contentType" VARCHAR(100),
    "folder" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "user_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tests_test_code_key" ON "tests"("test_code");

-- CreateIndex
CREATE UNIQUE INDEX "test_images_test_code_variant_topic_id_key" ON "test_images"("test_code", "variant", "topic_id");

-- CreateIndex
CREATE INDEX "user_files_userId_idx" ON "user_files"("userId");

-- CreateIndex
CREATE INDEX "user_files_userId_folder_idx" ON "user_files"("userId", "folder");

-- AddForeignKey
ALTER TABLE "user_files" ADD CONSTRAINT "user_files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
