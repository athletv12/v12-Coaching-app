'use client'
import { useState } from 'react'
import { createClient } from './lib/supabase-browser'

// Beispiel-Seite: Registrierung per E-Mail (Magic Link).
// Nach Klick erhält der Klient eine E-Mail mit Login-Link von Supabase.
// Beim ERSTEN Login wird automatisch eine Zeile in "profiles" angelegt
// (siehe supabase/schema.sql) — Status startet als 'pending', bis der
// Coach ihn im Kontrollzentrum bestätigt.

export default function LoginPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleRegister() {
    if (!name.trim() || !email.trim()) return
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { data: { name }, emailRedirectTo: `${location.origin}/heute` }
    })
    if (error) { setError(error.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="p-6 text-center">
        <p className="text-3xl mb-3">✓</p>
        <p className="font-semibold mb-1">Check deine E-Mails</p>
        <p className="text-sm text-gray-500">
          Link angeklickt → dein Coach bestätigt deine Anmeldung im Kontrollzentrum.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-lg font-bold mb-4">Willkommen bei V12</h1>
      <input placeholder="Name" value={name} onChange={e => setName(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
      <input placeholder="E-Mail" type="email" value={email} onChange={e => setEmail(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm mb-3" />
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      <button onClick={handleRegister} className="w-full bg-black text-white rounded-lg py-2 text-sm font-semibold">
        Registrierung anfragen
      </button>
    </div>
  )
}
