# Claude Dashboard

Browser-Extension zur Anzeige deines Claude-Nutzungslimits.

## Features

- **Dynamisches Badge** - Zeigt 5h-Verbrauch als Donut-Diagramm mit Prozent
- **5-Stunden Limit** - Aktueller Verbrauch + Live-Countdown bis Reset
- **7-Tage Limit** - Wochenverbrauch mit Modell-Aufschluesselung (Opus/Sonnet)
- **System-Status** - Live-Status von Web, API, Console (via status.claude.com)
- **Themen-Log** - Erfasst Chat-Titel automatisch
- **Auto-Sync** - Aktualisiert alle 5 Minuten
- **Verbrauchs-Historie** - Verlauf der Limit-Auslastung
- **Privat** - Alle Daten bleiben lokal, kein Tracking

## Voraussetzungen

- **Claude Pro** oder **Max** Abo
- **Brave** oder **Chrome** Browser
- Auf [claude.ai](https://claude.ai) eingeloggt

## Installation

1. Repository herunterladen/klonen
2. `brave://extensions` oder `chrome://extensions` oeffnen
3. **Entwicklermodus** aktivieren (Schalter oben rechts)
4. **"Entpackte Erweiterung laden"** klicken
5. Den `claude-dashboard` Ordner auswaehlen

## Verwendung

### Erste Einrichtung
1. Oeffne [claude.ai](https://claude.ai) und logge dich ein
2. Klicke auf das Extension-Icon
3. Klicke auf Sync - die Daten werden automatisch geladen

### Badge lesen
- **Zahl im Donut** = 5h-Verbrauch in %
- **Gruen** (0-39%) = Viel Kapazitaet
- **Gelb** (40-74%) = Moderat
- **Rot** (75-100%) = Fast am Limit

### Status-Anzeige
Die Punkte im Popup zeigen den Live-Status der Claude-Dienste:
- Gruen = Betriebsbereit
- Gelb = Eingeschraenkt
- Rot (pulsierend) = Ausfall
- Blau = Wartung

Klicke auf **?** fuer die vollstaendige Legende.

## Dateistruktur

```
claude-dashboard/
  manifest.json          Extension-Config (MV3)
  background/
    service-worker.js    API-Calls, Badge, Status-Sync
  content/
    topic-collector.js   Chat-Titel erfassen
  popup/                 Popup-Hauptansicht
  pages/                 Settings, Themen-Log, Historie, Spenden
  icons/                 Extension-Icons
```

## Datenschutz

- Keine externen Server (ausser claude.ai API und status.claude.com)
- Alle Daten lokal im Browser gespeichert
- Kein Tracking, keine Analytics
- Open Source - Code jederzeit einsehbar

## Lizenz

Nur fuer private Nutzung - Siehe [LICENSE](LICENSE) fuer Details.

Copyright (c) 2026 HalloWelt42
