import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getPresignedUploadUrl } from "@/lib/s3";

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role as string | undefined;
  if (role !== "INSTRUCTOR" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { filename, contentType } = body as { filename?: string; contentType?: string };
  if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

  const key = `resources/${session.user.id}/${Date.now()}-${filename}`;
  try {
    const url = await getPresignedUploadUrl(key, contentType || "application/octet-stream");
    return NextResponse.json({ uploadUrl: url, key });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
