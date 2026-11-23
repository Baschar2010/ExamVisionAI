# Testbericht

Stand: 23.11.2026. Quellstand: v1.3.0 – dauerhafte Speicherung, native PDF-/Datei-Ausgabe, „Meine Arbeiten“, mobile Navigation und Android-Konfiguration. Die Reparaturänderungen sind zum Zeitpunkt dieses Berichts noch nicht committet. Frühere Browser-E2E-Ergebnisse unten beziehen sich ausdrücklich auf den vorherigen Stand.

## 1. Automatische Prüfungen

| Prüfung | Ergebnis |
|---|---|
| `npm test` | **64/64 bestanden**, 0 Fehler, 0 übersprungen |
| `npm run typecheck` | ohne Fehler |
| `npm run build` | Vite-Build erfolgreich, **2386 Module** transformiert |
| `npx cap sync android` | erfolgreich; `app`, `filesystem` und `share` registriert |

Getestete Module: `core`, `analytics`, `pdf-layout`, `pdf-documents`, `timer`, `profile`, `grading`, `data-transfer`, `assistant-router`, `platform`, `i18n`, `file-naming`, `profile-merge`.

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

## 4. Android-Status (früherer Stand 1.1)

> Die folgenden APK-Angaben stammen aus der vorherigen Reparaturrunde und gelten **nicht** für v1.3.0. Der aktuelle Stand ist in Abschnitt 8 beschrieben.

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

## 7. Automatische GitHub-Release-Veröffentlichung

- Workflow: `.github/workflows/android-release.yml`, Trigger `push` auf Tags `v*`, Rechte `contents: write`. Keine privaten Secrets, Tokens oder Schlüssel im Repository; der Lauf nutzt nur `github.token`.
- Ablauf: Checkout, Node 24, JDK 21, Android-SDK-Prüfung, `npm ci`, `npm test` (57/57), `npm run build`, `npx cap sync android`, `chmod +x android/gradlew`, `./gradlew assembleDebug --no-daemon`, APK-Integritätsprüfung, Build-Artefakt, Release-Notizen, Release mit benannter APK.
- Reale Läufe: `45190030476` (Tag `v1.2.0`) und `45190823252` (Tag `v1.2.1`) jeweils **erfolgreich**. Ein erneuter Lauf von `45190823252` bei bereits vorhandenem Release war ebenfalls erfolgreich; der Release-Schritt aktualisiert die APK per `gh release upload --clobber` statt abzubrechen.
- Veröffentlichtes Release: https://github.com/Baschar2010/ExamVisionAI/releases/tag/v1.2.1 (nicht Draft, nicht Pre-Release), Titel `ExamVision AI v1.2.1 – Debug-APK`.
- Download-Asset: `ExamVisionAI-v1.2.1-debug.apk`, 5.169.783 Bytes, `state: uploaded`, Inhaltstyp `application/vnd.android.package-archive`. Direkter Link: https://github.com/Baschar2010/ExamVisionAI/releases/download/v1.2.1/ExamVisionAI-v1.2.1-debug.apk
- Heruntergeladene APK erneut geprüft: Datei-SHA-256 `78f7a5cd04f6cf7f89fcd3fa4bab4b32db322466b73f0777b1f767185c6298d5` (entspricht dem von GitHub gemeldeten Digest), `ai.examvision.app`, versionCode `4`, versionName `1.2.1`, minSdk `24`, targetSdk `36`, compileSdk `36`.
- Signatur: **`Verifies`**, APK Signature Scheme v2, 1 Signer, `C=US, O=Android, CN=Android Debug`. Die APK ist ausdrücklich **nicht offiziell signiert**. Da GitHub-Runner bei jedem Lauf ein neues Debug-Zertifikat erzeugen können (hier wurden drei verschiedene Signer-Digests beobachtet), ist ein Update über eine bestehende Installation nicht garantiert; vorher exportieren, deinstallieren und importieren.
- Eingebetteter Web-Bundle `assets/public/assets/index-Di6tsRwy.js` hat denselben SHA-256 wie `dist/assets/index-Di6tsRwy.js` (`dddf44c7539040d512ec1085f600caab844f7c140ac20567eebdc74fbd474538`).
- Bekannte nicht blockierende Meldung: `actions/upload-artifact@v5` nutzt eine Node-20-Laufzeit, die vom Runner auf Node 24 umgestellt wird (Deprecation-Hinweis). Der Release-Pfad selbst ist davon nicht betroffen und mehrfach erfolgreich gelaufen.

## 8. Reparatur v1.3.0 – neue Prüfungen

### 8.1 Automatisch

| Prüfung | Ergebnis |
|---|---|
| `npm test` | **64/64 bestanden**, 0 Fehler, 0 übersprungen |
| `npm run typecheck` | ohne Fehler |
| `npm run build` | erfolgreich, **2386 Module** transformiert |
| `npx cap sync android` | erfolgreich; `capacitor.plugins.json` enthält `App`, `Filesystem`, `Share` |
| Android-Versionsstand | `android/app/build.gradle`: versionCode `5`, versionName `1.3.0`; `package.json` und `package-lock.json`: `1.3.0` |

Neue Unit-Tests:
- `src/file-naming.test.ts`: deutsche Sonderzeichen, Pfadtrenner, Datum `TT-MM-JJJJ`, Suffixe `Musterloesung`/`Korrektur`, Artefakt-Dateinamen.
- `src/profile-merge.test.ts`: Zusammenführung mehrerer Quellen nach `savedAt`, Erhalt alter Dokumente, Vorrang neuer Inhalte bei gleicher ID bei gleichzeitigem Erhalt nicht leerer Fragen, Lesbarkeit des neuen Save-Envelopes und alter Profile.

### 8.2 Statische Android-Prüfung

- `index.html`: `viewport-fit=cover` und `interactive-widget=resizes-content`.
- `src/style.css`: Safe-Area-Variablen, untere Navigation mit 48px-Touchzielen und Safe-Area-Padding, 16px-Formularelemente, HDPI-/Querformat-Anpassung, `overflow-x: hidden`.
- `AndroidManifest.xml`: `android:windowSoftInputMode="adjustResize"`.
- `file_paths.xml`: `<files-path name="files" path="." />` für FileProvider-Zugriff auf `Directory.Data`.
- `native-io.ts`: schreibt nach `Directory.Data/exports`, ruft `Filesystem.getUri` auf und übergibt ausschließlich `file://`-URIs an `Share.share({ files })`. Datei-Schreibfehler werden gemeldet; ein abgebrochener Teilen-Dialog führt zu `shared:false`, die Datei bleibt gespeichert.
- `storage.ts`: liest localStorage, IndexedDB und die native `profile.json`, führt sie nach `savedAt` zusammen und schreibt alle drei Ziele. Die Autosave-Verzögerung beträgt 250 ms.
- `main.tsx`: Android-Back-Listener mitside Navigation, globale Lade-/Erfolgsmeldungen, „Meine Arbeiten“ mit Suche/Filter/CRUD/Zuordnung/PDF-Buttons, `correctionDocId` an der Arbeit.

### 8.3 Nicht verifiziert

- Kein lokaler Gradle-Build in dieser Umgebung: `java` fehlt, `JAVA_HOME` und `ANDROID_HOME` sind nicht gesetzt. Der GitHub-Actions-Lauf ist die nächste Verifikationsinstanz.
- Kein Android-Gerät und kein Emulator: Installation, FileProvider-Sharing, tatsächliches Öffnen/Speichern von PDFs, OCR, Timer-Ablauf, Back-Taste, Tastaturverhalten und Persistenz nach Neustart wurden **nicht** auf Gerät geprüft.
- Keine visuelle Gerätetest-Matrix für alle Displaygrößen und das Querformat; die CSS-Regeln sind statisch geprüft.
- Keine echten Nutzerdaten gelöscht; der Löschdialog wurde nicht mit produktiven Daten ausgeführt.
- Der optionale KI-Connector bleibt ohne konfigurierten Live-Endpunkt und ist weiterhin nur durch Unit-Tests abgesichert.
