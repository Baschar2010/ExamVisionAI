# ExamVision AI – Projektanalyse: Ausgangslage und Finalstand

Stand: 22.11.2026. Ausgangspunkt war der Codex-Übergabestand (`503dcdd`, gesichert als `baseline/codex-handover`). Der hier beschriebene Endstand baut auf `304377a` auf und umfasst die vollständige Plattformerweiterung.

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
- **Ehrlicher Assistent:** Lokale, belegbasierte Materialanalyse statt eines simulierten generativen Chats. Antworten enthalten Quellstellen; Bei fehlenden Materialien wird das gesagt.
- **Ehrliche Datenportabilität:** Keine erfundene Cloud-Synchronisierung. Stattdessen strikter JSON-Export/-Import mit Bestätigungsdialog und klarer Beschreibung, dass der Import alle lokalen Daten ersetzt.
- **Invariante Klassenarbeit:** Unterrichtsmaterialien bestimmen die erlaubten Themen. Die alte Arbeit bestimmt Niveau, Aufgabenarten, Struktur, Formulierung und Punkte. Keine erfundenen Themen, keine übernommenen alten Aufgaben.
- **Echte Werkzeuge:** Jede Studio-Kachel führt eine berechenbare, testbare Operation aus und erzeugt ein gespeichertes Artefakt oder eine Datei.
- **Nur debug-signierte APK:** Kein Release-Keystore vorhanden. Geräte-/Emulator-Tests werden nicht behauptet.

## 4. Umgesetzte Architektur

Zuerst wurden pure, testbare Module gebaut und erst danach in der UI verdrahtet:

| Modul | Aufgabe |
|---|---|
| `src/types.ts`, `src/profile.ts` | Gemeinsames Datenmodell inklusive `Artifact`, `ArtifactKind`, `ChatTurn`; Normalisierung und Importbasis. |
| `src/assistant.ts` | Lokale Belegsuche in Materialtexten, Antwort mit Quellen und Vorschlägen; kein freies Erfinden. |
| `src/lesson.ts` | Unterrichtsentwurf aus Fach, Thema, Sprache, Dauer, Lernzielen, Niveau und Unterrichtsform. |
| `src/worksheet.ts` | Arbeitsblätter mit Aufgaben, Punkten, Musterlösungen und Materialbelegen. |
| `src/presentation.ts` | Folienreihen mit Erklärungen, Lehrerhinweisen und Quellen. |
| `src/graphics.ts` | Datenmodelle und SVG-Rendering für fünf Grafiktypen sowie PNG-/PDF-Ableitung. |
| `src/i18n.ts`, `src/i18n-platform.ts` | Vollständige DE/EN/AR/FR/ES-Texte inklusive Plattform-Keys und RTL. |
| `src/data-transfer.ts` | Strikter Export/Import mit `format: 'examvision-ai-profile'`, Version 1 und Normalisierung. |
| `src/platform-ui.tsx` | Dashboard, Studio, sieben Werkzeuge, Artefaktlisten, Vorschauen und Exportbuttons. |
| `src/main.tsx` | App-Shell, Navigation, Persistenz, Assistenten-, Export-/Import-Verdrahtung und Korrektur des Dashboard-Labels. |
| `src/style.css` | Helles Violett/Blau-Design mit Sidebar, Karten, großen Arbeitsflächen und responsiven Breakpoints. |
| `core`, `analytics`, `pdf-layout`, `timer`, `grading`, `ai-provider` | Bestehende Logik beibehalten, erweitert und gegen Regressionen getestet. |

## 5. Abdeckung der Anforderungen

| Anforderung | Umsetzung |
|---|---|
| Modernes PC-Design | Helle Oberfläche, Sidebar, runde Karten, klare Icons, violette/blaue Akzentfarben, responsive Layouts. |
| Dashboard | Begrüßung, Suche/Assistent, Schnellzugriff, letzte Inhalte, gespeicherte Materialien, Lernfortschritt, letzte Arbeiten, Statistik. |
| Sieben Studio-Kategorien | KI-Assistent, Unterricht planen, Arbeitsblätter, Übungsaufgaben, Präsentationen, Grafiken, Hochladen – alle mit echter Funktion. |
| Unterrichtsplanung | Alle geforderten Eingaben erzeugen einen strukturierten Entwurf mit Phasen, Lernzielen, Materialien und Bewertung. |
| Arbeitsblätter | Themen-/Materialauswahl, Niveau, Aufgabenzahl, Lösungen und PDF-Export. |
| Grafiken | Balkendiagramm, Zeitstrahl, Vergleich, Ablaufdiagramm, Infografik; SVG/PNG/PDF-Export. |
| Klassenarbeits-Invariante | Themen nur aus Material; Stilvorlage nur für Niveau/Form/Punkte; keine alten Aufgaben als Antwortquellen. |
| Korrektur | Nummernzuordnung, Teilpunkte, Erklärungen, Note, Statistik, Wiederholungsthemen; unleserliche Antworten bestehen nicht automatisch. |
| Gemeinsame Daten | Keine automatische Synchronisierung; manual JSON-Export/-Import wird in UI und Docs offen benannt. |
| Mehrsprachigkeit | DE/EN/AR/FR/ES, OCR-Sprache separat, Arabisch mit RTL in Oberfläche und PDF. |
| Getrennte Tests | Website im Browser geprüft; APK statisch geprüft; Gerätelauf ausdrücklich nicht behauptet. |

## 6. Verifikation

- `npm test`: **44/44** Tests grün (`core`, `analytics`, `pdf-layout`, `timer`, `profile`, `grading`, `data-transfer`, `platform`, `i18n`).
- `npm run typecheck` und `npm run build`: erfolgreich; 2369 Module transformiert.
- Browser-E2E auf `http://localhost:4180`: PDF-Upload, belegbasierter Assistent, alle sieben Werkzeuge, alle fünf Grafiktypen, echte PDF/SVG/PNG-Downloads, Persistenz nach Reload, Dashboard-Artefakte, Klassenarbeit mit Timer, Korrektur ohne automatisches Bestehen, fünf Sprachen mit RTL, JSON-Export/Import inklusive Fehlerfall. Keine ungefangenen Konsolenfehler.
- Dabei gefunden und behoben: leerer Dashboard-Button in der Seitenleiste durch veralteten `home`-Schlüssel; `navItem` nimmt jetzt ein explizites Label.
- Frische APK: `release/ExamVisionAI-1.1-debug.apk`, 5.275.495 Bytes, `ai.examvision.app`, Version 1.1/Code 2, minSdk 24, targetSdk 36. Datei-SHA-256 `323f6089cfaf346f9d312e652901f1c0e5ca9fba966dfbb4dca822872c1385a4`; Debug-Signer-SHA-256 `5cb13602e7a003d61c9739842f74e32d869fe84ae8f7b68f1b2ecc42ac1947cd`. Der JS-Bundle-Hash in der APK stimmt mit `dist` überein (`94b7ee42…76d`).

Nicht verifiziert: Installation/Laufzeit auf Android (kein Gerät, kein Emulator), echter Handschrift-OCR-Fall, Timer-Ablauf auf Gerät, separate Viewport-Breiten visuell, Live-KI-Endpunkt, Release-Signatur und Löschdialog mit echten Nutzerdaten. Einzelheiten im [TEST-REPORT.md](TEST-REPORT.md).

## 7. Bekannte Grenzen und Risiken

- Der Assistent ist retrieval-basiert, kein generatives Modell. Themenbegriffe sind auffällige Wörter aus Textpassagen, keine fachliche Taxonomie.
- Die Bewertung ist ein lokaler Teilpunktabgleich; sie ersetzt keine pädagogische Gesamtbeurteilung.
- Handschrift-OCR bleibt fehleranfällig und benötigt manuelle Kontrolle.
- Arabisch im PDF wird über Canvas gerendert; die Unicode-Behandlung ist bewusst begrenzt und getestet.
- Es gibt bewusst keinen Cloud-Sync. Der Import ersetzt Daten vollständig; Nutzer müssen selbst Backups ablegen.
- Die APK ist debug-signiert und nur für Tests gedacht. `release/` ist gitignoriert, die Datei liegt jedoch im Projektverzeichnis bereit.
- Kein externer Font wird geladen; die CSS-Namen sind nur lokale Fallback-Ketten.
- Für öffentliche Nutzung fehlt eine Lizenzfestlegung und eine rechtliche Prüfung der Datenschutzhinweise.

## 8. Fazit

Die Website ist für alle geforderten Lehr-/Lernabläufe im Browser funktional geprüft. Die Android-APK stammt aus exakt demselben aktuellen Build und ist statisch verifiziert. Die Bedeutung der Lokalität, die Grenzen des Assistenten und das Fehlen einer Cloud-Synchronisierung werden in Oberfläche und Dokumentation ausdrücklich benannt. Eine Aussage über das Laufzeitverhalten auf einem Android-Gerät wird nicht getroffen.
