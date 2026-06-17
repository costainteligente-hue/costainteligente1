/**
 * MessagesRepository — PostgreSQL + Drizzle
 */

import { eq, asc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { messages, profiles } from '@/lib/db/schema';

function generateId(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0,8), hex.slice(8,12), '4'+hex.slice(13,16),
    ((parseInt(hex[16],16)&0x3)|0x8).toString(16)+hex.slice(17,20), hex.slice(20,32)].join('-');
}

export const messagesRepository = {
  async findByReservationId(reservationId: string) {
    const db   = getDb();
    const rows = await db
      .select({
        id: messages.id, reservationId: messages.reservationId,
        senderId: messages.senderId, content: messages.content, sentAt: messages.sentAt,
        senderFullName: profiles.fullName, senderAvatarUrl: profiles.avatarUrl,
      })
      .from(messages)
      .innerJoin(profiles, eq(messages.senderId, profiles.id))
      .where(eq(messages.reservationId, reservationId))
      .orderBy(asc(messages.sentAt))
      .limit(50);

    return rows.map((r) => ({
      id:             r.id,
      reservation_id: r.reservationId,
      sender_id:      r.senderId,
      content:        r.content,
      sent_at:        r.sentAt instanceof Date ? r.sentAt.toISOString() : r.sentAt,
      profiles:       { full_name: r.senderFullName, avatar_url: r.senderAvatarUrl },
    }));
  },

  async create(data: { reservationId: string; senderId: string; content: string }) {
    const db = getDb();
    const id = generateId();
    await db.insert(messages).values({
      id, reservationId: data.reservationId,
      senderId: data.senderId, content: data.content.trim(),
    });
    const rows = await db.select().from(messages).where(eq(messages.id, id));
    return rows[0];
  },
};
