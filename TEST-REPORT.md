# Testbericht

Stand: 22.11.2026 (nach Abschluss der Weiterentwicklung)

## Automatisierte Prüfungen

- `npm test`: 18/18 Tests bestanden (`src/core.test.ts`, `src/analytics.test.ts`, `src/pdf-layout.test.ts`).
- `npm run typecheck`: ohne Fehler.
- `npm run build`: Vite-Produktionsbuild erfolgreich.
- Geprüfte Logik: Textstellentrennung, Vorlagenanalyse, quellengebundene Aufgaben, lokale Teilpunkte, nummerierte Antwortzuordnung, KI-Schema- und HTTPS-Validierung, Lernstatistik/Trend, PDF-Zeilenumbruch/Seitenzahlen/RTL-Erkennung.

## Browser-Ende-zu-Ende

- Material-PDF (3 Seiten, 8 Textstellen), alte Stilvorlage und Antwortbogen-PDF wurden getrennt importiert.
- Arbeitserstellung mit ausgewähltem Niveau „Anspruchsvoll“: Aufgabenformulierung und Punktwerte reagierten auf die Niveauwahl; die Lösungen stammten ausschließlich aus Materialtextstellen.
- Aufgabenbeantwortung, Abgabe, Teilpunkte (1/2), Prozentanzeige und Note wurden geprüft.
- Lernanalyse zeigte Durchschnitt, Themenprozente, Trend und Wiederholungsthemen.
- Antwortbogen-Korrektur wurde ausgeführt; die Testdatei lieferte keine sichere Nummernzuordnung, weshalb die App korrekt auf manuelle Prüfung hinwies.
- PDF-Export der Arbeit erzeugte eine herunterladbare Datei; die Ausgabe wurde im Review-Pane geöffnet.
- Einstellungen: Sprachwechsel zu Arabisch setzte `.app.rtl`; anschließend zurück auf Deutsch.
- KI-Connector: Vorschau zeigte die konkreten Materialauszüge. Der Senden-Button war ohne Zustimmung deaktiviert. Nach Zustimmung wies ein konfigurierter `http://`-Endpunkt den Versand vor jedem Netzwerkaufruf zurück; es wurden keine requests an diesen Endpunkt registriert.
- Keine ungefangenen Browser-Konsolenfehler in den geprüften Abläufen.

## Android

- `npx cap sync android` erfolgreich.
- `gradlew assembleDebug --no-daemon`: BUILD SUCCESSFUL.
- Paketmetadaten: `ai.examvision.app`, versionCode 2, versionName 1.1, minSdk 24, targetSdk 36.
- `apksigner verify --print-certs` bestätigte die Signatur:
  - Signer: `C=US, O=Android, CN=Android Debug`
  - SHA-256: `5cb13602e7a003d61c9739842f74e32d869fe84ae8f7b68f1b2ecc42ac1947cd`
- APK: `release/ExamVisionAI-1.1-debug.apk` (5.275.797 Bytes).
  - Datei-SHA-256: `1d711a9f4fc95ddb84aca2f6ab947b35056a73f043e446caf20f7dd4537cfbec`.

## Nicht verifiziert

- Echtes Handschrift-OCR und unsichere OCR-Zuordnung in realen Fotos.
- Automatischer Timerablauf bis null auf einem Gerät.
- Sehr lange Arbeiten mit vielen Seiten im PDF-Export.
- Installation und Start auf einem physischen Android-Gerät/Emulator.
- Löschdialog mit echten Nutzerdaten (absichtlich nicht ausgelöst).

## Hinweise

Die KI-Korrektur ist ein optionaler, klar gekennzeichneter Vorschlag und ersetzt keine pädagogische Bewertung. Der Schwierigkeitsgrad verändert Passageauswahl, Fragetyp und Punktgebung; die Stilvorlage bleibt quellenfrei.
