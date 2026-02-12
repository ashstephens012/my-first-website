import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string | undefined;
  const role = session.user.role as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'INSTRUCTOR' && role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { title, url, type, lessonId, courseId } = body;
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  const resource = await prisma.resource.create({ data: { title: title ?? null, url, type: type ?? null, uploadedById: userId, lessonId: lessonId ?? null, courseId: courseId ?? null } });
  return NextResponse.json(resource);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lessonId = url.searchParams.get('lessonId');
  const courseId = url.searchParams.get('courseId');
  const where: any = {};
  if (lessonId) where.lessonId = lessonId;
  if (courseId) where.courseId = courseId;
  const resources = await prisma.resource.findMany({ where });
  return NextResponse.json(resources);
}
