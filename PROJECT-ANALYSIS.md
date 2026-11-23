# ExamVision AI – Projektanalyse: Ausgangslage und Finalstand

Stand: 23.11.2026. Ausgangspunkt war der Codex-Übergabestand (`503dcdd`, gesichert als `baseline/codex-handover`). Der hier beschriebene Endstand baut auf der Plattformerweiterung auf und umfasst zusätzlich den sechsstufigen lokalen Assistenten und den universellen PDF-Export.

## 1. Ausgangslage bei der Übernahme

Bereits funktionsfähig war ein solides lokales Kernprodukt:

- PDF-Import mit PDF.js über alle Seiten; Seiten ohne brauchbaren Textlayer wurden gerastert und lokal per Tesseract.js nachgelesen, unleserliche Bereiche als Warnung gespeichert.
- Bild-Import (JPG/PNG, auch mehrere Dateien) mit lokaler Tesseract.js-OCR und einstellbarer OCR-Sprache.
- Rollengetrennte Dokumente: Unterrichtsmaterial, alte Arbeit (Stilvorlage), ausgefüllter Antwortbogen.
- Vorlagenanalyse in `src/core.ts` für Aufgabenanzahl, Teilaufgaben, Punkte, Aufgabenarten und Komplexität.
- Quellengebundene Aufgaben: `buildGroundedQuestions` verwendete ausschließlich Textstellen der Unterrichtsmaterialien; die alte Arbeit lieferte keine Antwortquellen.
- Lokale Antwortbewertung mit Normalisierung, Synonymen und Teilpunkten.
- Übungs- und Prüfungsmodus, Antwortbogen-Korrektur mit Nummernzuordnung, Lernanalyse und PDF-Exporte.
- Fünf Sprachen inklusive Arabisch/RTL, IndexedDB-Speicher, PWA und ein Capacitor-Android-Projekt.
- Neun gezielte Node-Tests, Typecheck grün.

## 2. Offene Punkte bei der Übernahme

- Der KI-Connector war implementiert und getestet, aber nicht mit der UI verdrahtet.
- Der Schwierigkeitsgrad war eine Auswahl ohne echte Wirkung auf Aufgabenauswahl, Formulierung und Punkte.
- Die Stilvorlage beeinflusste Aufgabenarten und Punkte, aber nicht vollständig Struktur und Komplexität.
- Lernanalyse, PDF-Umbruch und Timer-Logik waren teilweise noch nicht automatisiert abgesichert.
- Einige UI-Texte waren fest auf Deutsch; RTL im PDF war nicht sauber gelöst.
- Es gab kein Dashboard, kein Content-Studio und keine Portsynchronisierung zwischen Website und App.
- Die vorhandene APK war veraltet; ein Gerätetest stand aus.

## 3. Entscheidungen vor der Umsetzung

- **Eine Codebasis:** Website und Android teilen React/Vite-Quellen, Datenmodell, Texte und Build. Capacitor kopiert den Website-Build in die Android-App.
- **Offline zuerst:** Kein Konto, kein Backend, keine API-Schlüssel in öffentlichen Dateien oder in der APK. Der optionale KI-Connector bleibt standardmäßig aus und verlangt HTTPS, Vorschau und Zustimmung pro Anfrage.
- **Ehrlicher Assistent:** Sechs lokale Modi statt eines simulierten generativen Chats. Gespräch und Allgemeinwissen werden direkt aus einer kleinen Offline-Wissensbasis beantwortet; Materialfragen, Klassenarbeiten, Übungsaufgaben und Korrekturen bleiben strikt belegbasiert, nennen Quellen und melden fehlende Unterlagen ehrlich.
- **Ehrliche Datenportabilität:** Keine erfundene Cloud-Synchronisierung. Stattdessen strikter JSON-Export/-Import mit Bestätigungsdialog und klarer Beschreibung, dass der Import alle lokalen Daten ersetzt.
- **Invariante Klassenarbeit:** Unterrichtsmaterialien bestimmen die erlaubten Themen. Die alte Arbeit bestimmt Niveau, Aufgabenarten, Struktur, Formulierung und Punkte. Keine erfundenen Themen, keine übernommenen alten Aufgaben.
- **Echte Werkzeuge:** Jede Studio-Kachel führt eine berechenbare, testbare Operation aus und erzeugt ein gespeichertes Artefakt oder eine Datei.
- **Nur debug-signierte APK:** Kein Release-Keystore vorhanden. Geräte-/Emulator-Tests werden nicht behauptet.

## 4. Umgesetzte Architektur

Zuerst wurden pure, testbare Module gebaut und erst danach in der UI verdrahtet:

| Modul | Aufgabe |
|---|---|
| `src/types.ts`, `src/profile.ts` | Gemeinsames Datenmodell inklusive `Artifact`, `ArtifactKind`, `ChatTurn` mit optionalem `intent`; Normalisierung und Importbasis. |
| `src/assistant.ts` | Lokale Belegsuche in Materialtexten, Antwort mit Quellen und Vorschlägen; kein freies Erfinden in den gebundenen Modi. |
| `src/assistant-router.ts` | Reine, testbare Klassifikation in Normales Gespräch, Allgemeinwissen, Materialfrage, Klassenarbeit, Übungsaufgaben und Korrektur; Offline-Antworten für Gespräch und allgemeine Fakten. |
| `src/lesson.ts` | Unterrichtsentwurf aus Fach, Thema, Sprache, Dauer, Lernzielen, Niveau und Unterrichtsform. |
| `src/worksheet.ts` | Arbeitsblätter mit Aufgaben, Punkten, Musterlösungen und Materialbelegen. |
| `src/presentation.ts` | Folienreihen mit Erklärungen, Lehrerhinweisen und Quellen. |
| `src/graphics.ts` | Datenmodelle und SVG-Rendering für fünf Grafiktypen sowie PNG-/PDF-Ableitung. |
| `src/i18n.ts`, `src/i18n-platform.ts` | Vollständige DE/EN/AR/FR/ES-Texte inklusive Plattform-Keys und RTL. |
| `src/data-transfer.ts` | Strikter Export/Import mit `format: 'examvision-ai-profile'`, Version 1 und Normalisierung. |
| `src/platform-ui.tsx` | Dashboard, Studio, sieben Werkzeuge, Artefaktlisten, Vorschauen und Exportbuttons. |
| `src/main.tsx` | App-Shell, Navigation, Persistenz, Assistenten-, Export-/Import-Verdrahtung und Korrektur des Dashboard-Labels. |
| `src/style.css` | Helles Violett/Blau-Design mit Sidebar, Karten, großen Arbeitsflächen und responsiven Breakpoints. |
| `src/pdf-layout.ts`, `src/pdf-documents.ts` | Gemeinsame PDF-Bausteine für Überschriften, Fließtext, Tabellen mit wiederholten Köpfen, Bilder, Seitenumbruch, Seitenzahlen und dokumentspezifische Inhalte. |
| `core`, `analytics`, `timer`, `grading`, `ai-provider` | Bestehende Logik beibehalten, erweitert und gegen Regressionen getestet. |

## 5. Abdeckung der Anforderungen

| Anforderung | Umsetzung |
|---|---|
| Modernes PC-Design | Helle Oberfläche, Sidebar, runde Karten, klare Icons, violette/blaue Akzentfarben, responsive Layouts. |
| Dashboard | Begrüßung, Suche/Assistent, Schnellzugriff, letzte Inhalte, gespeicherte Materialien, Lernfortschritt, letzte Arbeiten, Statistik. |
| Sieben Studio-Kategorien | KI-Assistent, Unterricht planen, Arbeitsblätter, Übungsaufgaben, Präsentationen, Grafiken, Hochladen – alle mit echter Funktion. |
| Sechs Assistenten-Modi | Normales Gespräch und Allgemeinwissen ohne Materialzwang; Materialfrage, Klassenarbeit, Übungsaufgaben und Korrektur ausschließlich mit Materialbelegen. Der erkannte Modus wird als Chip angezeigt. |
| Universeller PDF-Export | Alle geeigneten erstellten Inhalte und gespeicherten Artefakte nutzen gemeinsame Builder und den normalen Browser-/Geräte-Download; die interaktive Ansicht bleibt unverändert. |
| Unterrichtsplanung | Alle geforderten Eingaben erzeugen einen strukturierten Entwurf mit Phasen, Lernzielen, Materialien und Bewertung. |
| Arbeitsblätter | Themen-/Materialauswahl, Niveau, Aufgabenzahl, Lösungen und PDF-Export. |
| Grafiken | Balkendiagramm, Zeitstrahl, Vergleich, Ablaufdiagramm, Infografik; SVG/PNG/PDF-Export. |
| Klassenarbeits-Invariante | Themen nur aus Material; Stilvorlage nur für Niveau/Form/Punkte; keine alten Aufgaben als Antwortquellen. |
| Korrektur | Nummernzuordnung, Teilpunkte, Erklärungen, Note, Statistik, Wiederholungsthemen; unleserliche Antworten bestehen nicht automatisch. |
| Gemeinsame Daten | Keine automatische Synchronisierung; manual JSON-Export/-Import wird in UI und Docs offen benannt. |
| Mehrsprachigkeit | DE/EN/AR/FR/ES, OCR-Sprache separat, Arabisch mit RTL in Oberfläche und PDF. |
| Getrennte Tests | Website im Browser geprüft; APK statisch geprüft; Gerätelauf ausdrücklich nicht behauptet. |

## 6. Verifikation

- `npm test`: **57/57** Tests grün (`core`, `analytics`, `pdf-layout`, `pdf-documents`, `timer`, `profile`, `grading`, `data-transfer`, `assistant-router`, `platform`, `i18n`).
- `npm run typecheck` und `npm run build`: erfolgreich; 2371 Module transformiert.
- Frühere Browser-E2E auf `http://localhost:4180`: PDF-Upload, belegbasierter Assistent, alle sieben Werkzeuge, alle fünf Grafiktypen, echte PDF/SVG/PNG-Downloads, Persistenz nach Reload, Dashboard-Artefakte, Klassenarbeit mit Timer, Korrektur ohne automatisches Bestehen, fünf Sprachen mit RTL, JSON-Export/Import inklusive Fehlerfall. Keine ungefangenen Konsolenfehler.
- Aktuelle Browser-E2E auf `http://localhost:5173`: 23 verschiedene Assistenten-Nachrichten mit allen sechs Modi, direkte Antworten auf die genannten Begrüßungs-/Allgemeinwissensbeispiele, Materialbindung mit hochgeladenem `strahlung.pdf`, ehrliche Fehlermeldung für `Quantenphysik`, alle geforderten PDF-Schaltflächen, A4/Seitenzahlen/Mehrseitigkeit/Tabellen/Grafik/Arabisch, Klassenarbeit, Abgabe, Musterlösung, Korrektur und Lernfortschritt. Keine ungefangenen Konsolenfehler.
- Dabei gefunden und behoben: leerer Dashboard-Button in der Seitenleiste durch veralteten `home`-Schlüssel (`navItem` nimmt jetzt ein explizites Label) sowie eine 7,25 MB große Grafik-PDF, die im Browser nicht heruntergeladen wurde (jetzt JPEG mit Quality 0,85, 36 KB, Download `completed`).
- Neue Debug-APK aus dem aktuellen Stand: `release/ExamVisionAI-1.1-debug.apk`, 5.275.496 Bytes, `ai.examvision.app`, Version 1.1/Code 2, minSdk 24, targetSdk 36, Datei-SHA-256 `69704207…c4b6`, Debug-Signer-SHA-256 `5cb13602…947cd`, gültige v2-Signatur. Der eingebettete Bundle `assets/public/assets/index-Di6tsRwy.js` stimmt exakt mit `dist/assets/index-Di6tsRwy.js` überein (`dddf44c7…4538`).

Nicht verifiziert: Installation/Laufzeit auf Android (kein Gerät, kein Emulator), echter Handschrift-OCR-Fall, Timer-Ablauf auf Gerät, separate Viewport-Breiten visuell, Live-KI-Endpunkt, Release-Signatur und Löschdialog mit echten Nutzerdaten. Einzelheiten im [TEST-REPORT.md](TEST-REPORT.md).

## 7. Bekannte Grenzen und Risiken

- Der Assistent ist kein generatives Modell. Gespräch und Allgemeinwissen kommen aus einer kleinen festen Offline-Wissensbasis; unbekannte allgemeine Fragen werden offen als unbekannt markiert. In den gebundenen Modi sind Themenbegriffe auffällige Wörter aus Textpassagen, keine fachliche Taxonomie.
- Die Bewertung ist ein lokaler Teilpunktabgleich; sie ersetzt keine pädagogische Gesamtbeurteilung.
- Handschrift-OCR bleibt fehleranfällig und benötigt manuelle Kontrolle.
- Arabisch im PDF wird über Canvas gerendert; die Unicode-Behandlung ist bewusst begrenzt und getestet.
- Es gibt bewusst keinen Cloud-Sync. Der Import ersetzt Daten vollständig; Nutzer müssen selbst Backups ablegen.
- Die APK ist debug-signiert und nur für Tests gedacht. `release/` ist gitignoriert, die Datei liegt jedoch im Projektverzeichnis bereit.
- Kein externer Font wird geladen; die CSS-Namen sind nur lokale Fallback-Ketten.
- Für öffentliche Nutzung fehlt eine Lizenzfestlegung und eine rechtliche Prüfung der Datenschutzhinweise.

## 8. Fazit

Die Website ist für alle geforderten Lehr-/Lernabläufe einschließlich der sechs Assistenten-Modi und des universellen PDF-Exports im Browser funktional geprüft. Die neue Android-Debug-APK enthält diesen Stand und wurde statisch verifiziert. Die Bedeutung der Lokalität, die Grenzen des Assistenten und das Fehlen einer Cloud-Synchronisierung werden in Oberfläche und Dokumentation ausdrücklich benannt. Eine Aussage über das Laufzeitverhalten auf einem Android-Gerät wird nicht getroffen.

## 9. Reparaturrunde v1.3.0

### Diagnose

- `pdf.save()` und `<a download>` sind in der Android-WebView kein verlässlicher Weg, um Dateien dauerhaft abzulegen oder zu öffnen.
- localStorage und IndexedDB lagen getrennt nebeneinander; ein Migrationsschritt konnte ältere Daten überschreiben.
- Die alte `all`-Seite zeigte Arbeiten nur an, bot aber keine Verwaltung.
- Safe Areas, Android-Zurück-Taste, Soft-Input-Modus und eine touchfreundliche untere Navigation fehlten.

### Umgesetzte Änderungen

| Bereich | Lösung |
|---|---|
| Persistenz | `src/storage.ts` liest und schreibt localStorage, IndexedDB und `Directory.Data/profile.json`. `src/profile-merge.ts` führt nach `savedAt` zusammen, vereinigt nach IDs und bewahrt nicht leere Felder. Autosave ist debounced (250 ms). |
| Dateien | `src/native-io.ts` speichert Blobs/Text/Binärdaten base64-kodiert unter `Directory.Data/exports`, holt eine `file://`-URI und öffnet `Share.share({ files })`. Auf der Website bleibt der Browser-Download erhalten. |
| Dateinamen | `src/file-naming.ts` erzeugt `Fach_Titel_TT-MM-JJJJ.pdf` sowie die Suffixe `Musterloesung` und `Korrektur`. |
| Arbeiten | Neue Seite **Meine Arbeiten** mit Suche, Fachfilter, Öffnen, Bearbeiten, Umbenennen, Bestätigungsdialog beim Löschen, Datum/Fach/Status und Musterlösungs-/Korrektur-Zuordnung. Die Korrektur speichert `correctionDocId` direkt an der Arbeit. |
| Mobile UI | Untere Navigation mit großen Zielen, „Mehr“-Menü, Safe-Area-Variablen, `viewport-fit=cover`, `interactive-widget=resizes-content`, `adjustResize`, 16px-Formularelemente und keine horizontalen Scrollbalken. |
| Navigation | Explizite Historie mit Android-Back-Listener; die App verlässt nur auf der Startseite. |
| Android | Offizielle Plugins `@capacitor/app`, `@capacitor/filesystem`, `@capacitor/share`; `cap sync` registriert sie, `file_paths.xml` erlaubt FileProvider-Zugriff auf `Directory.Data`. |
| Version | `package.json`, `package-lock.json` und `android/app/build.gradle` auf 1.3.0 / versionCode 5. |

### Prüfstand

`npm test`: 64/64 grün, `npm run typecheck` und `npm run build` erfolgreich, `npx cap sync android` erfolgreich. Ein lokaler Gradle-Build war nicht möglich (kein JDK und kein `ANDROID_HOME` in dieser Umgebung); der GitHub-Actions-Lauf `45207300656` hat die APK erfolgreich gebaut und verifiziert. Veröffentlicht wurde [v1.3.0](https://github.com/Baschar2010/ExamVisionAI/releases/tag/v1.3.0) mit `ExamVisionAI-v1.3.0-debug.apk` (5.318.679 Bytes, SHA-256 `5d074cfa810bdd5621c81e2b45feb01b2daebe9457418a30d22e620ddb22efbb`). Ein Gerätetest bleibt ausdrücklich offen; Details in [TEST-REPORT.md](TEST-REPORT.md#9-release-verifikation-v130).
