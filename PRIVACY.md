# Dashboard fuer Claude – Datenschutzerklärung / Privacy Policy

*Letzte Aktualisierung / Last updated: 2026-03-05*

---

## 🇩🇪 Deutsch

### Überblick

Dashboard fuer Claude ist eine Browser-Erweiterung, die **ausschließlich lokal** auf deinem Gerät arbeitet. Es werden **keine Daten an externe Server übertragen**, keine Analysen durchgeführt und kein Tracking eingesetzt.

### Welche Daten werden gespeichert?

Alle Daten werden ausschließlich in der lokalen Chrome Storage API deines Browsers gespeichert:

- **Nutzungsdaten**: 5-Stunden und 7-Tage Verbrauchswerte von Claude.ai
- **Chat-Themen**: Titel deiner Claude-Chats (automatisch erfasst)
- **Historie**: Tägliche Verbrauchswerte als Verlaufsdaten
- **Status-Daten**: System-Status der Claude-Dienste
- **Einstellungen**: Organisation-UUID und Sync-Zeitstempel

### Externe Netzwerkanfragen

Dashboard fuer Claude führt folgende Netzwerkanfragen durch – **automatisch alle 5 Minuten**:

- **Claude.ai API**: Abruf deiner Nutzungs-/Limitdaten (erfordert aktive Anmeldung auf claude.ai)
- **status.claude.com**: Abruf des System-Status der Claude-Dienste

Es werden **keine Daten an Server des Entwicklers** gesendet.

### Datenspeicherung & Löschung

- Daten verbleiben **ausschließlich auf deinem Gerät**
- Daten werden gelöscht bei: Deinstallation der Erweiterung, Löschen der Browserdaten oder manueller Zurücksetzung in den Einstellungen
- Export erstellt lokale JSON-Dateien auf deinem Gerät

### Berechtigungen

| Berechtigung | Zweck |
|---|---|
| `storage` | Lokale Speicherung von Nutzungsdaten und Einstellungen |
| `alarms` | Automatische Synchronisation alle 5 Minuten |
| `host_permissions: claude.ai` | Abruf der Verbrauchsdaten von deinem Claude-Konto |
| `host_permissions: status.claude.com` | Abruf des System-Status |

### Drittanbieter-Dienste

Dashboard fuer Claude verwendet **keine** Analyse-, Werbe- oder Tracking-Dienste. Die einzigen externen Anfragen gehen an claude.ai (deine eigenen Kontodaten) und status.claude.com (öffentlicher Status).

### Deine Rechte

- **Volle Kontrolle**: Export aller Daten jederzeit als JSON
- **Löschung**: Alle Daten über die Einstellungen zurücksetzen oder Erweiterung deinstallieren
- **Transparenz**: Der vollständige Quellcode ist auf [GitHub](https://github.com/HalloWelt42/claude-limit-chrome-addon) einsehbar

### Kontakt

Bei Fragen zum Datenschutz: [GitHub Issues](https://github.com/HalloWelt42/claude-limit-chrome-addon/issues)

---

## 🇬🇧 English

### Overview

Dashboard fuer Claude is a browser extension that operates **entirely locally** on your device. **No data is transmitted to external servers**, no analytics are collected, and no tracking is used.

### What data is stored?

All data is stored exclusively in your browser's local Chrome Storage API:

- **Usage data**: 5-hour and 7-day consumption values from Claude.ai
- **Chat topics**: Titles of your Claude chats (automatically captured)
- **History**: Daily consumption values as historical data
- **Status data**: System status of Claude services
- **Settings**: Organization UUID and sync timestamps

### External network requests

Dashboard fuer Claude makes the following network requests – **automatically every 5 minutes**:

- **Claude.ai API**: Fetching your usage/limit data (requires active login on claude.ai)
- **status.claude.com**: Fetching system status of Claude services

**No data is sent to the developer's servers.**

### Data retention & deletion

- Data remains **exclusively on your device**
- Data is deleted when: uninstalling the extension, clearing browser data, or manual reset in settings
- Export creates local JSON files on your device

### Permissions

| Permission | Purpose |
|---|---|
| `storage` | Local storage of usage data and settings |
| `alarms` | Automatic synchronization every 5 minutes |
| `host_permissions: claude.ai` | Fetching consumption data from your Claude account |
| `host_permissions: status.claude.com` | Fetching system status |

### Third-party services

Dashboard fuer Claude uses **no** analytics, advertising, or tracking services. The only external requests go to claude.ai (your own account data) and status.claude.com (public status).

### Your rights

- **Full control**: Export all data anytime as JSON
- **Deletion**: Reset all data via settings or uninstall the extension
- **Transparency**: Full source code available on [GitHub](https://github.com/HalloWelt42/claude-limit-chrome-addon)

### Contact

For privacy questions: [GitHub Issues](https://github.com/HalloWelt42/claude-limit-chrome-addon/issues)
