# Claude Dashboard - Browser Extension

Token-Verbrauchsübersicht für Claude mit dynamischem Torten-Badge.

**Kein API Key nötig!** Die Extension nutzt die interne claude.ai API mit deiner Session.

## Features

- 🥧 **Dynamisches Torten-Icon** - Zeigt 5h-Limit Verbrauch im Badge
- ⏱️ **5-Stunden Limit** - Aktueller Verbrauch + Reset-Zeit
- 📅 **7-Tage Limit** - Wöchentlicher Verbrauch
- 📝 **Themen-Log** - Automatische Erfassung aus Chat-Titeln
- 🔄 **Auto-Sync** - Aktualisiert alle 5 Minuten im Hintergrund

## Installation (Brave/Chrome)

1. **ZIP entpacken** in einen Ordner
2. `brave://extensions` öffnen (oder `chrome://extensions`)
3. **Entwicklermodus** aktivieren (Schalter oben rechts)
4. **"Entpackte Erweiterung laden"** → Ordner auswählen
5. **Fertig!** Auf claude.ai einloggen, Badge zeigt Verbrauch

## So funktioniert's

Die Extension ruft im Hintergrund diese APIs auf:
- `/api/organizations` - Findet deine Claude-Organisation
- `/api/organizations/{id}/usage` - Holt Verbrauchsdaten

Deine Session-Cookies werden automatisch mitgeschickt - kein Login nötig.

## Dateistruktur

```
claude-dashboard/
├── manifest.json           # Extension-Konfiguration
├── background/
│   └── service-worker.js   # API-Calls, Badge-Update, Alarm
├── content/
│   └── topic-collector.js  # Chat-Titel Erfassung
├── popup/
│   └── popup.*             # Hauptansicht
├── pages/
│   └── settings.*, topics.*, history.*
└── icons/
```

## Datenschutz

- ✅ Alle Daten bleiben lokal
- ✅ Keine externen Server
- ✅ Open Source

---

v1.1.0 · Januar 2026
