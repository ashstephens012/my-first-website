import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email } = body as { email?: string };
  if (!email || typeof email !== "string") return NextResponse.json({ error: "email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: true }); // do not reveal existence

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  } as any);

  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset?token=${token}&email=${encodeURIComponent(email)}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "no-reply@example.com",
      to: email,
      subject: "Password reset",
      text: `Reset your password: ${resetUrl}`,
      html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  } catch (e) {
    // ignore send errors for now
  }

  return NextResponse.json({ ok: true });
}
 
