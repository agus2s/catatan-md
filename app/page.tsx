import { NotesApp } from '@/components/notes-app'
import { auth } from '@/lib/auth'
import { getNotes } from '@/app/actions/notes'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const notes = await getNotes()
  return <NotesApp initialNotes={notes} userName={session.user.name || session.user.email} />
}
