# ExamVision AI

Eine lokal arbeitende, mehrsprachige Lern-App für Android und moderne Browser. Die App erzeugt Aufgaben aus dem tatsächlich erkannten Text eigener Unterrichtsmaterialien und kann daraus Klassenarbeiten und PDFs erstellen.

## Funktionsumfang

- PDF-Textauslesung mit PDF.js über alle Seiten, inklusive unleserlicher/leer erkannter Inhalte als Hinweis.
- OCR für JPG und PNG mit Tesseract.js. OCR-Sprachdaten werden bei der ersten Erkennung kostenlos vom Tesseract-CDN geladen; danach verarbeitet Tesseract die Bilddatei lokal. Die App weist auf diese Netzwerkverbindung hin.
- Unterrichtsunterlagen und Stilvorlage für frühere Arbeiten getrennt. Stilvorlage liefert keine Antwortquellen; jede Aufgabe referenziert eine ausgewählte Materialtextstelle. Aufgaben werden nicht von der alten Arbeit übernommen.
- Lokal erzeugte Fragen, Übungs-/Prüfungsmodus mit Timer, Aufgabenwechsel, Antwortspeicherung und Abgabe.
- Schwierigkeitsanalyse der Materialtextstellen; das gewählte Niveau beeinflusst Aufgabenauswahl, Aufgabenformulierung und (ohne Stilvorlage) Punkte.
- Lernanalyse mit prozentualen Ergebnissen je Thema, Durchschnitt, Trend und PDF-Bericht.
- Optionaler, standardmäßig deaktivierter KI-Connector für einen selbst konfigurierten HTTPS-Endpunkt: Vorschau der übertragenen Auszüge, ausdrückliche Zustimmung pro Anfrage, Antwortvalidierung und lokaler Fallback. Keine API-Schlüssel in der App.
- Korrekturmodus: Antwortbogen als PDF/Bild importieren, OCR lokal ausführen und Antworten anhand erkannter Aufgabennummern zuordnen. Ohne sichere Nummern erfolgt keine Zuordnung und die App verlangt manuelle Prüfung.
- Lokaler Schlüsselwortabgleich für eine grobe Ergebnisorientierung, konfigurierbare Notenschwellen, Themenwiederholung und Lernzeit.
- PDF-Export der Arbeit mit optionalen Lösungen sowie Lernübersicht, A4-Format und Seitenzahlen.
- Deutsch, Englisch, Arabisch (RTL), Französisch und Spanisch; OCR-Sprache separat konfigurierbar.
- Speicherung ohne Konto in IndexedDB des Browsers, mit kleinem localStorage-Fallback; Löschen über Einstellungen.
- Installierbare Web-App / PWA und Capacitor Android-Projekt.

## Grenzen, die die App offen ausweist

Standardmäßig ist kein generatives KI-Modell verbunden. Die Fragen entstehen lokal aus erkannten Textpassagen. Optional kann im Einstellungsbereich ein eigener HTTPS-Endpunkt und ein Modellname hinterlegt werden; ohne ausdrückliche Zustimmung pro Anfrage wird nichts übertragen, und die Antworten werden auf Beleg, Thema, Punkte und Schema geprüft. Die automatische Bewertung bleibt ein grober lokal unterstützter Abgleich; eine KI-Korrektur ist ebenfalls optional und immer als Vorschlag gekennzeichnet. Handschrift wird durch OCR nicht zuverlässig verstanden; erkannte Textstellen sollten überprüft werden. Themenvorschläge sind auffällige Wörter aus Textpassagen, keine belastbare fachliche Taxonomie. Die Stilvorlage liefert Aufgabenarten, Punktwerte und Stilniveau, aber keine Antwortquellen. Unleserliche PDF-Seiten werden gerastert und per OCR nachgelesen; weiterhin unleserliche Seiten werden markiert. Der PDF-Export behandelt Seitenzahlen, lange Texte und Arabisch/RTL über Bild-Rendering; die arabische Texterkennung hängt von Tesseract-Sprachdaten und Dokumentqualität ab.

Die genannten Einschränkungen sind bewusst sichtbar; die App behauptet keine KI-Verbindung oder zuverlässige Handschriftkorrektur.

## Verifikation

`npm test` führt 18 Node-Tests für interne Logik, Analytik, PDF-Layout und KI-Validierung aus. `npm run typecheck` und `npm run build` liefen erfolgreich. Der Browser-Ende-zu-Ende-Ablauf bestätigte Material-, Stilvorlagen- und Antwortbogen-Import, Arbeitserstellung mit Niveau-Einfluss, Beantwortung, Abgabe mit Teilpunkten, Lernanalyse, Korrektur, PDF-Download, Einstellungen, arabisches RTL und den KI-Zustimmungsweg: Ohne Zustimmung bleibt der Senden-Button deaktiviert; ein HTTP-Endpunkt wird vor jedem Netzwerkaufruf abgewiesen. Die frische Debug-APK `release/ExamVisionAI-1.1-debug.apk` (versionCode 2, versionName 1.1) wurde mit `apksigner verify --print-certs` geprüft.

Der Antwortbogen-Upload und die Auswertung wurden im Browser durchgeführt; bei der verwendeten Testdatei wurden die Antworten nicht sicher zugeordnet und die App wies korrekt auf manuelle Prüfung hin. Echtes Handschrift-OCR, Timerablauf bis null, eine größere numberierte Musterkorrektur und die Installation auf einem Android-Gerät bleiben ungeprüft. Es war kein Gerät oder Emulator angeschlossen.

## Entwicklung

Voraussetzungen: Node.js 20+ (PDF.js aktuelle Version benötigt moderne Node/Web APIs), npm.

```bash
npm install
npm run dev
```

Produktionsbuild und Typprüfung:

```bash
npm test
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

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**. Für einen signierten Release-Build einen eigenen Keystore verwenden und niemals in Git committen. Alternativ nach Installation des Android SDK `cd android && .\gradlew assembleDebug` ausführen. Die aktuelle geprüfte Debug-APK liegt unter `release/ExamVisionAI-1.1-debug.apk`, der Gradle-Rohausgabe entspricht `android/app/build/outputs/apk/debug/app-debug.apk`.

## Datenschutz und Konfiguration

Standardmäßig sind kein Backend, kein Konto, keine API-Schlüssel und keine externen KI-Anbieter eingerichtet. Dokumenttext, Antworten und Fortschritt werden in IndexedDB auf dem Gerät im aktuellen Browser-Origin gespeichert. Browserdaten löschen oder **Einstellungen → Alle Daten löschen** verwenden. Für die lokale Bild-OCR werden beim ersten Einsatz Tesseract.js und Sprachmodelle aus dem CDN bezogen; Dateien werden nicht an einen OCR-Server hochgeladen. Der optionale KI-Connector sendet ausschließlich nach Sichtbarmachung einer Vorschau und expliziter Zustimmung pro Anfrage an einen selbst konfigurierten HTTPS-Endpunkt; die Zustimmung wird nicht dauerhaft gespeichert. Siehe [PRIVACY.md](PRIVACY.md).

## GitHub und Release

Dieses Repository enthält keine Zugangsdaten oder privaten Beispieldokumente. `.gitignore` schließt Builds, lokale SDK-Pfade, Umgebungsdateien und Keystores aus. GitHub-Release und öffentliche Veröffentlichung sind nicht automatisch erfolgt. Vor Veröffentlichung Datenschutztext, Übersetzungsqualität und Android-Anwendung unter realen Geräten prüfen.

Unter **Actions → Android Release** erzeugt ein Push eines Tags im Format `v*` ein GitHub-Release mit einer installierbaren Debug-APK. Diese APK ist für Tests vorgesehen und mit dem öffentlichen Android-Debug-Schlüssel signiert; für eine spätere Update-fähige Veröffentlichung einen privaten Release-Keystore und geschützte GitHub-Secrets einrichten.

## Lizenz

Projektcode ohne festgelegte Lizenz. Vor öffentlicher Wiederverwendung eine Lizenz ergänzen und Abhängigkeiten prüfen.
