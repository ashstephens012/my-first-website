import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const enrollments = await prisma.enrollment.findMany({ where: { userId }, include: { course: true } });
  return NextResponse.json(enrollments);
}

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const courseId = body.courseId;
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  const enrollment = await prisma.enrollment.create({ data: { userId, courseId } });
  return NextResponse.json(enrollment);
}
