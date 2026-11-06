import { prisma } from "@/lib/prisma";

const guestEmail = "guest@yekta.local";

export async function getGuestUser() {
  return prisma.user.upsert({
    where: { email: guestEmail },
    update: {},
    create: {
      email: guestEmail,
      name: "Guest",
      passwordHash: "guest-mode",
    },
    select: { id: true, name: true, email: true, preferences: true },
  });
}
