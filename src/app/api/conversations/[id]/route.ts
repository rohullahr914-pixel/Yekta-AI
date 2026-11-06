import { NextRequest, NextResponse } from "next/server";
import { getGuestUser } from "@/lib/guest";
import { prisma } from "@/lib/prisma";
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getGuestUser();
  const { id } = await context.params; const conversation = await prisma.conversation.findFirst({ where: { id, userId: user.id }, include: { messages: { orderBy: { createdAt: "asc" }, take: 100 } } });
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 }); return NextResponse.json({ conversation });
}
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getGuestUser();
  const { id } = await context.params; const result = await prisma.conversation.deleteMany({ where: { id, userId: user.id } }); if (!result.count) return NextResponse.json({ error: "Conversation not found." }, { status: 404 }); return NextResponse.json({ ok: true });
}
