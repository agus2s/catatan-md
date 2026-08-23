'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createNote, deleteNote, updateNote } from '@/app/actions/notes'
import { signOut } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import {
  Bold, Check, ChevronDown, ChevronRight, Code2, Download, FileCode2, FileText,
  Folder, FolderPlus, Heading2, Italic, Link2, List, ListOrdered, LogOut, Menu, MoreHorizontal, Moon, Plus, Quote, Search, Sun, Trash2, X,
} from 'lucide-react'

type Note = { id: number; title: string; content: string; updatedAt: Date }
type ViewMode = 'editor' | 'split' | 'preview'
type Screen = 'files' | 'editor'

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function NotesApp({ initialNotes, userName }: { initialNotes: Note[]; userName: string }) {
  const [notes, setNotes] = useState(initialNotes)
  const [activeId, setActiveId] = useState<number | null>(initialNotes[0]?.id ?? null)
  const [query, setQuery] = useState('')
  const [screen, setScreen] = useState<Screen>(initialNotes.length ? 'editor' : 'files')
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [folderOpen, setFolderOpen] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [menuOpen, setMenuOpen] = useState(false)
  const [formatToolbarOpen, setFormatToolbarOpen] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(prefersDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', prefersDark)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    setMenuOpen(false)
  }
  const active = notes.find((note) => note.id === activeId) ?? null
  const filtered = useMemo(() => notes.filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(query.toLowerCase())), [notes, query])

  function openNote(id: number) {
    setActiveId(id); setScreen('editor'); setMobileSidebar(false)
  }

  function patchActive(field: 'title' | 'content', value: string) {
    if (!active) return
    const nextTitle = field === 'title' ? value : active.title
    const nextContent = field === 'content' ? value : active.content
    setNotes((items) => items.map((note) => note.id === active.id ? { ...note, title: nextTitle, content: nextContent, updatedAt: new Date() } : note))
    startTransition(async () => { await updateNote(active.id, nextTitle || 'Untitled note', nextContent) })
  }

  function addNote() {
    startTransition(async () => {
      const note = await createNote()
      if (note) { setNotes((items) => [note as Note, ...items]); setActiveId(note.id); setScreen('editor'); setMobileSidebar(false) }
    })
  }

  function removeNote() {
    if (!active || !window.confirm(`Hapus dokumen “${active.title || 'Tanpa judul'}”? Dokumen ini akan dihapus permanen.`)) return
    startTransition(async () => { await deleteNote(active.id); const remaining = notes.filter((note) => note.id !== active.id); setNotes(remaining); setActiveId(remaining[0]?.id ?? null); setScreen(remaining.length ? 'editor' : 'files') })
  }

  function insertMarkdown(before: string, after = '') {
    if (!active) return
    const textarea = document.querySelector<HTMLTextAreaElement>('#markdown-editor')
    const start = textarea?.selectionStart ?? active.content.length
    const end = textarea?.selectionEnd ?? start
    const selected = active.content.slice(start, end) || 'teks'
    patchActive('content', `${active.content.slice(0, start)}${before}${selected}${after}${active.content.slice(end)}`)
  }

  function exportMarkdown() {
    if (!active) return
    const blob = new Blob([active.content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${active.title || 'catatan'}.md`; link.click(); URL.revokeObjectURL(url)
  }

  return (
    <main className="flex h-dvh min-h-[560px] overflow-hidden bg-background text-foreground">
      {screen === 'files' && <aside className={cn('absolute inset-y-0 left-0 z-30 flex w-[320px] shrink-0 -translate-x-full flex-col border-r bg-card transition-transform md:relative md:translate-x-0', mobileSidebar && 'translate-x-0')}>
        <div className="flex h-[68px] items-center justify-between border-b px-5">
          <button onClick={() => setScreen('files')} className="flex items-center gap-3 text-left"><div className="flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-xs font-bold text-primary-foreground">MD</div><div><p className="font-semibold leading-none">Catatan MD</p><p className="mt-1 text-[10px] text-muted-foreground">Workspace online</p></div></button>
          <button aria-label="Tutup sidebar" onClick={() => setMobileSidebar(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent md:hidden"><X className="size-4" /></button>
        </div>
        <div className="space-y-3 p-4"><button onClick={addNote} className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"><Plus className="size-4" /> Dokumen Baru</button><label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-muted-foreground"><Search className="size-3.5" /><input aria-label="Cari dokumen" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari dokumen..." className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" /></label></div>
        <div className="flex-1 overflow-y-auto px-3 pb-4"><button onClick={() => setFolderOpen(!folderOpen)} className="flex w-full items-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold hover:bg-accent"><span>{folderOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}</span><Folder className="size-4 fill-primary/20 text-primary" /> Dokumen <span className="ml-auto font-mono text-[10px] text-muted-foreground">{filtered.length}</span></button>{folderOpen && <div className="mt-1 space-y-1 border-l border-border/70 pl-2">{filtered.map((note) => <button key={note.id} onClick={() => openNote(note.id)} className={cn('group w-full rounded-md px-3 py-2.5 text-left transition', note.id === activeId && screen === 'editor' ? 'bg-accent ring-1 ring-primary/20' : 'hover:bg-accent/60')}><div className="flex items-center gap-2"><FileCode2 className="size-4 shrink-0 text-primary" /><p className="min-w-0 flex-1 truncate text-sm font-medium">{note.title || 'Tanpa judul'}</p><MoreHorizontal className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" /></div><p className="mt-1 pl-6 text-[10px] text-muted-foreground">{formatDate(note.updatedAt)} · {note.content.length.toLocaleString('id-ID')} karakter</p></button>)}</div>}{!filtered.length && <p className="px-3 py-8 text-center text-xs text-muted-foreground">Belum ada dokumen.</p>}</div>
        <div className="flex items-center justify-between border-t px-5 py-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{userName}</p><p className="truncate text-[11px] text-muted-foreground">Penyimpanan tersinkron</p></div><button aria-label="Keluar" onClick={() => signOut().then(() => window.location.href = '/sign-in')} className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><LogOut className="size-4" /></button></div>
      </aside>}
      {mobileSidebar && screen === 'files' && <button aria-label="Tutup menu" onClick={() => setMobileSidebar(false)} className="fixed inset-0 z-20 bg-slate-950/30 md:hidden" />}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className={cn('flex shrink-0 items-center justify-between gap-3 border-b bg-background px-4 md:px-7', screen === 'editor' ? 'min-h-[68px]' : 'min-h-[80px]')}><div className="flex min-w-0 items-center gap-3"><button aria-label="Buka sidebar" onClick={() => setMobileSidebar(true)} className="rounded-md p-2 hover:bg-accent md:hidden"><Menu className="size-5" /></button>{screen === 'editor' && active ? <><button onClick={() => setScreen('files')} className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent">File manager</button><span className="text-muted-foreground">/</span><p className="truncate text-sm font-semibold">{active.title || 'Tanpa judul'}</p></> : <div><p className="text-sm font-semibold">File manager</p><p className="text-[11px] text-muted-foreground">Kelola dokumen tersimpan</p></div>}</div><div className="flex shrink-0 items-center gap-1.5"><span className={cn('hidden items-center gap-1.5 px-2 text-[11px] sm:flex', isPending ? 'text-amber-500' : 'text-emerald-500')}><Check className="size-3.5" />{isPending ? 'Menyimpan...' : 'Tersimpan'}</span>{screen === 'editor' && active && <><button onClick={exportMarkdown} aria-label="Unduh Markdown" title="Unduh .md" className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Download className="size-4" /></button><button onClick={removeNote} aria-label="Hapus dokumen" title="Hapus dokumen" className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></button></>}<button aria-label="Tambah folder" title="Folder baru" className="hidden rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground sm:block"><FolderPlus className="size-4" /></button><div className="relative">
              <button aria-label="Menu lainnya" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="rounded-md p-2 text-muted-foreground hover:bg-accent"><MoreHorizontal className="size-4" /></button>
              {menuOpen && <div role="menu" className="absolute right-0 top-11 z-40 w-48 rounded-lg border bg-popover p-1.5 text-sm text-popover-foreground shadow-xl">
                <button role="menuitem" onClick={toggleTheme} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-accent"><span className="flex size-5 items-center justify-center">{theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}</span>{theme === 'dark' ? 'Gunakan light mode' : 'Gunakan dark mode'}</button>
                <button role="menuitemcheckbox" aria-checked={formatToolbarOpen} onClick={() => { setFormatToolbarOpen((open) => !open); setMenuOpen(false) }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-accent"><Check className={cn('size-4', !formatToolbarOpen && 'invisible')} /> Tampilkan toolbar format</button>
                <button role="menuitem" onClick={() => { setScreen('files'); setMenuOpen(false) }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-accent"><FileText className="ml-0.5 size-4" /> File manager</button>
              </div>}
            </div></div></header>
        {screen === 'editor' && active && formatToolbarOpen && viewMode !== 'preview' && <div className="flex shrink-0 items-center gap-1 border-b bg-muted/40 px-4 py-1.5 md:px-7">
          <button className="tool-button" title="Heading 1" onClick={() => insertMarkdown('# ')}>H1</button>
          <button className="tool-button font-bold" title="Tebal" onClick={() => insertMarkdown('**', '**')}>B</button>
          <button className="tool-button italic" title="Miring" onClick={() => insertMarkdown('*', '*')}>I</button>
          <button className="tool-button" title="Kode" onClick={() => insertMarkdown('`', '`')}>&lt;/&gt;</button>
          <button className="tool-button" title="Quote" onClick={() => insertMarkdown('> ')}><Quote className="size-4" /></button>
          <button className="tool-button" title="Bullet" onClick={() => insertMarkdown('- ')}>•</button>
          <button className="tool-button" title="Numbering" onClick={() => insertMarkdown('1. ')}>1.</button>
        </div>}
        {screen === 'files' || !active ? <div className="flex flex-1 items-center justify-center p-8"><div className="w-full max-w-2xl rounded-xl border bg-card p-8 shadow-sm md:p-12"><div className="mb-8 flex items-start justify-between gap-6"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Manajemen file</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Semua dokumen</h1><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Pilih dokumen untuk membuka editor, atau buat catatan Markdown baru.</p></div><FileText className="size-8 text-primary" /></div><div className="grid gap-3 sm:grid-cols-2">{filtered.map((note) => <button key={note.id} onClick={() => openNote(note.id)} className="rounded-lg border p-4 text-left transition hover:border-primary/50 hover:bg-accent/40"><div className="flex items-center gap-2"><FileCode2 className="size-4 text-primary" /><span className="truncate text-sm font-medium">{note.title || 'Tanpa judul'}</span></div><p className="mt-2 text-xs text-muted-foreground">Diperbarui {formatDate(note.updatedAt)}</p></button>)}<button onClick={addNote} className="flex min-h-24 items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground transition hover:border-primary/50 hover:bg-accent/40"><Plus className="size-4" /> Dokumen baru</button></div></div></div> : <div className="flex min-h-0 flex-1 flex-col"><div className="flex h-12 shrink-0 items-center justify-start gap-3 border-b px-4 md:px-7"><div className="flex items-center gap-1 rounded-md bg-muted p-1"><button className="tool-button" title="Blockquote" onClick={() => insertMarkdown('> ')}><Quote className="size-4" /></button>{([['editor', 'Editor'], ['split', 'Split'], ['preview', 'Preview']] as [ViewMode, string][]).map(([mode, label]) => <button key={mode} onClick={() => setViewMode(mode)} className={cn('rounded px-3 py-1.5 text-xs font-medium transition', viewMode === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{label}</button>)}</div><span className="hidden font-mono text-[11px] text-muted-foreground md:block">Markdown · {active.content.length.toLocaleString('id-ID')} karakter</span></div><div className="flex min-h-0 flex-1 flex-col lg:flex-row"><div className={cn('min-h-0 flex-1 flex-col', viewMode === 'preview' ? 'hidden' : 'flex', viewMode === 'split' && 'lg:border-r')}><div className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b px-4 md:px-7"><button title="Heading" onClick={() => insertMarkdown('## ')} className="tool-button"><Heading2 className="size-4" /></button><button title="Tebal" onClick={() => insertMarkdown('**', '**')} className="tool-button"><Bold className="size-4" /></button><button title="Miring" onClick={() => insertMarkdown('*', '*')} className="tool-button"><Italic className="size-4" /></button><button title="Kode" onClick={() => insertMarkdown('`', '`')} className="tool-button"><Code2 className="size-4" /></button><button title="Link" onClick={() => insertMarkdown('[', '](https://)')} className="tool-button"><Link2 className="size-4" /></button><span className="mx-1 h-5 w-px bg-border" /><button title="Quote" onClick={() => insertMarkdown('> ')} className="tool-button"><Quote className="size-4" /></button><button title="Daftar" onClick={() => insertMarkdown('- ')} className="tool-button"><List className="size-4" /></button><button title="Daftar bernomor" onClick={() => insertMarkdown('1. ')} className="tool-button"><ListOrdered className="size-4" /></button></div><div className="flex min-h-0 flex-1 flex-col p-4 md:p-7"><input aria-label="Judul dokumen" value={active.title} onChange={(e) => patchActive('title', e.target.value)} placeholder="Judul dokumen" className="mb-4 bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50" /><textarea id="markdown-editor" aria-label="Editor Markdown" value={active.content} onChange={(e) => patchActive('content', e.target.value)} spellCheck={false} className="min-h-0 flex-1 resize-none bg-transparent font-mono text-[14px] leading-7 text-foreground outline-none placeholder:text-muted-foreground/50" /></div></div><div className={cn('min-h-0 flex-1 overflow-y-auto bg-card/35 p-5 md:p-8', viewMode === 'editor' ? 'hidden' : 'block')}><article className="prose prose-sm max-w-none font-sans dark:prose-invert"><ReactMarkdown remarkPlugins={[remarkGfm]}>{active.content || '*Belum ada isi.*'}</ReactMarkdown></article></div></div></div>}
      </section>
    </main>
  )
}
