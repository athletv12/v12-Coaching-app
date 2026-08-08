import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Alle KI-Aufrufe (Food-Erkennung, Workout-Parser, Coach-Chat, Kalorienschätzung)
// laufen durch DIESEN Endpunkt statt direkt vom Browser aus.
// Grund: der Anthropic API-Key darf niemals im Frontend/Browser-Code stehen,
// sonst kann jeder, der die App öffnet, damit auf Marcs Kosten Anfragen stellen.

export async function POST(req: NextRequest) {
  // 1. Prüfen: ist überhaupt jemand eingeloggt?
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  // 2. Anfrage vom Frontend entgegennehmen (max_tokens, messages — wie gehabt)
  const body = await req.json()

  // 3. An Claude weiterreichen, Key kommt aus der Server-Umgebungsvariable
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: body.max_tokens ?? 300,
      messages: body.messages
    })
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Claude-Anfrage fehlgeschlagen' }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
