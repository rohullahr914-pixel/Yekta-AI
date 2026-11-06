import { NextResponse } from "next/server";
import { getGuestUser } from "@/lib/guest";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const user = await getGuestUser();
  const conversations = await prisma.conversation.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 50, select: { id: true, title: true, updatedAt: true } }); return NextResponse.json({ conversations });
}
export async function POST() {
  const user = await getGuestUser();
  const conversation = await prisma.conversation.create({ data: { userId: user.id }, select: { id: true, title: true, updatedAt: true } }); return NextResponse.json({ conversation });
}
