# Testbericht

Stand: 22.11.2026. Quellstand: alle Änderungen der Plattformerweiterung einschließlich der Korrektur des leeren Dashboard-Navigationseintrags.

## 1. Automatische Prüfungen

| Prüfung | Ergebnis |
|---|---|
| `npm test` | **44/44 bestanden**, 0 Fehler, 0 übersprungen |
| `npm run typecheck` | ohne Fehler |
| `npm run build` | Vite-Build erfolgreich, 2369 Module transformiert |

Getestete Module: `core`, `analytics`, `pdf-layout`, `timer`, `profile`, `grading`, `data-transfer`, `platform`, `i18n`. Enthalten sind insbesondere quellengebundene Aufgaben, Stilvorlagen-Invariante, Teilpunkte, unleserliche Antwortbogen, JSON-Export/Import, Assistenten-Belege, Unterrichts-/Arbeitsblatt-/Präsentations-/Grafikmodelle, Timer-Pause/Fortsetzen, RTL-Erkennung sowie die KI-Gating- und Schema-Validierung.

## 2. Website – Ende-zu-Ende im Browser

Umgebung: Chromium im OpenCode-Review-Pane, Dev-Server `http://localhost:4180` (`npm run dev -- --port 4180 --strictPort`). Testdatei: `physics-notes.pdf` (4710 Bytes, 3 Seiten). Die Datei wurde temporär unter `public/e2e-physics.pdf` bereitgestellt und nach dem Test entfernt.

| Schritt | Beobachtung |
|---|---|
| Dashboard geöffnet | Begrüßung, Suche, Schnellzugriff, alle Statistikkarten und Hinweis „keine automatische Cloud-Synchronisierung“ sichtbar; keine Konsolenfehler. |
| Studio-Navigation | Alle sieben Werkzeuge erreichbar: Assistent, Unterricht planen, Arbeitsblätter, Übungsaufgaben, Präsentationen, Grafiken, Hochladen. |
| PDF-Upload als Unterrichtsmaterial | `physics-notes.pdf: 3 Seiten · 8 belegte Textstellen`, `100% Lesbarkeit`, Dokumentenzähler 1; keine Konsolenfehler. |
| Assistent | Frage „Was stoppt Alpha-Strahlung?“ lieferte zwei Belege aus `physics-notes.pdf`, u. a. „Alpha radiation is stopped by paper.“ Keine freie Erfindung. |
| Unterricht planen | Fach `Physik`, Thema `Strahlung`, Lernziel eingegeben; Entwurf mit vier Phasen, Lehrkraft/Lernende, Materialien, Differenzierung, Bewertung und Quellen erzeugt; Artefakt gespeichert. PDF-Download `Unterrichtsentwurf_ Strahlung.pdf` (9767 Bytes). |
| Arbeitsblätter | Titel, Thema, Anweisung und 3 Aufgaben eingestellt; Aufgaben und Musterlösungen stammten aus Materialstellen. PDF `Strahlung Arbeitsblatt.pdf` (5958 Bytes). |
| Übungsaufgaben | 3 Aufgaben erzeugt; Antworten geprüft: `1/1`, `1/1`, `0/1` mit konkreten fehlenden Begriffen und „Musterlösung anzeigen“. |
| Präsentationen | 9 Folien erzeugt, Folie 1 → 2 funktionierte, Lehrerhinweise und Quellen vorhanden. PDF `Präsentationen_ Strahlung.pdf` (10793 Bytes). |
| Grafiken | Alle fünf Typen erzeugt: Begriffshäufigkeiten, Zeitstrahl, Vergleich, Ablaufdiagramm, Infografik. SVG, PNG und PDF wurden tatsächlich heruntergeladen: `Begriffshäufigkeiten.svg` (4498), `.pdf` (4076), `.png` (87539 Bytes). |
| Persistenz | Nach neuem Tab wurden 1 Material, 9 Artefakte und 1 Chat-Eintrag aus IndexedDB geladen. Das neueste Artefakt öffnete das passende Studio-Werkzeug. |
| Klassenarbeit | 5 quellengebundene Aufgaben erstellt, beantwortet und abgegeben; 2/5 Punkte, 40 %, Note 5, Teilaufgaben mit Begründungen; „Weiter lernen“ zeigte Wiederholungsthemen. PDF der Arbeit heruntergeladen. |
| Timer | Prüfungsmodus mit 5:00 countdown; Anzeige wechselte auf 4:54; Pausieren und Fortsetzen funktionierten; anschließend abgegeben. |
| Antwortbogen-Korrektur | PDF ohne nummerierte Antworten hochgeladen und ausgewertet. Ergebnis 0/5 mit „Keine nummerierte Antwort erkannt. Bitte manuell prüfen.“ Die unlesbaren Antworten wurden **nicht** automatisch bestanden. |
| Sprachen | DE, EN, AR, FR, ES nacheinander in Einstellungen gewählt; Oberfläche übersetzte sich, Arabisch setzte `document.dir = rtl`; zurück auf DE setzte `ltr`. Keine Konsolenfehler. |
| Datenexport | JSON mit `format: examvision-ai-profile`, Version 1, 28184 Bytes, 2 Dokumente, 9 Artefakte, 1 Chat-Eintrag, 2 Arbeiten. |
| Datenimport | Dieselbe Datei importiert; Bestätigungsdialog bestätigt; Zähler nach Import: 1 Unterrichtsmaterial, 9 Artefakte, 2 Arbeiten, 47 Minuten Lernzeit. Keine Konsolenfehler. |
| Fehlerfall Import | Fremdes JSON (`{"hello":"world"}`) wurde abgewiesen und zeigte „Die Datei konnte nicht als ExamVision-AI-Datendatei gelesen werden.“ |
| Downloads | Alle erzeugten Dateien erschienen im Download-Verzeichnis des Browser-Tabs mit `state: completed`. |

Während der E2E-Läufe traten keine ungefangenen JavaScript-Fehler in der Konsole auf.

### Gefundener und behobener Fehler

Die Seitenleiste zeigte für das Dashboard zunächst einen leeren Button, weil `navItem('dashboard', …)` den alten Schlüssel `home` nicht mehr auflöste. `navItem` akzeptiert jetzt ein explizites Label; Dashboard und Studio erhalten `t.home` bzw. `t.studio`. Danach waren beide Einträge korrekt beschriftet und navigierbar.

## 3. Android-Build und statische APK-Prüfung

- `npx cap sync android`: erfolgreich; Web-Assets und `capacitor.config.json` in `android/app/src/main/assets` kopiert.
- `gradlew.bat assembleDebug --no-daemon`: **BUILD SUCCESSFUL** in 28 s.
- Kopie: `release/ExamVisionAI-1.1-debug.apk`, **5.275.495 Bytes**.
- `apksigner verify --print-certs`: gültig, Signer `C=US, O=Android, CN=Android Debug`, SHA-256 `5cb13602e7a003d61c9739842f74e32d869fe84ae8f7b68f1b2ecc42ac1947cd`.
- `aapt dump badging`: `ai.examvision.app`, versionCode `2`, versionName `1.1`, minSdk `24`, targetSdk `36`.
- Datei-SHA-256: `323f6089cfaf346f9d312e652901f1c0e5ca9fba966dfbb4dca822872c1385a4`.
- Der APK-Eintrag `assets/public/assets/index-CMjklHOn.js` hat denselben SHA-256 wie `dist/assets/index-CMjklHOn.js` (`94b7ee427dbe3ee321f2adc7964f5501c1795692d34328accff617a0bafdb76d`). Damit ist belegt, dass die APK den aktuellen Website-Bundle enthält.

## 4. Nicht durchgeführt / nicht verifiziert

- **Kein Android-Gerät und kein Emulator:** `adb devices` meldete keine Geräte; der Emulator-Binary-Pfad war nicht vorhanden. Installation, Start, Dateizugriff, OCR und Persistenz auf Android wurden daher **nicht** getestet.
- Kein Timerlauf bis 0 inklusive automatischer Abgabe auf einem echten Gerät; im Browser wurden nur Countdown und Pause/Fortsetzen geprüft.
- Kein echtes Handschriftfoto und keine unklare OCR-Zuordnung mit realen handschriftlichen Antworten. Die PDF-Fehlerzuordnung wurde mit einem Text-PDF simuliert.
- Keine Emulation verschiedener Viewport-Breiten; die medialen Breakpoints 1240/1020/760/430 px sind implementiert und codebasisch geprüft, aber nicht in separaten Fenstergrößen visuell getestet.
- Kein Live-AI-Endpunkt konfiguriert; HTTPS-Zwang, Vorschau und Zustimmung sind per Unit-Tests abgesichert und in einer früheren Browserprüfung dieses Standes ohne echten Netzwerkversand kontrolliert.
- Kein Release-Keystore; die APK ist debug-signiert und nur für Tests gedacht.
- Keine Löschung echter Nutzerdaten über den Löschdialog.

## 5. Bewertung

Die Website ist für alle geforderten Arbeitsabläufe im Browser funktional geprüft. Die Android-APK ist aus demselben aktuellen Quellstand gebaut und statisch verifiziert; eine Aussage über Laufzeitverhalten auf einem Gerät wird bewusst nicht getroffen.
