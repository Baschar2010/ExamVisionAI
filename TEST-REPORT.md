# Testbericht

Stand: 23.11.2026. Quellstand: sechs Modi des lokalen Assistenten und universeller PDF-Export für alle geeigneten erstellten Inhalte. Die Änderungen sind aktuell noch nicht committet.

## 1. Automatische Prüfungen

| Prüfung | Ergebnis |
|---|---|
| `npm test` | **57/57 bestanden**, 0 Fehler, 0 übersprungen |
| `npm run typecheck` | ohne Fehler |
| `npm run build` | Vite-Build erfolgreich, **2371 Module** transformiert |

Getestete Module: `core`, `analytics`, `pdf-layout`, `pdf-documents`, `timer`, `profile`, `grading`, `data-transfer`, `assistant-router`, `platform`, `i18n`.

Neu abgesichert sind insbesondere die Klassifikation von mindestens 20 verschiedenen Nachrichten in alle sechs Modi, die Anwendung der Materialbindung ausschließlich auf Material-, Prüfungs-, Übungs- und Korrekturfragen, die exakten Begrüßungs- und Wissensantworten, quellengebundene Antworten, ehrliche Fehlermeldungen bei fehlenden Unterlagen, die Rückwärtskompatibilität alter Chat-Daten sowie die gemeinsamen PDF-Bausteine für Tabellen, Bilder, Arabisch, Korrekturen und Lernübersichten.

## 2. Website – Ende-zu-Ende im Browser

Umgebung: Chromium im OpenCode-Review-Pane, Dev-Server `http://localhost:5173`. Als Testdatei wurde `strahlung.pdf` (3758 Bytes) über die Oberfläche als Unterrichtsmaterial hochgeladen. Sie enthielt erkennbaren Text zu `Strahlungsarten`, `Alpha radiation is stopped by a sheet of paper.`, `Beta radiation is stopped by a thin aluminium plate.` und `Gamma radiation is only partly stopped by thick lead.`

| Schritt | Beobachtung |
|---|---|
| App-Start | Die aktualisierte Begrüßung und der Assistentenhinweis wurden angezeigt; keine ungefangenen Konsolenfehler oder Warnungen. |
| 23 Assistenten-Nachrichten | Alle Nachrichten wurden nacheinander im Live-Chat gesendet. Alle sechs Modi erschienen als Chip: `Normales Gespräch`, `Allgemeinwissen`, `Materialfrage`, `Klassenarbeit`, `Übungsaufgaben`, `Korrektur`. |
| Exakte Nutzerbeispiele | `Hallo` → `Hallo! Wie kann ich dir heute helfen?`; `Was ist die Hauptstadt von Frankreich?` → `Die Hauptstadt von Frankreich ist Paris.` Weitere Beispiele wie `Guten Morgen`, `Danke`, `Auf Wiedersehen`, `Wer bist du?`, `Was kannst du?`, `Wie geht es dir?` und `Kannst du mir helfen?` wurden ebenfalls direkt beantwortet. |
| Keine falsche Materialbindung | Bei Gespräch und Allgemeinwissen erschien nicht die Meldung `Dazu steht nichts in deinen Materialien.` oder eine vergleichbare Materialfehlermeldung. |
| Materialfrage mit Upload | `Erkläre mir die Strahlungsarten.` lieferte den Chip `Materialfrage` und eine Antwort aus `strahlung.pdf` mit Quellenangabe. |
| Fehlendes Thema | `Erkläre mir die Quantenphysik.` lieferte ebenfalls den Chip `Materialfrage`, aber korrekt `Dazu steht nichts in deinen Materialien.` |
| Studio-PDF-Buttons | Unterrichtsentwurf, Arbeitsblatt, Übungsaufgaben, Präsentation und Grafik wurden über die Schaltfläche `Als PDF herunterladen` erzeugt. Die Downloads waren `completed`: 14.594, 12.418, 7.851, 16.433 bzw. 36.513 Bytes. |
| Gespeicherte Artefakte | Die Studio-Aktion und die Dashboard-Aktion mit `aria-label="Als PDF herunterladen"` erzeugten jeweils erfolgreich eine PDF-Datei. |
| Klassenarbeit und Korrektur | Aus dem Material wurde eine Arbeit erstellt, beantwortet und abgegeben. Danach waren `Als PDF herunterladen`, `Musterlösung als PDF` und `Korrektur als PDF` vorhanden und erzeugten erfolgreich Dateien (6.284, 6.424 und 14.228 Bytes). |
| Lernfortschritt | Die Schaltfläche `Als PDF herunterladen` erzeugte `Lernfortschritt-ExamVision-AI.pdf` (7702 Bytes). |
| PDF-Struktur | Stichproben wurden mit pdf.js geprüft: A4-Seiten (595 × 842 pt), Seitenzahlen `Seite n / m` auf allen Seiten, mehrseitige Unterrichts- und Korrektur-Dokumente, Tabellentext in Arbeitsblatt/Übersicht und ein eingebettetes Bild in der Grafik-PDF. |
| Arabisch / RTL | Nach dem Sprachwechsel war `document.documentElement.dir === 'rtl'`. Der PDF-Button hieß `تنزيل بصيغة PDF` und erzeugte `مسودة الدرس_ الموضوع.pdf` (2.361.200 Bytes). Die Sprache wurde anschließend wieder auf Deutsch zurückgesetzt. |

Während der E2E-Läufe traten keine ungefangenen JavaScript-Fehler in der Konsole auf.

## 3. Gefundener und behobener Fehler

### Grafik-PDF war zu groß für den Browser-Download

Der erste Grafik-PDF-Export erzeugte eine 7.251.065 Bytes große Datei. Das Einbetten des mit Scale 2 erzeugten PNG führte im Browser zu einem `failed`-Download ohne Konsolenfehler. `svgToPngDataUrl` rendert jetzt mit Scale 1 als JPEG (Qualität 0,85); `PdfImage` enthält ein optionales `format`, und `main.tsx` übergibt `JPEG` an `pdf.addImage`. Danach war `Begriffshäufigkeiten.pdf` nur noch 36.513 Bytes und der Download `completed`.

Zusätzlich blieb der bereits zuvor behobene Fehler behoben, dass der Dashboard-Navigationseintrag leer war: `navItem` akzeptiert jetzt ein explizites Label, sodass Dashboard und Studio korrekt beschriftet sind.

## 4. Android-Status

- Für den aktuellen Quellstand wurde eine neue Debug-APK gebaut: `release/ExamVisionAI-1.1-debug.apk`, **5.275.496 Bytes**.
- `npx cap sync android`: erfolgreich; aktuelles `dist` und `capacitor.config.json` wurden nach `android/app/src/main/assets` kopiert.
- `gradlew.bat assembleDebug --no-daemon`: **BUILD SUCCESSFUL** mit JDK 21; 93 Tasks, davon 27 ausgeführt.
- Statische Prüfung: `ai.examvision.app`, versionCode `2`, versionName `1.1`, minSdk `24`, targetSdk `36`, compileSdk `36`.
- Datei-SHA-256: `6970420785cf67ca0a6360fb84733ba19ef19316ce2c530279043edf4b82c4b6`.
- `apksigner verify --verbose --print-certs`: **Verifies**, gültig mit APK Signature Scheme v2, 1 Signer, `C=US, O=Android, CN=Android Debug`, Signer-SHA-256 `5cb13602e7a003d61c9739842f74e32d869fe84ae8f7b68f1b2ecc42ac1947cd`.
- Der APK-Eintrag `assets/public/assets/index-Di6tsRwy.js` hat denselben SHA-256 wie `dist/assets/index-Di6tsRwy.js` (`dddf44c7539040d512ec1085f600caab844f7c140ac20567eebdc74fbd474538`). Damit ist belegt, dass die APK den aktuellen Website-Bundle mit den Assistant- und PDF-Änderungen enthält.
- `adb devices` meldete keine Geräte; ein Emulator-Binary war nicht vorhanden. Installation, Start, Dateizugriff, OCR, Persistenz und Download-Verhalten auf einem echten Android-Gerät wurden daher **nicht** getestet.
- Es ist kein Release-Keystore vorhanden; die APK ist debug-signiert und nur für Tests gedacht.

## 5. Weitere nicht verifizierte Punkte

- Kein Timerlauf bis 0 inklusive automatischer Abgabe auf einem echten Gerät.
- Kein echtes Handschriftfoto; die Korrektur unlesbarer Antwortbogen wurde mit einem Text-PDF simuliert.
- Keine separaten Visuelltests für alle medialen Breakpoints.
- Kein Live-AI-Endpunkt konfiguriert; der optionale Konnektor bleibt HTTPS-only, Vorschau- und Zustimmungspflichtig und ist per Unit-Tests abgesichert.
- Keine Löschung echter Nutzerdaten über den Löschdialog.

## 6. Bewertung

Die Website ist für die geprüften Arbeitsabläufe im Browser funktional verifiziert: Der Assistent unterscheidet alle sechs Modi korrekt, beantwortet Gespräch und Allgemeinwissen ohne Materialeinschränkung, bleibt bei Materialfragen, Erstellungen und Korrekturen strikt quellengebunden und bietet für alle geforderten Inhalte funktionierende PDF-Downloads. Die neue Debug-APK enthält nach Bundle-Hash-Vergleich exakt diesen Stand und ist statisch geprüft; ein Laufzeitverhalten auf Android wird bewusst nicht behauptet.
