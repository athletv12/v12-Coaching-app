import { createClient } from '../lib/supabase-server'

import Link from 'next/link'

// Beispiel-Seite für den Coach-Bereich.
// WICHTIG: Hier steht KEIN "where user_id = ..." im Code — das braucht es
// auch nicht. Die Datenbank (Row Level Security, siehe schema.sql) lässt
// einen Coach automatisch ALLE Zeilen sehen. Bei einem Klienten würde
// exakt dieselbe Abfrage automatisch nur seine eigene Zeile liefern.
// Das ist der Kern der Rechtetrennung: sie sitzt in der Datenbank,
// nicht im Frontend-Code — damit sie nicht umgehbar ist.

export default async function KlientenListePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
  if (me?.role !== 'coach') {
    return <p className="p-6 text-sm text-gray-500">Dieser Bereich ist nur für den Coach.</p>
  }

  const { data: pending } = await supabase.from('profiles').select('*').eq('status', 'pending')
  const { data: clients } = await supabase.from('profiles').select('*').eq('role', 'client').eq('status', 'approved')

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-1">Deine Klienten</h1>

      {pending && pending.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2">🔔 Neue Anmeldungen</p>
          {pending.map(p => (
            <div key={p.id} className="border rounded-xl p-3 mb-2 flex justify-between items-center">
              <div><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-gray-500">{p.email}</p></div>
              {/* Bestätigen/Ablehnen: als Server Action oder API-Route ausführen,
                  die "profiles.status" auf 'approved'/'declined' setzt */}
              <button className="text-xs bg-black text-white px-3 py-1.5 rounded-lg">Bestätigen</button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {clients?.map(c => (
          <Link key={c.id} href={`/klienten/${c.id}`} className="block border rounded-xl p-4">
            <p className="text-sm font-semibold">{c.name}</p>
            <p className="text-xs text-gray-500">{c.cal_target} kcal</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
