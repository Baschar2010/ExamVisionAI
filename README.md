# ExamVision AI

ExamVision AI ist eine gemeinsame Codebasis für eine moderne PC-Website und eine Android-App. Die Anwendung arbeitet standardmäßig vollständig lokal: Unterrichtsmaterialien werden im Browser ausgelesen, daraus werden quellengebundene Lerninhalte erzeugt, und alle Daten bleiben auf dem Gerät.

## Funktionsumfang

### Lernraum und Content-Studio

- Helles responsives Design mit Sidebar, Dashboard, großen Arbeitsflächen und runden Karten in Violett/Blau.
- Dashboard mit Begrüßung, Suche/Assistent, Schnellzugriff, zuletzt erstellten Inhalten, gespeicherten Materialien, Lernfortschritt, letzten Arbeiten und persönlicher Statistik.
- Content-Studio mit sieben echten Werkzeugen: **KI-Assistent**, **Unterricht planen**, **Arbeitsblätter**, **Übungsaufgaben**, **Präsentationen**, **Grafiken** und **Hochladen**.
- Assistent mit sechs lokalen Modi: **Normales Gespräch**, **Allgemeinwissen**, **Materialfrage**, **Klassenarbeit**, **Übungsaufgaben** und **Korrektur**. Gespräch und allgemeine Fragen werden direkt beantwortet (offline-Wissensbasis); materialbezogene Anfragen, Erstellungen und Korrekturen bleiben strikt an hochgeladene Textstellen gebunden und nennen Quellen oder weisen auf fehlende Unterlagen hin. Jede Antwort zeigt den erkannten Modus als Chip. Kein simulatives generatives Modell und kein API-Schlüssel erforderlich.
- Unterrichtsentwürfe aus Fach, Thema, Sprache, Dauer, Lernzielen, Schwierigkeitsgrad und Unterrichtsform mit vier Phasen, Differenzierung, Bewertung und Quellen.
- Arbeitsblätter und Übungsaufgaben aus ausgewählten Materialtextstellen, mit Musterlösungen, Teilpunkten und sofortigem Feedback.
- Präsentationen mit Folien, Erklärungen, Lehrerhinweisen und Quellen; PDF-Export.
- Grafiken als Balkendiagramm, Zeitstrahl, Vergleich, Ablaufdiagramm und Infografik; Export als SVG, PNG und PDF.
- Artefakte werden gespeichert, im Dashboard und in der Studio-Seitenleiste angezeigt, wieder geöffnet, als PDF heruntergeladen und gelöscht.
- **Einheitlicher PDF-Export:** Für Unterrichtsentwürfe, Arbeitsblätter, Übungsaufgaben, Prüfungen, Musterlösungen, Korrekturen, Lernübersichten, Präsentationen, Grafiken und alle gespeicherten/zuletzt erstellten Inhalte steht die Schaltfläche **„Als PDF herunterladen“** bereit (bzw. „Musterlösung als PDF“ und „Korrektur als PDF“). Alle PDFs sind A4, mit lesbarer Schrift, Überschriften, Abständen, Tabellen, eingebetteten Grafiken, Seitenzahlen und umbrechenden Seiten; Arabisch wird RTL gerendert. Der Download läuft über den normalen Browser-/Geräte-Dialog und verändert die interaktive Ansicht nicht.

### Klassenarbeiten und Korrektur

- PDF-Textauslesung mit PDF.js über alle Seiten; unleserliche oder leere Seiten werden markiert und per lokaler OCR nachgelesen.
- OCR für JPG und PNG mit Tesseract.js. Sprachdaten werden beim ersten Einsatz kostenlos geladen; Bilder werden nicht an einen Erkennungsserver gesendet.
- Getrennte Rollen: Unterrichtsmaterial, alte Arbeit (Stilvorlage), ausgefüllter Antwortbogen.
- **Invariante:** Unterrichtsmaterialien liefern die erlaubten Themen und Antwortbelege. Die alte Arbeit liefert nur Schwierigkeitsgrad, Aufgabenarten, Struktur, Formulierungsstil und Punkte. Es werden keine Themen erfunden und keine alten Aufgaben übernommen.
- Übungs-/Prüfungsmodus mit Timer, Pause/Fortsetzen, Aufgabenwechsel, Antwortspeicherung und Abgabe.
- Korrektur mit Nummernzuordnung, Teilpunkten, Begründungen, Notenberechnung, Statistik und Wiederholungsthemen. Nicht sicher zuordenbare oder unleserliche Antworten werden **nicht** automatisch als richtig gewertet.
- Lernanalyse mit Themenprozenten, Durchschnitt, Trend und PDF-Bericht (**„Als PDF herunterladen“**).
- Optionaler, standardmäßig deaktivierter KI-Connector für einen eigenen HTTPS-Endpunkt: Vorschau der übertragenen Auszüge, ausdrückliche Zustimmung pro Anfrage, Antwortvalidierung und lokaler Fallback. Keine API-Schlüssel in der App.

### Daten und Sprachen

- Deutsch, Englisch, Arabisch (RTL), Französisch und Spanisch; OCR-Sprache separat einstellbar.
- Speicherung ohne Konto in IndexedDB mit kleinem localStorage-Fallback; Löschen über Einstellungen.
- **Keine automatische Cloud-Synchronisierung.** Daten werden als JSON exportiert und auf dem anderen Gerät manuell importiert. Die App sagt das ausdrücklich in Dashboard und Einstellungen.
- Installierbare Web-App/PWA und Capacitor-Android-Projekt aus derselben Quelle.

## Grenzen, die die App offen ausweist

Der lokale Assistent beantwortet Gespräch und Allgemeinwissen aus einer kleinen Offline-Wissensbasis; für Materialfragen, Erstellungen und Korrekturen durchsucht er nur vorhandene Textstellen und formuliert keine neuen fachlichen Behauptungen. Bei unbekannten allgemeinen Fragen sagt er das offen, statt eine Materialfehlermeldung zu zeigen. Ohne eigene Konfiguration ist kein generatives Modell verbunden. Die automatische Bewertung ist ein lokaler Abgleich mit Teilpunkten, keine pädagogische Gesamtbewertung; KI-Korrekturen sind gekennzeichnete Vorschläge. Handschrift-OCR ist nicht zuverlässig und benötigt manuelle Kontrolle. Themenvorschläge sind auffällige Wörter aus Textpassagen, keine fachliche Taxonomie. Ein echter Cloud-Sync existiert nicht; der JSON-Import ersetzt die lokalen Daten nach Bestätigung vollständig.

## Verifikation – kurz

- `npm test`: **57/57** Tests bestanden (inkl. 23 Assistenten-Nachrichten und PDF-Bausteine).
- `npm run typecheck` und `npm run build`: erfolgreich.
- Website im Chromium-Browser unter `http://localhost:5173` Ende-zu-Ende geprüft: 23 verschiedene Assistenten-Nachrichten mit allen sechs Modi, Materialbindung mit hochgeladenem PDF, alle Studio-Werkzeuge, alle geforderten PDF-Schaltflächen, A4/Seitenzahlen/Mehrseitigkeit/Tabellen/Grafik/Arabisch, Artefakt-Persistenz, Klassenarbeit, Abgabe, Musterlösung, Korrektur und Lernfortschritt. Keine ungefangenen Konsolenfehler.
- Neue Debug-APK aus dem aktuellen Stand: `release/ExamVisionAI-1.1-debug.apk` (5.275.496 Bytes, SHA-256 `6970420785cf67ca0a6360fb84733ba19ef19316ce2c530279043edf4b82c4b6`). Paket `ai.examvision.app`, Version 1.1/Code 2, minSdk 24, targetSdk 36, gültig debug-signiert (v2). Der eingebettete Bundle-Hash entspricht `dist/assets/index-Di6tsRwy.js`.
- **Keine Installation oder Nutzung auf einem Android-Gerät/Emulator** durchgeführt; Details in [TEST-REPORT.md](TEST-REPORT.md).

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

Die APK liegt dann unter `android/app/build/outputs/apk/debug/app-debug.apk`. Eine geprüfte Kopie liegt unter `release/ExamVisionAI-1.1-debug.apk`. Für einen signierten Release einen eigenen Keystore verwenden und nie in Git committen.

## Datenschutz und Konfiguration

Standardmäßig gibt es kein Backend, kein Konto, keine API-Schlüssel und keine automatische Synchronisierung. Dokumente, Artefakte, Chatverlauf, Antworten und Fortschritt liegen in IndexedDB des aktuellen Browser-Origin. Der optionale KI-Connector überträgt ausschließlich nach sichtbarer Vorschau und expliziter Zustimmung pro Anfrage an einen selbst konfigurierten HTTPS-Endpunkt; API-Schlüssel gehören auf diesen Server. Siehe [PRIVACY.md](PRIVACY.md) und [INSTALL.md](INSTALL.md).

## Lizenz

Projektcode ohne festgelegte Lizenz. Vor öffentlicher Wiederverwendung eine Lizenz ergänzen und Abhängigkeiten prüfen.
