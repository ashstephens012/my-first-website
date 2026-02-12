import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, token, password } = body as { email?: string; token?: string; password?: string };
  if (!email || !token || !password) return NextResponse.json({ error: "missing" }, { status: 400 });

  const record = await prisma.verificationToken.findFirst({ where: { identifier: email, token } });
  if (!record || record.expires < new Date()) return NextResponse.json({ error: "invalid or expired" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  return NextResponse.json({ ok: true });
}
 
