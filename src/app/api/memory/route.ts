import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGuestUser } from "@/lib/guest";
import { prisma } from "@/lib/prisma";
const schema = z.object({ enabled: z.boolean() });
export async function GET() { const user = await getGuestUser(); const preferences = user.preferences as { memoryConsent?: boolean } | null; const memories = preferences?.memoryConsent ? await prisma.memory.findMany({ where: { userId: user.id, consented: true }, orderBy: { createdAt: "desc" }, take: 30 }) : []; return NextResponse.json({ memories, enabled: Boolean(preferences?.memoryConsent) }); }
export async function PUT(req: NextRequest) { const user = await getGuestUser(); const parsed = schema.safeParse(await req.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid preference." }, { status: 400 }); await prisma.user.update({ where: { id: user.id }, data: { preferences: { memoryConsent: parsed.data.enabled } } }); if (!parsed.data.enabled) await prisma.memory.deleteMany({ where: { userId: user.id } }); return NextResponse.json({ enabled: parsed.data.enabled }); }
export async function DELETE() { const user = await getGuestUser(); await prisma.memory.deleteMany({ where: { userId: user.id } }); return NextResponse.json({ ok: true }); }
