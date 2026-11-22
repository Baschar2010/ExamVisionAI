# ExamVision AI

Eine lokal arbeitende, mehrsprachige Lern-App für Android und moderne Browser. Die App erzeugt Aufgaben aus dem tatsächlich erkannten Text eigener Unterrichtsmaterialien und kann daraus Klassenarbeiten und PDFs erstellen.

## Funktionsumfang

- PDF-Textauslesung mit PDF.js über alle Seiten, inklusive unleserlicher/leer erkannter Inhalte als Hinweis.
- OCR für JPG und PNG mit Tesseract.js. OCR-Sprachdaten werden bei der ersten Erkennung kostenlos vom Tesseract-CDN geladen; danach verarbeitet Tesseract die Bilddatei lokal. Die App weist auf diese Netzwerkverbindung hin.
- Unterrichtsunterlagen und Stilvorlage für frühere Arbeiten getrennt. Stilvorlage liefert keine Antwortquellen; jede Aufgabe referenziert eine ausgewählte Materialtextstelle. Aufgaben werden nicht von der alten Arbeit übernommen.
- Lokal erzeugte Fragen, Übungs-/Prüfungsmodus mit Timer, Aufgabenwechsel, Antwortspeicherung und Abgabe.
- Korrekturmodus: Antwortbogen als PDF/Bild importieren, OCR lokal ausführen und Antworten anhand erkannter Aufgabennummern zuordnen. Ohne sichere Nummern erfolgt keine Zuordnung und die App verlangt manuelle Prüfung.
- Lokaler Schlüsselwortabgleich für eine grobe Ergebnisorientierung, konfigurierbare Notenschwellen, Themenwiederholung und Lernzeit.
- PDF-Export der Arbeit mit optionalen Lösungen sowie Lernübersicht, A4-Format und Seitenzahlen.
- Deutsch, Englisch, Arabisch (RTL), Französisch und Spanisch; OCR-Sprache separat konfigurierbar.
- Speicherung ohne Konto in IndexedDB des Browsers, mit kleinem localStorage-Fallback; Löschen über Einstellungen.
- Installierbare Web-App / PWA und Capacitor Android-Projekt.

## Grenzen, die die App offen ausweist

Es ist kein generatives KI-Modell verbunden. Die Fragen entstehen durch einfache, lokale Vorlagen aus erkannten Textpassagen; das ist keine semantische KI-Aufgabenerstellung. Die automatische Bewertung ist ein grober Schlüsselwortabgleich und keine Lehrkraft- oder KI-Korrektur. Handschrift wird durch OCR nicht zuverlässig verstanden; erkannte Textstellen sollten überprüft werden. Themenvorschläge sind auffällige Wörter aus Textpassagen, keine belastbare fachliche Taxonomie. Der Schwierigkeitsregler ist in der ersten Version nur eine Auswahl und verändert die fachliche Tiefe der Belegtextfragen nicht. Die Stilvorlage wird erfasst und kann nur die Anzahl/ungefähre Textlänge beeinflussen, nicht zuverlässig den Aufgabenstil oder die Punkteverteilung. Unleserliche PDF-Scans erhalten einen Hinweis; derzeit gibt es keine PDF-Seitenrasterung als OCR-Fallback. Arabische RTL-Oberfläche ist implementiert, die Texterkennung der Bildsprache ist abhängig von Tesseract-Sprachdaten und Dokumentqualität.

Die genannten Einschränkungen sind bewusst sichtbar; die App behauptet keine KI-Verbindung oder zuverlässige Handschriftkorrektur.

## Verifikation

Der Produktionsbuild und TypeScript-Typcheck liefen erfolgreich. Ein Browser-Ende-zu-Ende-Ablauf mit erzeugten Test-PDFs bestätigte dreiseitigen Materialimport, getrennte alte Stilvorlage, Arbeitserstellung nur aus Unterrichtsunterlagen, Texteingabe, Abgabe, lokale Schlüsselwortauswertung und Notenanzeige. PDF-Export der Arbeit und Lernübersicht ließen sich öffnen; `pdfinfo` bestätigte A4 und eine Seite für den Testexport. Timer, Fortschrittsspeicherung nach Neuladen, Spracheinstellung und arabisches RTL wurden in der Production-Vorschau geprüft. OCR las einen erzeugten Bildtext mit zwei Textstellen; ein leeres Bild wurde als unleserlich ausgewiesen. Die native Android-Debug-APK wurde gebaut und mit `apksigner` verifiziert.

Der Antwortbogen-Upload ist implementiert. Ein Test-PDF mit nummerierten Antworten wurde importiert und die Korrekturseite mit Auswahl von Antwortdatei und Arbeit erreicht. Der abschließende Klick für eine zugeordnete Korrektur wurde nach der neuesten Korrekturpfad-Änderung nicht erneut in einem Browser ausgeführt. Echtes Handschrift-OCR, lange/multiseitige Exportfälle, Timerablauf bis null und Installation auf einem Android-Gerät wurden nicht verifiziert. Es war kein Android-Gerät/Emulator angeschlossen.

## Entwicklung

Voraussetzungen: Node.js 20+ (PDF.js aktuelle Version benötigt moderne Node/Web APIs), npm.

```bash
npm install
npm run dev
```

Produktionsbuild und Typprüfung:

```bash
npm run typecheck
npm run build
npm run preview
```

## Android-Build mit Capacitor

Voraussetzungen: Android Studio, Android SDK, JDK 21 und konfigurierte `ANDROID_HOME`-Variable. Android Studio enthält den SDK Manager. Die Java-/Android-Toolchain ist nicht Teil dieses Repositorys.

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**. Für einen signierten Release-Build einen eigenen Keystore verwenden und niemals in Git committen. Alternativ nach Installation des Android SDK `cd android && .\gradlew assembleDebug` ausführen. Debug-APK liegt danach typischerweise unter `android/app/build/outputs/apk/debug/app-debug.apk`.

## Datenschutz und Konfiguration

Kein Backend, kein Konto, keine API-Schlüssel und keine externen KI-Anbieter sind eingerichtet. Dokumenttext, Antworten und Fortschritt werden in IndexedDB auf dem Gerät im aktuellen Browser-Origin gespeichert. Browserdaten löschen oder **Einstellungen → Alle Daten löschen** verwenden. Für die lokale Bild-OCR werden beim ersten Einsatz Tesseract.js und Sprachmodelle aus dem CDN bezogen; Dateien werden nicht an einen OCR-Server hochgeladen. Sonst werden keine externen Inhalte eingebunden.

## GitHub und Release

Dieses Repository enthält keine Zugangsdaten oder privaten Beispieldokumente. `.gitignore` schließt Builds, lokale SDK-Pfade, Umgebungsdateien und Keystores aus. GitHub-Release und öffentliche Veröffentlichung sind nicht automatisch erfolgt. Vor Veröffentlichung Datenschutztext, Übersetzungsqualität und Android-Anwendung unter realen Geräten prüfen.

Unter **Actions → Android Release** erzeugt ein Push eines Tags im Format `v*` ein GitHub-Release mit einer installierbaren Debug-APK. Diese APK ist für Tests vorgesehen und mit dem öffentlichen Android-Debug-Schlüssel signiert; für eine spätere Update-fähige Veröffentlichung einen privaten Release-Keystore und geschützte GitHub-Secrets einrichten.

## Lizenz

Projektcode ohne festgelegte Lizenz. Vor öffentlicher Wiederverwendung eine Lizenz ergänzen und Abhängigkeiten prüfen.
