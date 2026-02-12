import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  if (slug) {
    const course = await prisma.course.findUnique({
      where: { slug },
      include: { instructor: true, lessons: true, resources: true },
    });
    return NextResponse.json(course);
  }
  const courses = await prisma.course.findMany({ where: { published: true }, include: { instructor: true } });
  return NextResponse.json(courses);
}

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string | undefined;
  const role = session.user.role as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'INSTRUCTOR' && role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  if (!body.title || !body.slug) return NextResponse.json({ error: 'title and slug required' }, { status: 400 });
  const course = await prisma.course.create({ data: { title: body.title, slug: body.slug, description: body.description ?? null, instructorId: userId } });
  return NextResponse.json(course);
}
