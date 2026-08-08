# V12 Coaching App — Produktspezifikation

Diese Datei ist die Bauanleitung für die echte, produktive Version der App. Sie fasst alles zusammen, was in der HTML-Vorschau (`index.html`, im selben Ordner) bereits als Design und Funktionsumfang festgelegt wurde. **Die HTML-Datei dient als visuelle Referenz** — Farben, Layout, Texte, Copy exakt daraus übernehmen.

## 1. Ziel

Premium-Coaching-App für ATHLETV12 (Personal Training, Ernährungscoaching). Zwei getrennte Zugänge:
- **Klienten-App**: jeder Klient sieht ausschließlich seine eigenen Daten
- **Coach-Admin-App**: Marc sieht alle Klienten in einer Liste, kann in jeden einzelnen reingehen und alles einsehen/bearbeiten

Kein App-Store-Release nötig — läuft als PWA (Web-App, "Zum Home-Bildschirm hinzufügen") auf iPhone, später auch Desktop/MacBook.

## 2. Tech-Stack-Empfehlung

- **Frontend**: React (Next.js) — bestehendes HTML/Tailwind-Design 1:1 übernehmen
- **Backend + Datenbank + Auth**: Supabase (Postgres-Datenbank, eingebautes Auth-System, Row Level Security für die Rechtetrennung Coach/Klient, File Storage für Fotos)
- **Hosting**: Vercel oder Netlify (Frontend), Supabase Cloud (Backend)
- **KI-Funktionen**: Anthropic API (Claude) — Server-seitig aufgerufen, niemals der API-Key im Frontend (siehe Abschnitt 7)

## 3. Nutzerrollen & Rechte (das Kernstück)

Zwei Rollen in einer `users`-Tabelle, Feld `role`: `coach` | `client`.

- **Row Level Security (RLS) Regeln:**
  - `role = 'client'` → darf nur Zeilen lesen/schreiben, bei denen `user_id = auth.uid()` (nur eigene Daten)
  - `role = 'coach'` → darf alle Zeilen aller Klienten lesen; darf Zielwerte (Kalorien/Makros) als Einziger schreiben
- **Registrierung**: Klient meldet sich mit Name + E-Mail an (Supabase Auth, Magic Link oder Passwort) → Status `pending` → erscheint bei Marc im Kontrollzentrum → Marc bestätigt (`approved`) → Klient hat vollen Zugriff
- **Admin-Zugriff**: zusätzlich PIN- oder Passwort-Gate vor der Admin-Ansicht (wie im Prototyp), zusätzlich zur Rollenprüfung

## 4. Datenmodell (Kern-Tabellen)

- `users` — id, name, email, role, status (pending/approved), start_date, zoom_link
- `daily_logs` — user_id, date, water_l, steps, sleep_hours, plan (A/B/C/kondition/rest)
- `macro_targets` — user_id, cal_target, protein_target, carb_target, fat_target (nur vom Coach änderbar)
- `food_entries` — user_id, timestamp, description, source (text/foto), kcal, protein, carbs, fat
- `workout_sessions` — user_id, date, plan_key (A/B/C/kondition), exercises (JSON: Name, gewählte Variante, Sätze mit Gewicht/Wdh.)
- `habit_checks`, `supplement_checks` — user_id, date, item_key, checked
- `progress_photos` — user_id, timestamp, storage_path
- `chat_messages` — user_id, question, answer, timestamp
- `notifications` — für Coach-Postfach: user_id, type, text, timestamp, read
- `content_overrides` — key, value (für den Editor-Modus, global oder pro Coach)

## 5. Seiten & Funktionsumfang — Klienten-App (5 Tabs)

**Heute**
- Makro-Ring (kcal übrig) + Protein/Kohlenhydrate/Fett-Balken — Zielwerte nur vom Coach änderbar
- Wasser (Schnell-Buttons +0,25/+0,5 L + genaues Eingabefeld), Ziel mind. 3–4 L
- Schritte (Eingabefeld), Ziel mind. 10.000
- Schlaf (Eingabefeld), Ziel mind. 7 Std.
- Plan-Auswahl: Training A/B/C, Konditionseinheit (mit KI-Kalorienschätzung, passt Tagesbudget live an), Regenerationstag
- Tägliche Gewohnheiten (Checkliste): Schritte, Flüssigkeit, zuckerfrei, Schlaf, achtsam essen, Abend-Routine ohne Handy
- Supplements-Checkliste mit Dosierungshinweisen
- Bearbeitungsmodus: jedes Textfeld vom Coach anpassbar (siehe Abschnitt 6)

**Training**
- Hinweis: 10 Min. Aufwärmen (Rad/Laufband/Crosstrainer) vor jedem Training
- Trainingsplan A/B/C: pro Übung 1–2 Aufwärmsätze (automatisch berechnet, ~40–65 % des Arbeitsgewichts) + Arbeitssätze (Gewicht/Wdh. editierbar, Sätze hinzufügbar)
- Bei Übungen mit Alternativen (z. B. "Kniebeugen/Beinpresse", "Bankdrücken LH/KH") → Variante zuerst auswählen & bestätigen, danach erst Gewicht eintragen
- "Workout einfügen" — Freitext eines Trainingslogs wird per KI in strukturierte Übungen/Sätze umgewandelt
- Wochenübersicht: Kategorien-Tags, Top-Progress (%-Veränderung wichtiger Übungen)
- Verlauf: alle vergangenen Trainings, aufklappbar mit vollem Detail (jede Übung, jedes Gewicht)
- Leistungskurve: Gewichtsverlauf einzelner Übungen über Zeit, mit Trend (↑/↓, kg, %)

**Ernährung**
- KI Food Add: Text-Eingabe ODER Foto (Kamera) → Claude schätzt Kalorien/Makros, vor dem Loggen editierbar
- Heute geloggte Mahlzeiten (Liste)
- Baukasten & Handportionen: Protein=Handfläche, Kohlenhydrate=wölbende Hand, Gemüse=Faust, Fette=Daumen (Icons: Twemoji-Hand-Emojis, CC-BY 4.0, Attribution nicht vergessen)
- Ernährungsvorschläge: 3 Optionen pro Mahlzeit (Frühstück/Mittag/Abend)
- Einkaufsliste nach Kategorie, abhakbar
- Restaurant-Guide: 3 goldene Regeln, Küchen-Quick-Guide (Italiener/Asiatisch/Steakhouse), 80/20-Mindset
- Hinweis am Ende: "Unklar? Melde dich per WhatsApp bei deinem Coach" (echter WhatsApp-Link, `wa.me/...`)

**Fortschritt**
- Gewichts-Chart (Woche/Monat/Gesamt), fortlaufend seit Tag 1, kein Enddatum
- Trainings-Fortschritt (Kategorien + Top-Progress, Link zu Training-Tab)
- Wöchentlicher Check-in (Schritte-Ø, Schlaf-Ø, Wasser-Ø, Ernährungs-Treue %)
- Verlauf seit Tag 1 (Gewicht pro Woche)
- Fortschrittsfotos-Upload (landet automatisch im Coach-Postfach)
- Fußzeile: Start-Datum, nächster Check-in (automatisch alle 7 Tage berechnet), "Video Call" → Zoom (Link aus Coach-Einstellungen)

**Coach** (Chat)
- "Stelle deine Frage direkt hier oder frage deinen Coach bei WhatsApp"
- 3 Vorschlags-Fragen antippbar
- Chat mit Kontext (aktuelle Makros, Schritte, Trainingsplan) an Claude — Antwort erscheint auch im Coach-Postfach

## 6. Seiten & Funktionsumfang — Coach-Admin-App

**Klienten** (Startseite)
- "Neue Anmeldungen"-Bereich oben: pending Registrierungen mit Bestätigen/Ablehnen
- Liste aller aktiven Klienten (bei 10 Klienten: alle 10 als Karten, antippbar)
- Klient antippen → Detailansicht: Live-Werte (Schritte/Wasser/Schlaf), Aktivitäten-Log, Trainings-Log (voller Verlauf), Ernährungs-Log, Leistungskurve, Gewohnheiten-/Supplement-Treue in %, Fortschrittsfotos, Chat-Verlauf, Stammdaten & automatische BMR/TDEE/Makro-Berechnung (Formel: Mifflin-St-Jeor, geschlechtsspezifisch) mit "Push an Klient"-Button, Wenn-Dann-Matrix bei Plateaus, interne Notizen, Termine (Start, nächster Check-in)

**Postfach**
- Live-Feed aller Ereignisse über alle Klienten: Fragen, geloggtes Essen, Konditionseinheiten, hochgeladene Fotos — mit Zähler-Badge

**Editor**
- Bearbeitungsmodus-Schalter: aktiviert antippbare Textfelder (gestrichelter Rahmen + ✏️) auf jeder Seite der Klienten-App
- Farb-Editor: Akzentfarbe (Gold), Sekundärfarbe (Bronze), Kartenfarbe — live in beiden Apps
- "Alle Texte zurücksetzen"

**Einstellungen**
- Zoom-Link hinterlegen
- Check-in-Rhythmus (7 Tage)
- Admin-PIN/Passwort ändern

## 7. KI-Integration (wichtig für Sicherheit)

Alle Claude-API-Aufrufe (Food-Erkennung Text/Foto, Workout-Parser, Coach-Chat, Kalorienschätzung Konditionseinheit) müssen über einen **eigenen Backend-Endpoint** laufen, nicht direkt aus dem Frontend wie im HTML-Prototyp. Sonst kann jeder, der die App öffnet, mit deinem API-Key Anfragen stellen. Backend nimmt die Anfrage vom Client entgegen, ruft Claude auf, gibt nur das Ergebnis zurück.

## 8. Design

- Farben: Navy-Hintergrund `#0A0E17`, Karten `#121A2C`, Gold-Akzent `#D4AF61`, Bronze `#A67C43`, Blau `#6B8CBF` (Kohlenhydrate), Amber `#D99A54` (Fett), Grün `#7DD68B` (positive Trends)
- Schrift: Manrope (Google Fonts)
- Grundton: dunkles Premium-Dashboard, abgerundete Karten, dezente Banner in Gold/Bronze-Verlauf für Sektionstitel

## 9. Nicht mehr im echten Build

- Übungsbibliothek mit animierten Figuren (wurde entfernt, siehe Verlauf) — falls gewünscht: echte lizenzierte Übungsvideo-Datenbank einbinden (z. B. WorkoutX, ExerciseDB, Exercise Animatic)
