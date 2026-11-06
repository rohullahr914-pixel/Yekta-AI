import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGuestUser } from "@/lib/guest";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { YEKTA_SYSTEM_PROMPT } from "@/lib/personality";
export const runtime = "nodejs";
const schema = z.object({ conversationId: z.string().min(1), message: z.string().trim().min(1).max(4000) });
const emotions = ["neutral", "happy", "sad", "shy", "surprised", "thinking", "curious", "angry"] as const;
export async function POST(req: NextRequest) {
  const user = await getGuestUser();
  const rate = rateLimit(`chat:${user.id}`, 20); if (!rate.ok) return NextResponse.json({ error: "Let's take a little pause. Try again in a minute." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const parsed = schema.safeParse(await req.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Write a message (up to 4,000 characters) to continue." }, { status: 400 });
  const { conversationId, message } = parsed.data;
  const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, userId: user.id }, include: { messages: { orderBy: { createdAt: "desc" }, take: 20 } } });
  if (!conversation) return NextResponse.json({ error: "That conversation isn't available." }, { status: 404 });
  if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: "Yekta is resting for a moment. Add GROQ_API_KEY to .env.local to connect her." }, { status: 503 });
  const prefs = user.preferences as { memoryConsent?: boolean } | null;
  const memories = prefs?.memoryConsent ? await prisma.memory.findMany({ where: { userId: user.id, consented: true }, orderBy: { createdAt: "desc" }, take: 20 }) : [];
  await prisma.message.create({ data: { conversationId, role: "user", content: message } });
  if (conversation.messages.length === 0) await prisma.conversation.update({ where: { id: conversationId }, data: { title: message.slice(0, 48) } });
  const history = [...conversation.messages.reverse(), { role: "user", content: message }].map(m => ({ role: m.role, content: m.content }));
  const system = YEKTA_SYSTEM_PROMPT + `\n\nFor every response, return a JSON object only with keys reply and emotion. reply is the natural conversational reply in the user's language. emotion must be exactly one of: ${emotions.join(", ")}. Choose a subtle expression matching the reply's emotional tone; use neutral when uncertain.` + (memories.length ? `\n\nUser-approved memories:\n${memories.map(m => `- ${m.content}`).join("\n")}` : "");
  let upstream: Response;
  try { upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b", messages: [{ role: "system", content: system }, ...history], temperature: 0.82, max_tokens: 1100, stream: true }), signal: AbortSignal.timeout(60_000) }); }
  catch { return NextResponse.json({ error: "Yekta couldn't connect just now. Please try again." }, { status: 502 }); }
  if (!upstream.ok || !upstream.body) return NextResponse.json({ error: upstream.status === 429 ? "Yekta is getting lots of love right now. Try again soon." : "Yekta couldn't reply just now. Please try again." }, { status: upstream.status === 429 ? 429 : 502 });
  const encoder = new TextEncoder(); const decoder = new TextDecoder(); let fullResponse = ""; let raw = ""; let emotion = "neutral";
  const stream = new ReadableStream<Uint8Array>({ async start(controller) { const reader = upstream.body!.getReader(); let buffer = ""; let emitted = ""; let wroteFinal = false; const emit = (final = false) => { let parsed: { reply?: unknown; emotion?: unknown } | null = null; try { const candidate = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""); parsed = JSON.parse(candidate); } catch { const match = raw.match(/\{\s*"reply"\s*:\s*"((?:\\.|[^"\\])*)"/); if (match) { try { parsed = { reply: JSON.parse(`"${match[1]}"`) }; } catch {} } }
      if (parsed && typeof parsed.reply === "string") { const next = parsed.reply; if (next.startsWith(emitted)) { const delta = next.slice(emitted.length); if (delta) controller.enqueue(encoder.encode(delta)); emitted = next; fullResponse = next; } if (typeof parsed.emotion === "string" && (emotions as readonly string[]).includes(parsed.emotion)) emotion = parsed.emotion; }
      else if (final && !wroteFinal) { fullResponse = raw.trim(); if (fullResponse.startsWith("{")) { try { const x = JSON.parse(fullResponse); if (typeof x.reply === "string") fullResponse = x.reply; } catch {} } if (!fullResponse) fullResponse = "I'm here with you. Could you say a little more?"; controller.enqueue(encoder.encode(fullResponse)); wroteFinal = true; }
    };
    try { while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop() || ""; for (const line of lines) { if (!line.startsWith("data: ")) continue; const payload = line.slice(6); if (payload === "[DONE]") continue; try { const chunk = JSON.parse(payload); const content = chunk.choices?.[0]?.delta?.content; if (typeof content === "string") { raw += content; emit(); } } catch {} } } if (buffer.startsWith("data: ") && buffer.slice(6) !== "[DONE]") { try { const chunk = JSON.parse(buffer.slice(6)); const content = chunk.choices?.[0]?.delta?.content; if (typeof content === "string") { raw += content; emit(); } } catch {} } emit(true); if (fullResponse) await prisma.message.create({ data: { conversationId, role: "assistant", content: fullResponse } }); controller.enqueue(encoder.encode(`\n${JSON.stringify({ emotion })}`)); controller.close(); } catch { controller.error(new Error("Stream interrupted")); } finally { reader.releaseLock(); } } });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Content-Type-Options": "nosniff" } });
}
