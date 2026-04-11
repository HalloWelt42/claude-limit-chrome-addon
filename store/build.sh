#!/usr/bin/env bash
#
# Packt eine Chrome-Web-Store-ZIP des Addons.
#
# Nutzung: bash store/build.sh
#
# Das Skript arbeitet vom Projektroot aus, liest die Version aus
# manifest.json und legt die ZIP in store/ ab. Es verwendet eine
# explizite Include-Liste -- so koennen keine Ordner "vergessen"
# werden, und danach wird verifiziert, dass alles Wesentliche drin
# ist (inkl. shared/i18n.js, an der v1.26/v1.27 gescheitert sind).

set -euo pipefail

# --- Pfad-Setup ---------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# --- Version aus manifest.json lesen ------------------------------
if [[ ! -f manifest.json ]]; then
  echo "FEHLER: manifest.json nicht gefunden (CWD: $PWD)" >&2
  exit 1
fi

VERSION="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' manifest.json | head -n1)"
if [[ -z "$VERSION" ]]; then
  echo "FEHLER: Konnte Version aus manifest.json nicht ermitteln" >&2
  exit 1
fi

ZIP_NAME="dashboard-fuer-claude-v${VERSION}.zip"
ZIP_PATH="store/${ZIP_NAME}"

echo "Packe ${ZIP_NAME} ..."

# --- Alte ZIP wegraeumen ------------------------------------------
rm -f "$ZIP_PATH"
mkdir -p store

# --- Pflicht-Includes ---------------------------------------------
# Jeder Eintrag muss existieren; sonst fliegt das Skript raus.
INCLUDES=(
  "manifest.json"
  "background"
  "popup"
  "pages"
  "content"
  "shared"
  "icons"
  "_locales"
)

for entry in "${INCLUDES[@]}"; do
  if [[ ! -e "$entry" ]]; then
    echo "FEHLER: Pflichteintrag fehlt im Projekt: $entry" >&2
    exit 1
  fi
done

# --- ZIP bauen ----------------------------------------------------
# -r  rekursiv
# -q  ruhig (wir geben unten selbst Feedback)
# -X  keine extra Attribute (keine macOS-Metadaten)
# Ausschluss-Muster: Editor-/OS-Muell
zip -r -q -X "$ZIP_PATH" "${INCLUDES[@]}" \
  -x '*.DS_Store' \
  -x '*/.DS_Store' \
  -x '._*' \
  -x '*/._*' \
  -x '*~' \
  -x '*/*~'

# --- Verifikation -------------------------------------------------
echo
echo "Verifiziere $ZIP_PATH ..."

# Hilfsfunktion: pruefen, ob ein Pfad im ZIP vorhanden ist
require_in_zip() {
  local needle="$1"
  if ! unzip -l "$ZIP_PATH" | awk '{print $4}' | grep -Fxq "$needle"; then
    echo "FEHLER: '$needle' fehlt in $ZIP_PATH" >&2
    exit 1
  fi
}

# Wichtige Einzel-Dateien pruefen
require_in_zip "manifest.json"
require_in_zip "shared/i18n.js"
require_in_zip "popup/popup.html"
require_in_zip "popup/popup.js"
require_in_zip "background/service-worker.js"
require_in_zip "content/topic-collector.js"

# Alle 20 Locales pruefen
LOCALE_COUNT="$(unzip -l "$ZIP_PATH" | awk '{print $4}' | grep -c '^_locales/.*/messages.json$' || true)"
if [[ "$LOCALE_COUNT" -ne 20 ]]; then
  echo "FEHLER: Erwartete 20 _locales/*/messages.json, gefunden: $LOCALE_COUNT" >&2
  exit 1
fi

# Unerwuenschtes darf NICHT drin sein
FORBIDDEN=(
  ".git"
  "store/"
  "README.md"
  "LICENSE"
  "PRIVACY.md"
)
for entry in "${FORBIDDEN[@]}"; do
  if unzip -l "$ZIP_PATH" | awk '{print $4}' | grep -q "^${entry}"; then
    echo "FEHLER: Unerwuenschter Eintrag in ZIP: $entry" >&2
    exit 1
  fi
done

# Version in manifest der ZIP pruefen
ZIP_VERSION="$(unzip -p "$ZIP_PATH" manifest.json | sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"
if [[ "$ZIP_VERSION" != "$VERSION" ]]; then
  echo "FEHLER: ZIP-Manifest-Version ($ZIP_VERSION) != erwartete Version ($VERSION)" >&2
  exit 1
fi

# --- Zusammenfassung ----------------------------------------------
FILE_COUNT="$(unzip -l "$ZIP_PATH" | tail -n1 | awk '{print $2}')"
ZIP_BYTES="$(wc -c < "$ZIP_PATH" | tr -d ' ')"

echo
echo "OK: $ZIP_PATH"
echo "  Version:    $VERSION"
echo "  Dateien:    $FILE_COUNT"
echo "  Groesse:    $ZIP_BYTES Bytes"
echo "  Locales:    $LOCALE_COUNT"
echo "  shared/i18n.js: enthalten"
