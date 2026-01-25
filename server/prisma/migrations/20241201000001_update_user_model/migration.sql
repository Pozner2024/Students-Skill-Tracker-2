-- Migration: Update User model to use email instead of login
-- This migration removes the login field and makes email the primary identifier

-- First, drop the unique constraint on login
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_login_key";

-- Add email column if it doesn't exist
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" VARCHAR(255);

-- Update existing users to use login as email (temporary)
UPDATE "users" SET "email" = "login" WHERE "email" IS NULL;

-- Make email NOT NULL and unique
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");

-- Drop the login column
ALTER TABLE "users" DROP COLUMN IF EXISTS "login";
