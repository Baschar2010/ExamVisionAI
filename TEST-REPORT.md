# Testbericht

Stand: 23.11.2026. Aktueller Quellstand: v1.4.0 – fünfstufiger Prüfungsassistent, 43 eigene Aufgabentypen, sieben Studio-Artefaktarten inklusive Unterrichtsreihe und Scaffolding, Artefakt-/Materialbearbeitung und Schutz vor leeren Ergebnissen. Die Abschnitte 1–9 dokumentieren ausdrücklich die früheren Stände; die aktuellen Prüfungen stehen in Abschnitt 10.

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
- `main.tsx`: Android-Back-Listener mitsamt Navigation, globale Lade-/Erfolgsmeldungen, „Meine Arbeiten" mit Suche/Filter/CRUD/Zuordnung/PDF-Buttons, `correctionDocId` an der Arbeit, Bestätigungsdialoge für Dokument-, Artefakt- und Chat-Löschung.

### 8.3 Nicht verifiziert

- Kein lokaler Gradle-Build in dieser Umgebung: `java` fehlt, `JAVA_HOME` und `ANDROID_HOME` sind nicht gesetzt. Die Verifikation erfolgte ausschließlich über den GitHub-Actions-Lauf (siehe Abschnitt 9).
- Kein Android-Gerät und kein Emulator: Installation, FileProvider-Sharing, tatsächliches Öffnen/Speichern von PDFs, OCR, Timer-Ablauf, Back-Taste, Tastaturverhalten und Persistenz nach Neustart wurden **nicht** auf Gerät geprüft.
- Keine visuelle Gerätetest-Matrix für alle Displaygrößen und das Querformat; die CSS-Regeln sind statisch geprüft.
- Keine echten Nutzerdaten gelöscht; der Löschdialog wurde nicht mit produktiven Daten ausgeführt.
- Der optionale KI-Connector bleibt ohne konfigurierten Live-Endpunkt und ist weiterhin nur durch Unit-Tests abgesichert.

## 9. Release-Verifikation v1.3.0

- Commit auf `main`: `c22acc8`, Tag `v1.3.0` (annotiert), Push am 23.11.2026.
- GitHub-Actions-Lauf: `45207300656`, **erfolgreich** in 2 m 8 s. Alle Schritte grün: `npm ci`, `npm test` (64/64), `npm run build`, `npx cap sync android`, `assembleDebug`, APK-Prüfung, Artefakt-Upload und Release-Erstellung.
- APK-Prüfung im Runner: Datei vorhanden, `unzip -t` intakt, `aapt dump badging` meldet `package: name='ai.examvision.app' versionCode='5' versionName='1.3.0'`, `compileSdkVersion='36'`.
- Veröffentlichtes Release: https://github.com/Baschar2010/ExamVisionAI/releases/tag/v1.3.0 (nicht Draft, nicht Pre-Release), Titel `ExamVision AI v1.3.0 – Debug-APK`.
- Download-Asset: `ExamVisionAI-v1.3.0-debug.apk`, **5.318.679 Bytes**, `state: uploaded`, Inhaltstyp `application/vnd.android.package-archive`. Direkter Link: https://github.com/Baschar2010/ExamVisionAI/releases/download/v1.3.0/ExamVisionAI-v1.3.0-debug.apk
- Unabhängig heruntergeladen und lokal geprüft: SHA-256 `5d074cfa810bdd5621c81e2b45feb01b2daebe9457418a30d22e620ddb22efbb` – identisch mit dem von GitHub gemeldeten Digest.
- Signatur: debug-signiert durch den Workflow (`assembleDebug`). Wie bei v1.2.1 kann sich das Debug-Zertifikat zwischen Runner-Läufen ändern; ein Update über eine bestehende Installation ist nicht garantiert. Vorher JSON exportieren, alte Version deinstallieren, JSON importieren.
- Bekannte nicht blockierende Meldung: `actions/upload-artifact@v5` läuft auf Node 24 statt Node 20 (Deprecation-Hinweis); der Release-Pfad ist nicht betroffen.
- **Weiterhin kein Gerätetest:** Installation, FileProvider-Sharing, PDF-Öffnen/Speichern, OCR, Persistenz, Tastatur, Back-Taste und beide Ausrichtungsmodi wurden nicht auf einem Android-Gerät oder Emulator geprüft.

## 10. Erweiterung v1.4.0

### 10.1 Automatische Prüfungen

| Prüfung | Ergebnis |
|---|---|
| `npm run typecheck` | ohne Fehler |
| `npm test` | **82/82 bestanden**, 0 Fehler, 0 übersprungen |
| `npm run build` | erfolgreich, **2390 Module** transformiert |
| `npx cap sync android` | erfolgreich; `@capacitor/app@8.1.2`, `@capacitor/filesystem@8.1.5`, `@capacitor/share@8.0.3` registriert |
| Versionsstand | `package.json` und `package-lock.json`: `1.4.0`; `android/app/build.gradle`: versionCode `6`, versionName `1.4.0` |

Neue Unit-Tests: `src/creation.test.ts` (43 Formate, genau eine richtige Antwort bei Multiple Choice, zwei Optionen bei Wahr/Falsch und Aussagen, Lückentext, Formaterkennung, Lernziele, Blockumstellung, Validierung, lokale Korrektur, Speichern/Laden) und `src/to-teach-flows.test.ts` (Unterrichtsreihe, Reihenfolge, Scaffolding mit vier Phasen und echte PDF-Blöcke). Die vorhandenen i18n-Tests prüfen, dass alle neuen Texte in allen fünf Sprachen vorhanden sind.

### 10.2 Browser-Ende-zu-Ende auf sauberem Profil

Umgebung: Chromium im OpenCode-Review-Pane, Dev-Server `http://localhost:5173`. Vor dem Lauf wurden alte Doppel-Tabs geschlossen und localStorage/IndexedDB geleert. Danach wurde `strahlung.pdf` (3758 Bytes, 1 Seite, 4 belegte Textstellen, 80 % Lesbarkeit) über die Oberfläche hochgeladen. Alle Läufe waren ohne ungefangene Konsolenfehler.

| Artefakt | Ergebnis |
|---|---|
| Unterrichtsentwurf | 4 Phasen, Änderung `GEANDERTE STUNDE`, gespeichert, erneut geöffnet, PDF 14.696 Bytes |
| Arbeitsblatt | 2 Aufgaben, Änderung `GEANDERTE AUFGABE`, gespeichert, erneut geöffnet, PDF 8.757 Bytes |
| Übungsaufgaben | 2 Aufgaben, Änderung `GEANDERTE ÜBUNG`, gespeichert, erneut geöffnet, PDF 6.074 Bytes |
| Präsentation | 8 Folien, Änderung `GEANDERTE FOLIE`, gespeichert, erneut geöffnet, PDF 16.191 Bytes |
| Grafik | 8 Elemente, Änderung `GEANDERTE GRAFIK`, gespeichert, erneut geöffnet, PDF 36.103 Bytes |
| Unterrichtsreihe | 2 Stunden, Änderung `GEANDERTE REIHE`, gespeichert, erneut geöffnet, PDF 9.385 Bytes |
| Scaffolding | 4 Phasen, Änderung `GEANDERTE PHASE`, gespeichert, erneut geöffnet, PDF 13.073 Bytes |

Zusätzlich geprüft:

- **Materialbearbeitung:** Der Materialeditor änderte den Dateinamen auf `strahlung-bearbeitet.pdf` und den erkannten Text auf 260 Zeichen bei unveränderter Qualität von 0,8. Der Editor schloss sich, die Erfolgsmeldung erschien und der geänderte Text war nach dem Speichern in der Oberfläche sichtbar.
- **Fünfstufiger Assistent:** 6 Aufgaben, 26 Gesamtpunkte, 45 Minuten; lokaler KI-Vorschau-Modus blieb ohne Endpunkt deaktiviert. Eine Aufgabe wurde auf `multiple-choice` mit 4 Optionen umgestellt und eine Option bearbeitet. Nach dem Start wurden alle Aufgaben nacheinander beantwortet; Ergebnis `26/26`, `Note 1`, `100 %`.
- **PDF aus dem Assistenten:** Schülerfassung 10.289 Bytes, Musterlösung 12.822 Bytes; beide Downloads `completed`.
- **Wiedervorlage und Umbenennung:** „Meine Arbeiten" → „Bearbeiten" öffnete die gespeicherte Arbeit erneut im Assistenten. Der Titel wurde auf `Test Strahlung 1.4` geändert und gespeichert; eine veraltete 0/26-Kopie wurde über den Löschdialog entfernt.
- **Speicherstabilität:** Ein zwischenzeitlicher Rücksprung auf einen älteren Profilstand ging von mehreren offenen, veralteten Browser-Tabs aus, die denselben lokalen Speicher überschrieben. Nach dem Schließen dieser Tabs und einem sauberen Neustart blieben alle Änderungen erhalten. Die mehrquellige Zusammenführung nach `savedAt` hat dabei keine Daten still gelöscht.

### 10.3 Behobene Probleme in 1.4.0

- Aus zu kurzem Materialtext wurde zunächst ein leeres Arbeitsblatt erzeugt und gespeichert. `makeWorksheet`, `makePresentation` und `makeGraphic` prüfen jetzt das Ergebnis. Ein nachträglicher Browser-Test mit einem auf „Kurz" verkürzten Material erzeugte weder eine Vorschau noch ein neues Artefakt; die Oberfläche zeigte die Meldung „Lade erst Unterrichtsmaterial hoch.".
- Der Materialeditor und die Artefakt-Editoren schreiben jetzt direkt in das vorhandene Dokument bzw. Artefakt; zuvor gab es keinen durchgängigen Bearbeiten-→-Speichern-→-Erneut-Öffnen-Pfad für alle sieben Artefaktarten.
- Die neuen Editor- und Wizard-Oberflächen erhielten mobile Styles und stapeln Formulare auf schmalen Viewports.

### 10.4 Weiterhin nicht verifiziert

- Kein lokaler Java-/Gradle-Build: `java`, `JAVA_HOME` und `ANDROID_HOME` fehlen in dieser Umgebung. Der APK-Bau erfolgt ausschließlich im GitHub-Actions-Runner.
- Kein Android-Gerät und kein Emulator: Installation, Sharing, PDF-Öffnen, OCR, Timer-Ablauf, Tastatur, Back-Taste, Persistenz nach Neustart und beide Ausrichtungen bleiben ungeprüft.
- Für die responsive Darstellung wurde ein Screenshot erstellt; eine belastbare visuelle Beurteilung aller Breakpoints war in dieser Umgebung nicht möglich.
- Kein Live-KI-Endpunkt: Der optionale Connector ist nur per Unit-Tests und der sichtbar deaktivierten Vorschau geprüft.

### 10.5 Release v1.4.0

- Commit auf `main`: `e41f90f`, annotierter Tag `v1.4.0`, Push am 23.11.2026.
- GitHub-Actions-Lauf: `45230647773`, **erfolgreich** in 1 m 36 s. Alle Schritte grün: `npm ci`, `npm test` (82/82), `npm run build`, `npx cap sync android`, `assembleDebug`, APK-Prüfung, Artefakt-Upload und Release-Erstellung.
- Veröffentlichtes Release: https://github.com/Baschar2010/ExamVisionAI/releases/tag/v1.4.0 (nicht Draft, nicht Pre-Release), Titel `ExamVision AI v1.4.0 – Debug-APK`.
- Download-Asset: `ExamVisionAI-v1.4.0-debug.apk`, **5.355.619 Bytes**, `state: uploaded`, Inhaltstyp `application/vnd.android.package-archive`. Direkter Link: https://github.com/Baschar2010/ExamVisionAI/releases/download/v1.4.0/ExamVisionAI-v1.4.0-debug.apk
- Unabhängig heruntergeladen und lokal geprüft: SHA-256 `cb5b65f032885625c7f9d3f3324f6d96e1bb43d85b6fdd2f23e1f745bf04ab2e` – identisch mit dem von GitHub gemeldeten Digest.
- Eingebetteter Web-Bundle `assets/public/assets/index-DK7Wc2H_.js` hat denselben SHA-256 wie `dist/assets/index-DK7Wc2H_.js` (`5882c00648d043305b7441a408f2c704e7acecd4c36bd48b97bd371f7ad1cd39`).
- Die APK ist debug-signiert. Wie bei früheren Versionen kann sich das Debug-Zertifikat zwischen Runner-Läufen ändern; ein Update über eine bestehende Installation ist nicht garantiert. Vorher JSON exportieren, alte Version deinstallieren, JSON importieren.
- Bekannte nicht blockierende Meldung: `actions/upload-artifact@v5` läuft auf Node 24 statt Node 20 (Deprecation-Hinweis); der Release-Pfad ist nicht betroffen.
- **Weiterhin kein Gerätetest:** Installation, FileProvider-Sharing, PDF-Öffnen/Speichern, OCR, Persistenz, Tastatur, Back-Taste und beide Ausrichtungen wurden nicht auf einem Android-Gerät oder Emulator geprüft.
