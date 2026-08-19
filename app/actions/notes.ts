'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getNotes() {
  const userId = await getUserId()
  return db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt))
}

export async function createNote() {
  const userId = await getUserId()
  const result = await db
    .insert(notes)
    .values({
      userId,
      title: 'Untitled note',
      content: '',
    })
    .returning()

  revalidatePath('/')
  return result[0]
}

export async function updateNote(id: number, title: string, content: string) {
  const userId = await getUserId()
  const result = await db
    .update(notes)
    .set({
      title,
      content,
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning()

  revalidatePath('/')
  return result[0]
}

export async function deleteNote(id: number) {
  const userId = await getUserId()
  await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))

  revalidatePath('/')
}
