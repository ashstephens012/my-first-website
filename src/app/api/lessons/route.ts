import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const courseId = url.searchParams.get('courseId');
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  const lessons = await prisma.lesson.findMany({ where: { courseId }, orderBy: { order: 'asc' } });
  return NextResponse.json(lessons);
}

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = session.user.role as string | undefined;
  if (role !== 'INSTRUCTOR' && role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  if (!body.title || !body.courseId) return NextResponse.json({ error: 'title and courseId required' }, { status: 400 });
  const lesson = await prisma.lesson.create({ data: { title: body.title, content: body.content ?? null, order: body.order ?? 0, courseId: body.courseId } });
  return NextResponse.json(lesson);
}
