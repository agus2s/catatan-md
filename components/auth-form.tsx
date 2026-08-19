'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/auth-client'
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const isSignUp = mode === 'sign-up'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const result = isSignUp
      ? await signUp.email({ name, email, password })
      : await signIn.email({ email, password })
    setLoading(false)
    if (result.error) {
      setError('Email atau kata sandi tidak valid. Silakan coba lagi.')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="size-5" />
          </div>
          <span className="font-mono text-sm font-bold tracking-[0.18em]">CATATAN MD</span>
        </div>
        <div className="mb-8">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-primary">Workspace catatan online</p>
          <h1 className="text-4xl font-semibold tracking-tight">{isSignUp ? 'Mulai menulis.' : 'Selamat datang.'}</h1>
          <p className="mt-3 text-muted-foreground">{isSignUp ? 'Buat akun untuk menyimpan semua ide di satu tempat.' : 'Lanjutkan catatanmu dari tempat terakhir.'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" className="h-12 w-full rounded-lg border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />}
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 w-full rounded-lg border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kata sandi (min. 8 karakter)" className="h-12 w-full rounded-lg border bg-card px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <>{isSignUp ? 'Buat akun' : 'Masuk'} <ArrowRight className="size-4" /></>}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? 'Sudah punya akun? ' : 'Belum punya akun? '}
          <a className="font-medium text-foreground underline underline-offset-4" href={isSignUp ? '/sign-in' : '/sign-up'}>{isSignUp ? 'Masuk' : 'Buat akun'}</a>
        </p>
      </div>
    </main>
  )
}

export function AuthBrand() { return null }

