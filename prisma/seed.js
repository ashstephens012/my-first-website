const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('adminpass', 10);
  const instructorPassword = await bcrypt.hash('instructorpass', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      role: 'ADMIN',
      passwordHash: adminPassword,
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@example.com' },
    update: {},
    create: {
      email: 'instructor@example.com',
      name: 'Instructor',
      role: 'INSTRUCTOR',
      passwordHash: instructorPassword,
    },
  });

  const course = await prisma.course.upsert({
    where: { slug: 'getting-started' },
    update: {},
    create: {
      title: 'Getting Started',
      slug: 'getting-started',
      description: 'Introductory course',
      published: true,
      instructorId: instructor.id,
    },
  });

  const lesson = await prisma.lesson.create({
    data: {
      title: 'Welcome',
      content: 'Welcome to the course. This is the first lesson.',
      order: 1,
      courseId: course.id,
    },
  });

  console.log('Seed complete:', { admin: admin.email, instructor: instructor.email, course: course.title, lesson: lesson.title });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
