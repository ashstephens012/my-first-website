const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const courses = await prisma.course.findMany({ include: { instructor: true, lessons: true } });
    console.log(JSON.stringify(courses, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
