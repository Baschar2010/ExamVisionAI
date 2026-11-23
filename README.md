# ExamVision AI

ExamVision AI ist eine gemeinsame Codebasis für eine moderne PC-Website und eine Android-App. Die Anwendung arbeitet standardmäßig vollständig lokal: Unterrichtsmaterialien werden im Browser ausgelesen, daraus werden quellengebundene Lerninhalte erzeugt, und alle Daten bleiben auf dem Gerät.

## Funktionsumfang

### Lernraum und Content-Studio

- Helles responsives Design mit Sidebar, Dashboard, großen Arbeitsflächen und runden Karten in Violett/Blau. Auf kleinen Displays: untere Navigation mit großen Touch-Zielen, „Mehr“-Menü, Safe-Area-Abstände, angepasste Tastatur im Hoch-/Querformat und kein horizontales Scrollen. Die Android-Zurück-Taste navigiert innerhalb der App und beendet sie nur auf der Startseite.
- Dashboard mit Begrüßung, Suche/Assistent, Schnellzugriff, zuletzt erstellten Inhalten, gespeicherten Materialien, Lernfortschritt, letzten Arbeiten und persönlicher Statistik.
- Content-Studio mit sieben echten Werkzeugen: **KI-Assistent**, **Unterricht planen**, **Arbeitsblätter**, **Übungsaufgaben**, **Präsentationen**, **Grafiken** und **Hochladen**.
- Assistent mit sechs lokalen Modi: **Normales Gespräch**, **Allgemeinwissen**, **Materialfrage**, **Klassenarbeit**, **Übungsaufgaben** und **Korrektur**. Gespräch und allgemeine Fragen werden direkt beantwortet (offline-Wissensbasis); materialbezogene Anfragen, Erstellungen und Korrekturen bleiben strikt an hochgeladene Textstellen gebunden und nennen Quellen oder weisen auf fehlende Unterlagen hin. Jede Antwort zeigt den erkannten Modus als Chip. Kein simulatives generatives Modell und kein API-Schlüssel erforderlich.
- Unterrichtsentwürfe aus Fach, Thema, Sprache, Dauer, Lernzielen, Schwierigkeitsgrad und Unterrichtsform mit vier Phasen, Differenzierung, Bewertung und Quellen.
- Arbeitsblätter und Übungsaufgaben aus ausgewählten Materialtextstellen, mit Musterlösungen, Teilpunkten und sofortigem Feedback.
- Präsentationen mit Folien, Erklärungen, Lehrerhinweisen und Quellen; PDF-Export.
- Grafiken als Balkendiagramm, Zeitstrahl, Vergleich, Ablaufdiagramm und Infografik; Export als SVG, PNG und PDF.
- Artefakte werden gespeichert, im Dashboard und in der Studio-Seitenleiste angezeigt, wieder geöffnet, als PDF heruntergeladen und gelöscht.
- **Einheitlicher PDF-Export:** Für Unterrichtsentwürfe, Arbeitsblätter, Übungsaufgaben, Prüfungen, Musterlösungen, Korrekturen, Lernübersichten, Präsentationen, Grafiken und alle gespeicherten/zuletzt erstellten Inhalte steht die Schaltfläche **„Als PDF herunterladen“** bereit (bzw. „Musterlösung als PDF“ und „Korrektur als PDF“). Alle PDFs sind A4, mit lesbarer Schrift, Überschriften, Abständen, Tabellen, eingebetteten Grafiken, Seitenzahlen und umbrechenden Seiten; Arabisch wird RTL gerendert. Dateinamen folgen `Fach_Titel_TT-MM-JJJJ.pdf` mit den Suffixen `Musterloesung` und `Korrektur`. Auf Android wird die Datei app-privat gespeichert und anschließend der native Teilen-/Öffnen-Dialog geöffnet; im Browser läuft der gewohnte Download.

### Klassenarbeiten und Korrektur

- PDF-Textauslesung mit PDF.js über alle Seiten; unleserliche oder leere Seiten werden markiert und per lokaler OCR nachgelesen.
- OCR für JPG und PNG mit Tesseract.js. Sprachdaten werden beim ersten Einsatz kostenlos geladen; Bilder werden nicht an einen Erkennungsserver gesendet.
- Getrennte Rollen: Unterrichtsmaterial, alte Arbeit (Stilvorlage), ausgefüllter Antwortbogen.
- **Invariante:** Unterrichtsmaterialien liefern die erlaubten Themen und Antwortbelege. Die alte Arbeit liefert nur Schwierigkeitsgrad, Aufgabenarten, Struktur, Formulierungsstil und Punkte. Es werden keine Themen erfunden und keine alten Aufgaben übernommen.
- Übungs-/Prüfungsmodus mit Timer, Pause/Fortsetzen, Aufgabenwechsel, Antwortspeicherung und Abgabe.
- Korrektur mit Nummernzuordnung, Teilpunkten, Begründungen, Notenberechnung, Statistik und Wiederholungsthemen. Nicht sicher zuordenbare oder unleserliche Antworten werden **nicht** automatisch als richtig gewertet.
- **Meine Arbeiten:** Alle gespeicherten Arbeiten mit Erstellungsdatum, Fach, Punktestand und Zuordnung von Musterlösung/Korrektur; Suche, Fachfilter, Öffnen, Bearbeiten, Umbenennen, Löschen mit Bestätigung sowie PDF-Exporte direkt aus der Liste.
- Lernanalyse mit Themenprozenten, Durchschnitt, Trend und PDF-Bericht (**„Als PDF herunterladen“**).
- Optionaler, standardmäßig deaktivierter KI-Connector für einen eigenen HTTPS-Endpunkt: Vorschau der übertragenen Auszüge, ausdrückliche Zustimmung pro Anfrage, Antwortvalidierung und lokaler Fallback. Keine API-Schlüssel in der App.

### Daten und Sprachen

- Deutsch, Englisch, Arabisch (RTL), Französisch und Spanisch; OCR-Sprache separat einstellbar.
- **Automatische, dauerhafte Speicherung ohne Konto:** Änderungen werden nach 250 ms in localStorage und IndexedDB gesichert. Auf Android zusätzlich als `profile.json` im app-privaten Gerätespeicher (`Directory.Data`). Beim Start werden alle Quellen anhand ihres `savedAt` zusammengeführt; vorhandene Objekte werden nie stillschweigend gelöscht. Löschen erfolgt ausschließlich über den ausdrücklichen Bestätigungsdialog in den Einstellungen.
- **Keine automatische Cloud-Synchronisierung.** Daten werden als JSON exportiert und auf dem anderen Gerät manuell importiert. Die App sagt das ausdrücklich in Dashboard und Einstellungen.
- Installierbare Web-App/PWA und Capacitor-Android-Projekt aus derselben Quelle.

## Grenzen, die die App offen ausweist

Der lokale Assistent beantwortet Gespräch und Allgemeinwissen aus einer kleinen Offline-Wissensbasis; für Materialfragen, Erstellungen und Korrekturen durchsucht er nur vorhandene Textstellen und formuliert keine neuen fachlichen Behauptungen. Bei unbekannten allgemeinen Fragen sagt er das offen, statt eine Materialfehlermeldung zu zeigen. Ohne eigene Konfiguration ist kein generatives Modell verbunden. Die automatische Bewertung ist ein lokaler Abgleich mit Teilpunkten, keine pädagogische Gesamtbewertung; KI-Korrekturen sind gekennzeichnete Vorschläge. Handschrift-OCR ist nicht zuverlässig und benötigt manuelle Kontrolle. Themenvorschläge sind auffällige Wörter aus Textpassagen, keine fachliche Taxonomie. Ein echter Cloud-Sync existiert nicht; der JSON-Import ersetzt die lokalen Daten nach Bestätigung vollständig.

## Verifikation – kurz

- `npm test`: **64/64** Tests bestanden, davon neu: Dateinamen, `savedAt`-Migration und verlustfreies Zusammenführen mehrerer Speicherquellen.
- `npm run typecheck` und `npm run build`: erfolgreich (2386 Module transformiert).
- Frühere Browser-E2E unter `http://localhost:5173`: 23 Assistenten-Nachrichten mit allen sechs Modi, Materialbindung mit hochgeladenem PDF, alle Studio-Werkzeuge, alle geforderten PDF-Schaltflächen, A4/Seitenzahlen/Mehrseitigkeit/Tabellen/Grafik/Arabisch, Artefakt-Persistenz, Klassenarbeit, Abgabe, Musterlösung, Korrektur und Lernfortschritt. Keine ungefangenen Konsolenfehler.
- Neu für v1.3.0 automatisiert geprüft: drei native Capacitor-Plugins im Android-Sync, `file_paths.xml` für `Directory.Data`, Soft-Input-Modus `adjustResize`, Safe-Area-Viewport und `savedAt`-Merge ohne Datenverlust.
- Letzte verifizierte veröffentlichte APK: [Release v1.2.1](https://github.com/Baschar2010/ExamVisionAI/releases/tag/v1.2.1) mit `ExamVisionAI-v1.2.1-debug.apk` (5.169.783 Bytes, SHA-256 `78f7a5cd04f6cf7f89fcd3fa4bab4b32db322466b73f0777b1f767185c6298d5`), versionName 1.2.1/Code 4, debug-signiert. Nachweise in [TEST-REPORT.md](TEST-REPORT.md#7-automatische-github-release-veröffentlichung).
- **Keine Installation oder Nutzung auf einem Android-Gerät/Emulator** durchgeführt; Datei-Sharing, OCR, Persistenz und Download-Verhalten auf Gerät sind nicht verifiziert. Details in [TEST-REPORT.md](TEST-REPORT.md).

## Website starten

Voraussetzung: Node.js 20+ und npm.

```bash
npm install
npm run dev
```

Die lokale Adresse wird im Terminal ausgegeben, üblicherweise `http://localhost:5173`. Für einen Produktionsbuild:

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

## Android-Build mit Capacitor

Voraussetzungen: Android Studio/SDK, JDK 21 und gesetztes `ANDROID_HOME`.

```bash
npm install
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug --no-daemon
```

Die APK liegt dann unter `android/app/build/outputs/apk/debug/app-debug.apk`. Aktuelle Download-APKs entstehen automatisch unter [GitHub Releases](https://github.com/Baschar2010/ExamVisionAI/releases). Für einen offiziell signierten Release einen eigenen Keystore verwenden und nie in Git committen; die automatisierten APKs sind ausdrücklich nur debug-signiert. PDFs und die native Datensicherung landen im app-privaten Verzeichnis `Directory.Data`; über den Teilen-Dialog können exportierte Dateien geöffnet oder gespeichert werden.

## Release veröffentlichen (GitHub Actions)

Ein Push eines Tags nach `v*` startet den Workflow `.github/workflows/android-release.yml`. Er installiert die Abhängigkeiten, führt `npm test` und `npm run build` aus, synchronisiert Capacitor, baut mit JDK 21 die Debug-APK, legt ein Build-Artefakt an und erstellt anschließend ein GitHub Release mit der benannten APK als Download.

So veröffentlichst du eine neue Version:

1. Änderungen committen und nach `main` pushen: `git push origin main`.
2. Version anheben: `versionCode` und `versionName` in `android/app/build.gradle` sowie `version` in `package.json` und `package-lock.json` (z. B. `1.3.0`, `versionCode 5`). Erneut committen und pushen.
3. Tag erstellen und pushen:
   ```bash
   git tag -a v1.3.0 -m "ExamVision AI 1.3.0"
   git push origin v1.3.0
   ```
4. Den Lauf unter [Actions](https://github.com/Baschar2010/ExamVisionAI/actions) prüfen. Nach Erfolg steht das Release unter [Releases](https://github.com/Baschar2010/ExamVisionAI/releases) mit der Datei `ExamVisionAI-v1.3.0-debug.apk` bereit.

Der Titel des Releases lautet `ExamVision AI <Tag> – Debug-APK`. In den Release-Notizen steht ausdrücklich, dass die APK mit dem Android-Debug-Schlüssel signiert und nicht offiziell signiert ist. Es werden keine Tokens, Passwörter oder privaten Schlüssel im Repository benötigt; der Workflow nutzt nur das automatisch bereitgestellte `github.token` mit `contents: write`.

## Datenschutz und Konfiguration

Standardmäßig gibt es kein Backend, kein Konto, keine API-Schlüssel und keine automatische Synchronisierung. Dokumente, Artefakte, Chatverlauf, Antworten und Fortschritt liegen lokal im Browser und auf Android zusätzlich als app-private Datei. Der optionale KI-Connector überträgt ausschließlich nach sichtbarer Vorschau und expliziter Zustimmung pro Anfrage an einen selbst konfigurierten HTTPS-Endpunkt; API-Schlüssel gehören auf diesen Server. Siehe [PRIVACY.md](PRIVACY.md) und [INSTALL.md](INSTALL.md).

## Lizenz

Projektcode ohne festgelegte Lizenz. Vor öffentlicher Wiederverwendung eine Lizenz ergänzen und Abhängigkeiten prüfen.
