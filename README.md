# ExamVision AI

ExamVision AI ist eine gemeinsame Codebasis für eine moderne PC-Website und eine Android-App. Die Anwendung arbeitet standardmäßig vollständig lokal: Unterrichtsmaterialien werden im Browser ausgelesen, daraus werden quellengebundene Lerninhalte erzeugt, und alle Daten bleiben auf dem Gerät.

## Funktionsumfang

### Lernraum und Content-Studio

- Helles responsives Design mit Sidebar, Dashboard, großen Arbeitsflächen und runden Karten in Violett/Blau.
- Dashboard mit Begrüßung, Suche/Assistent, Schnellzugriff, zuletzt erstellten Inhalten, gespeicherten Materialien, Lernfortschritt, letzten Arbeiten und persönlicher Statistik.
- Content-Studio mit sieben echten Werkzeugen: **KI-Assistent**, **Unterricht planen**, **Arbeitsblätter**, **Übungsaufgaben**, **Präsentationen**, **Grafiken** und **Hochladen**.
- Assistent ist eine lokale, belegbasierte Materialanalyse. Er antwortet nur mit Textstellen aus hochgeladenen Materialien und nennt die Quellen; er ist kein simulatives generatives Modell.
- Unterrichtsentwürfe aus Fach, Thema, Sprache, Dauer, Lernzielen, Schwierigkeitsgrad und Unterrichtsform mit vier Phasen, Differenzierung, Bewertung und Quellen.
- Arbeitsblätter und Übungsaufgaben aus ausgewählten Materialtextstellen, mit Musterlösungen, Teilpunkten und sofortigem Feedback.
- Präsentationen mit Folien, Erklärungen, Lehrerhinweisen und Quellen; PDF-Export.
- Grafiken als Balkendiagramm, Zeitstrahl, Vergleich, Ablaufdiagramm und Infografik; Export als SVG, PNG und PDF.
- Artefakte werden gespeichert, im Dashboard und in der Studio-Seitenleiste angezeigt, wieder geöffnet und gelöscht.

### Klassenarbeiten und Korrektur

- PDF-Textauslesung mit PDF.js über alle Seiten; unleserliche oder leere Seiten werden markiert und per lokaler OCR nachgelesen.
- OCR für JPG und PNG mit Tesseract.js. Sprachdaten werden beim ersten Einsatz kostenlos geladen; Bilder werden nicht an einen Erkennungsserver gesendet.
- Getrennte Rollen: Unterrichtsmaterial, alte Arbeit (Stilvorlage), ausgefüllter Antwortbogen.
- **Invariante:** Unterrichtsmaterialien liefern die erlaubten Themen und Antwortbelege. Die alte Arbeit liefert nur Schwierigkeitsgrad, Aufgabenarten, Struktur, Formulierungsstil und Punkte. Es werden keine Themen erfunden und keine alten Aufgaben übernommen.
- Übungs-/Prüfungsmodus mit Timer, Pause/Fortsetzen, Aufgabenwechsel, Antwortspeicherung und Abgabe.
- Korrektur mit Nummernzuordnung, Teilpunkten, Begründungen, Notenberechnung, Statistik und Wiederholungsthemen. Nicht sicher zuordenbare oder unleserliche Antworten werden **nicht** automatisch als richtig gewertet.
- Lernanalyse mit Themenprozenten, Durchschnitt, Trend und PDF-Bericht.
- Optionaler, standardmäßig deaktivierter KI-Connector für einen eigenen HTTPS-Endpunkt: Vorschau der übertragenen Auszüge, ausdrückliche Zustimmung pro Anfrage, Antwortvalidierung und lokaler Fallback. Keine API-Schlüssel in der App.

### Daten und Sprachen

- Deutsch, Englisch, Arabisch (RTL), Französisch und Spanisch; OCR-Sprache separat einstellbar.
- Speicherung ohne Konto in IndexedDB mit kleinem localStorage-Fallback; Löschen über Einstellungen.
- **Keine automatische Cloud-Synchronisierung.** Daten werden als JSON exportiert und auf dem anderen Gerät manuell importiert. Die App sagt das ausdrücklich in Dashboard und Einstellungen.
- Installierbare Web-App/PWA und Capacitor-Android-Projekt aus derselben Quelle.

## Grenzen, die die App offen ausweist

Der lokale Assistent durchsucht nur vorhandene Textstellen; er formuliert keine neuen fachlichen Behauptungen. Ohne eigene Konfiguration ist kein generatives Modell verbunden. Die automatische Bewertung ist ein lokaler Abgleich mit Teilpunkten, keine pädagogische Gesamtbewertung; KI-Korrekturen sind gekennzeichnete Vorschläge. Handschrift-OCR ist nicht zuverlässig und benötigt manuelle Kontrolle. Themenvorschläge sind auffällige Wörter aus Textpassagen, keine fachliche Taxonomie. Ein echter Cloud-Sync existiert nicht; der JSON-Import ersetzt die lokalen Daten nach Bestätigung vollständig.

## Verifikation – kurz

- `npm test`: **44/44** Tests bestanden.
- `npm run typecheck` und `npm run build`: erfolgreich.
- Website im Chromium-Browser unter `http://localhost:4180` Ende-zu-Ende geprüft: Upload, Assistent, alle sieben Studio-Werkzeuge, fünf Grafiktypen, PDF/SVG/PNG-Exporte, Artefakt-Persistenz, Klassenarbeit, Timer, Korrektur, fünf Sprachen, RTL, Datenexport/-import und Fehlerfälle. Keine ungefangenen Konsolenfehler.
- Frische Debug-APK aus dem aktuellen Build: `release/ExamVisionAI-1.1-debug.apk`, signiert, Metadaten und Bundle-Hash geprüft.
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
