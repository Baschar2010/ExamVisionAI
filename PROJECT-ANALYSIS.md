# ExamVision AI – Bestandsaufnahme bei der Übernahme

Stand: 22.11.2026 (unveränderter Codex-Übergabestand, gesichert als `baseline/codex-handover`)

## 1. Was bereits funktioniert

- **PDF-Import** mit PDF.js über alle Seiten. Seiten mit zu kurzem Textlayer werden gerastert und lokal per Tesseract.js OCR gelesen; unleserliche Seiten werden als Warnung gespeichert und angezeigt.
- **Bild-Import** (JPG/PNG, auch mehrere Dateien) mit lokaler Tesseract.js-OCR und konfigurierbarer OCR-Sprache.
- **Rollengetrennte Dokumente**: Unterrichtsmaterial, alte Arbeit (Stilvorlage), ausgefüllter Antwortbogen.
- **Vorlagenanalyse** in `src/core.ts`: Aufgabenanzahl, Teilaufgaben, Punktwerte, Aufgabenarten (recall/explain/compare/calculate/diagram), mittlere Aufgabenlänge und Komplexität.
- **Quellengebundene Aufgabenerstellung**: `buildGroundedQuestions` verwendet ausschließlich Textstellen der Unterrichtsmaterialien. Die alte Arbeit liefert nur Profilmerkmale, niemals Antwortquellen oder Themen.
- **Lokale Antwortbewertung** mit Begriffsnomalisierung, Synonymgruppen und Teilpunkten (`evaluateAnswer`).
- **Prüfungsmodus** mit Countdown, Aufgabenwechsel, Antwortspeicherung und automatischer Abgabe bei Ablauf.
- **Übungsmodus** mit Themenfilter aus erkanntem Materialtext.
- **Antwortbogen-Korrektur**: OCR, Nummernzuordnung, unsichere Zuordnung wird nicht geraten, Teilpunkte und Feedback.
- **PDF-Export** der Arbeit (mit/ohne Lösungen) und der Lernübersicht.
- **Mehrsprachigkeit** (DE/EN/AR/FR/ES) inklusive arabischer RTL-Oberfläche.
- **Speicherung** in IndexedDB mit localStorage-Fallback und Löschfunktion.
- **PWA** und **Capacitor-Android-Projekt** vorhanden.
- **9 gezielte Node-Tests** grün; `npm run typecheck` grün.

## 2. Was teilweise fertig ist

- `src/ai-provider.ts` ist vollständig implementiert und getestet (HTTPS-Zwang, Zustimmung, Schema- und Belegprüfung), aber **nicht mit der UI verbunden**.
- Der Schwierigkeitsregler ist nur eine Auswahl; er beeinflusst die Aufgabenerstellung bisher nicht.
- Die Stilvorlage beeinflusst Aufgabenarten und Punktwerte, aber nicht Anzahl/Teilaufgaben/Komplexität als Standard.
- Die Lernanalyse zeigt Schwachthemen und Lernzeit, aber noch keine belastbare Statistik pro Thema.
- Einige UI-Texte sind fest auf Deutsch codiert (z. B. Korrektur- und Progressseite).
- Der PDF-Export nutzt jsPDF-Standardschriften; Arabisch/RTL wird dort nicht korrekt dargestellt. Lange Antworten können Seitenumbrüche unvollständig behandeln.
- Timer-Logik ist implementiert, aber nicht automatisiert getestet.

## 3. Was fehlt

- UI für den KI-Connector mit eigenem HTTPS-Endpunkt, Modellname und ausdrücklicher Zustimmung pro Übertragung. Keine kostenpflichtigen Dienste ohne Zustimmung.
- Schwierigkeitsgradanalyse und echte Wirkung des Niveaus auf Aufgabenauswahl, -formulierung und Punkte.
- Erweiterte Lernanalyse mit prozentualen Treffern je Thema, Trend und Export.
- Vollständige Lokalisierung der verbleibenden festen Texte.
- Unicode/RTL-fähiger PDF-Export und robuster Seitenumbruch.
- Automatisierte Tests für neue Logik; Browser-Ende-zu-Ende-Test der kritischen Pfade.
- Aktuelle APK aus dem jetzigen Quellcode inklusive Signaturprüfung und aktualisierter Dokumentation.

## 4.Technische Probleme / Risiken

- `src/main.tsx` ist stark verdichtet (lange Zeilen). Änderungen erfolgen gezielt über kleine, eindeutige Ersetzungen.
- Der KI-Connector darf nur mit ausdrücklicher Zustimmung und HTTPS verwendet werden; Standard bleibt offline.
- Tesseract-Sprachdaten werden beim ersten OCR-Lauf aus dem kostenlosen CDN geladen; dies wird in der UI und Datenschutzerklärung bereits ausgewiesen.
- Die vorhandene Debug-APK ist veraltet und muss neu gebaut werden.
- Java/Android-SDK sind im aktuellen PATH nicht sichtbar; für den Build werden die installierten Pfade ermittelt.

## 5. Grundsatz für die Weiterentwicklung

Unterrichtsmaterialien bestimmen die **erlaubten Themen**. Die alte Klassenarbeit bestimmt ausschließlich **Stil und Schwierigkeitsgrad**. Es werden keine zusätzlichen Themen erfunden. Bestehende Funktionen werden nicht gelöscht.

## 6. Abschluss der Weiterentwicklung

Alle unter Punkt 3 genannten Punkte wurden umgesetzt:

- `src/analytics.ts` liefert Themenprozente, Durchschnitt, Trend und Wiederholungs-/Sicherheitslisten; die Lernfortschrittsseite stellt sie dar und exportiert sie im PDF.
- `src/core.ts` enthält `difficultyOf`, `difficultyReport` und `effectiveStyle`; `buildGroundedQuestions` nutzt das Niveau für Passageauswahl, Fragetyp und Punkte, ohne die Stilvorlage als Antwortquelle zu verwenden.
- `src/ai-provider.ts` ist in der UI verdrahtet: Endpunkt/Modell in Einstellungen, Vorschau, Zustimmung pro Anfrage, Validierung, lokaler Fallback und optional KI-Korrektur als gekennzeichneter Vorschlag. Ohne Zustimmung und HTTPS erfolgt kein Request.
- Verbleibende feste UI-Texte wurden in alle fünf Sprachen überführt; Arabisch bleibt RTL.
- `src/pdf-layout.ts` testet Umbruch, lange Wörter und RTL-Erkennung; der PDF-Export rendert RTL-Zeilen über Canvas und nutzt Seitenzahlen.
- Tests erweitert auf 18; Typecheck, Build, Browser-E2E und frischer APK-Build inklusive `apksigner`-Prüfung erfolgreich.

Details siehe [TEST-REPORT.md](TEST-REPORT.md) und [README.md](README.md).
