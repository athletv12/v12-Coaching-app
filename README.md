# V12 Coaching App — echtes Projekt-Grundgerüst

Dieser Ordner ist der Start des echten Produkts. Das Schwierigste — Datenbank, Zugriffsrechte (Coach sieht alle, Klient nur sich selbst), Login, sicherer KI-Aufruf — ist fertig. Der Rest sind die restlichen Seiten aus `index.html`, 1:1 nach dem Muster der drei Beispiel-Seiten übertragen.

## Was hier drin ist

```
supabase/schema.sql          → Datenbank + Zugriffsregeln (das Herzstück)
lib/supabase-browser.ts      → Supabase-Verbindung im Browser
lib/supabase-server.ts       → Supabase-Verbindung auf dem Server
app/api/claude-proxy/route.ts → sicherer KI-Endpunkt (API-Key bleibt geheim)
app/login/page.tsx           → Registrierung (Beispiel)
app/(coach)/klienten/page.tsx → Coach sieht alle Klienten (Beispiel)
app/(client)/heute/page.tsx  → Klient sieht nur sich selbst (Beispiel)
```

## Schritt für Schritt

**1. Supabase-Projekt anlegen** (kostenlos)
   - Auf supabase.com registrieren, neues Projekt erstellen
   - Unter "SQL Editor" den kompletten Inhalt von `supabase/schema.sql` einfügen und ausführen
   - Unter "Authentication" → "Providers" → Email aktivieren (Magic Link)
   - Unter "Storage" einen Bucket `progress-photos` anlegen
   - Unter "Settings" → "API" die Werte `Project URL` und `anon public key` kopieren

**2. Diesen Ordner Claude Code geben**
   - Diesen kompletten Ordner + die `index.html` (Design-Referenz) + `V12-App-Spezifikation.md` in ein neues Projektverzeichnis
   - Auftrag an Claude Code: *"Vervollständige dieses Next.js-Projekt — übertrage alle restlichen Seiten aus index.html nach dem Muster der drei bestehenden Beispiel-Seiten in app/. Halte dich an die Row-Level-Security-Logik aus supabase/schema.sql — nie user_id manuell filtern, die Datenbank regelt das."*
   - Claude Code kann `npm install`, `npm run dev` ausführen und Fehler direkt sehen und beheben — das kann ich hier im Chat nicht

**3. Umgebungsvariablen setzen**
   - `.env.example` zu `.env.local` kopieren, echte Werte aus Schritt 1 eintragen
   - Zusätzlich einen Anthropic API-Key eintragen (console.anthropic.com)

**4. Ersten Coach-Account anlegen**
   - Einmal über `/login` mit deiner eigenen E-Mail registrieren
   - In Supabase SQL Editor: `update profiles set role='coach', status='approved' where email='deine@email.de';`

**5. Deployment**
   - Projekt auf GitHub hochladen (du hast bereits ein GitHub-Konto)
   - Bei vercel.com das Repo verbinden, Umgebungsvariablen aus `.env.local` dort eintragen
   - Fertig — echte URL, echte Datenbank, jeder Klient sein eigenes Konto
