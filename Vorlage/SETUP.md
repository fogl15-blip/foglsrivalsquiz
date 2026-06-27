# ⚡ QuizBuzz – Setup-Anleitung

## Schritt 1: Firebase einrichten (einmalig, ~5 Minuten)

1. Gehe zu **https://console.firebase.google.com**
2. „Projekt erstellen" → Name wählen → Google Analytics aus → Erstellen
3. Linke Sidebar: **Realtime Database** → „Datenbank erstellen"
   - Standort: `europe-west1`
   - Sicherheitsregeln: **Testmodus** (30 Tage offen)
4. Linke Sidebar: **Projekteinstellungen** (Zahnrad) → „Deine Apps" → `</>` Web
   - App-Spitznamen eingeben → Registrieren (kein Hosting nötig)
   - Die angezeigte `firebaseConfig` kopieren

## Schritt 2: firebase-config.js anpassen

Die kopierten Werte in `firebase-config.js` eintragen:

```js
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",
  authDomain:        "mein-quiz-abc12.firebaseapp.com",
  databaseURL:       "https://mein-quiz-abc12-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "mein-quiz-abc12",
  storageBucket:     "mein-quiz-abc12.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc..."
};
```

## Schritt 3: Dateien hosten

**Option A – GitHub Pages (kostenlos, empfohlen)**
1. GitHub-Account → Neues Repository → alle Dateien hochladen
2. Repository-Einstellungen → Pages → Branch: main → / (root)
3. Deine URL: `https://deinname.github.io/quizbuzz/`

**Option B – Netlify Drop (schnellster Weg)**
1. Gehe zu **https://app.netlify.com/drop**
2. Ordner mit allen Dateien reinziehen
3. Fertig – direkte URL

**Option C – Lokal (nur für Tests, alle auf gleichem PC)**
```bash
# Im Ordner mit den HTML-Dateien:
npx serve .
# → http://localhost:3000
```

---

## Die 4 Seiten

| Seite | URL | Wer | Beschreibung |
|---|---|---|---|
| `editor.html` | `/editor.html` | Host | Fragen & Kategorien verwalten |
| `host.html` | `/host.html` | Host | Quiz moderieren, Punkte vergeben |
| `player.html` | `/player.html` | Spieler | Buzzer + Antwortfeld |
| `overlay.html` | `/overlay.html` | OBS | Transparentes Stream-Overlay |

## OBS einrichten

1. Quelle hinzufügen → **Browser**
2. URL: `https://deine-url.github.io/quizbuzz/overlay.html`
3. Breite: `1920` / Höhe: `220`
4. ✅ „Seite bei Sichtbarkeit aktualisieren"
5. Im Browser-Source-Einstellungen: **Benutzerdefiniertes CSS** leer lassen

## Fragen-Templates

| Template | Inhalt |
|---|---|
| 📝 Text | Reine Textfrage + Musterlösung |
| 🖼️ Bild | Bild per URL + Frage |
| 🎵 Sound | Audio-URL (MP3/OGG) + Frage |
| 🎬 Video | YouTube-Link oder MP4-URL |
| 🎯 Bild+Text | Bild + zusätzlicher Fragetext |

## Quiz-Ablauf

1. **Editor**: Kategorien anlegen, Fragen erstellen
2. **Host startet Session** → Spieler öffnen `player.html` und wählen ihren Slot
3. Host wählt Frage → **Buzzer freigeben** (Leertaste)
4. Spieler buzzen → Host sieht Reihenfolge → Punkte vergeben
5. Antwort aufdecken → nächste Frage → `→` Taste

## Keyboard-Shortcuts (Host)

| Taste | Aktion |
|---|---|
| `→` | Nächste Frage |
| `←` | Vorherige Frage |
| `Leertaste` | Buzzer sperren/freigeben |
| `R` | Buzzer zurücksetzen |

---

## Firebase Sicherheitsregeln (nach Test-Phase)

Nach 30 Tagen im Testmodus die Regeln in Firebase Console → Realtime Database → Regeln anpassen:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Für Produktion mit Passwortschutz: Firebase Authentication einrichten.
