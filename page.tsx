import { createClient } from '@/lib/supabase-server'

// Beispiel-Seite für den Klienten-Bereich.
// Dieselbe Bauweise wie die Coach-Seite (kein "where user_id" nötig) —
// aber weil der eingeloggte Nutzer hier role=client hat, liefert die
// Datenbank automatisch NUR seine eigene Zeile zurück, nie die anderer
// Klienten. Genau diese Symmetrie ist beabsichtigt: gleicher Code,
// unterschiedliches Ergebnis je nach Rolle des eingeloggten Nutzers.

export default async function HeutePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
  const today = new Date().toISOString().slice(0, 10)
  const { data: log } = await supabase.from('daily_logs').select('*').eq('user_id', user?.id).eq('log_date', today).maybeSingle()

  const calLeft = (profile?.cal_target ?? 0) - 0 // hier noch heutige food_entries summieren

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">Guten Morgen, {profile?.name}</h1>
      <div className="border rounded-2xl p-5 mb-3">
        <p className="text-sm text-gray-500">Heutige Makros</p>
        <p className="text-3xl font-bold">{calLeft} <span className="text-sm font-normal">kcal übrig</span></p>
        <p className="text-xs text-gray-500 mt-1">Protein-Ziel: {profile?.protein_target}g (nur Coach kann das ändern)</p>
      </div>
      <div className="border rounded-2xl p-4">
        <p className="text-sm">💧 Wasser heute: {log?.water_l ?? 0} L</p>
        <p className="text-sm">👟 Schritte: {log?.steps ?? 0}</p>
        <p className="text-sm">😴 Schlaf: {log?.sleep_hours ?? '–'} Std</p>
      </div>
      {/* Restliche Felder (Plan-Auswahl, Gewohnheiten, Supplements) exakt
          nach dem Muster aus index.html übernehmen — gleiche Query-Logik */}
    </div>
  )
}
