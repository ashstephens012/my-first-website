-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_instructorId_fkey";
ALTER TABLE "Lesson" DROP CONSTRAINT IF EXISTS "Lesson_courseId_fkey";
ALTER TABLE "Resource" DROP CONSTRAINT IF EXISTS "Resource_uploadedById_fkey";
ALTER TABLE "Resource" DROP CONSTRAINT IF EXISTS "Resource_courseId_fkey";
ALTER TABLE "Resource" DROP CONSTRAINT IF EXISTS "Resource_lessonId_fkey";
ALTER TABLE "Enrollment" DROP CONSTRAINT IF EXISTS "Enrollment_userId_fkey";
ALTER TABLE "Enrollment" DROP CONSTRAINT IF EXISTS "Enrollment_courseId_fkey";

-- DropTable
DROP TABLE IF EXISTS "Enrollment";
DROP TABLE IF EXISTS "Resource";
DROP TABLE IF EXISTS "Lesson";
DROP TABLE IF EXISTS "Course";

-- AlterTable: change default role from LEARNER to USER
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
