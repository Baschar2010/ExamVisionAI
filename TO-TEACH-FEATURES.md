# Funktionsliste: Erstellungsablauf für Klassenarbeiten und Tests

Stand: 23.11.2026, Version 1.4.0. Grundlage sind ausschließlich öffentlich zugängliche Seiten von to teach (to-teach.ai), die öffentliche Partnerdokumentation von fobizz und die vom Nutzer bereitgestellten Screenshots als visueller Referenz. Es wurden keine Quellcodes, Logos, Bilder oder geschützten Designelemente übernommen. Die folgende Umsetzung ist eine eigene Implementierung mit vergleichbarer Funktionalität innerhalb von ExamVision AI.

## 1. Öffentlich dokumentierter Erstellungsablauf von to teach

Quellen (abgerufen am 23.11.2026):

- `https://to-teach.ai/use-case/de/worksheet`
- `https://to-teach.ai/use-case/de/exercises`
- `https://to-teach.ai/use-case/de/lesson-plan`
- `https://to-teach.ai/help/de/tutorials` sowie die Tutorials „Arbeitsblätter erstellen", „Arbeitsblätter bearbeiten", „Unterrichtsentwurf erstellen", „Unterrichtsreihe planen", „Material Tools", „Der Scaffolding-Entwurf – Arbeitsblätter"
- `https://www.mieriesuperklasse.de/RK/fobizz.pdf` (öffentliches Fortbildungsdokument, Schrittfolge Arbeitsblatt-Assistent)
- `https://to-teach.ai/blog/de/multiple-choice-quiz-fuer-den-unterricht-erstellen`

### 1.1 Arbeitsblatt / Klassenarbeit (drei Schritte)

1. **Thema & Rahmen:** Sprache wählen, Alter/Klassenstufe wählen, Fach wählen, Thema oder Leitfrage eingeben; optional „An meine Inhalte anpassen" (eigene Inhalte hochladen).
2. **Entwurf bearbeiten:** Lernziele ergänzen/anpassen; Aufgabenblöcke ergänzen/anpassen und per Drag & Drop ordnen; Inhalte 6/10; Sachtext, Zuordnen, Kreuzworträtsel usw.; pro Aufgabe Erwartungshorizont/Musterlösung.
3. **Arbeitsblatt erhalten:** PDF oder DOCX, mit Lösungen, editierbar; Name/Klasse/Datum-Kopfzeile; digital teilen.

Zusätzlich dokumentiert: didaktische Vorlagen nach Fach, Sprachniveau und Art filtern und nach Themen suchen; über 30 Aufgabentypen; Differenzierung nach Sprache, Alter und Fach; Materialien aus eigenen Dateien oder digitalisiertem PDF.

### 1.2 Übungsaufgaben (drei Schritte)

1. **Inhalt hinterlegen:** Text einfügen oder Bild/Video/PDF hochladen – oder nur ein Thema angeben.
2. **Beschreiben & anpassen:** Ziel in einem Satz beschreiben; Sprache und Alter wählen; Format selbst wählen oder „KI wählt das Format"; über 30 Formate (Karteikarten, Schritt für Schritt, Zuordnungsaufgabe, Fragen & Musterlösung, Lückentext, Multiple Choice, Kreuzworträtsel, Infografik, Aussagen, Bingo, Broschüre, Essay, Flashcards, Mindmap, Operatoren, Zusammenfassung, Wortsuchrätsel, WhatsApp-Chat, interaktives Video …); Anzahl der Aufgaben und Schwierigkeit.
3. **Material erhalten:** interaktiv im Browser, per Link teilen, als PDF exportieren; Überprüfung und Lösungsansicht.

### 1.3 Unterrichtsentwurf / Unterrichtsreihe

- Eckdaten: Thema, Klassenstufe, Fach, Dauer; optional Lehrplan oder Material hochladen.
- Fokus: Art des Einstiegs (problemorientiert/informativ), Schwerpunkt (Gruppenarbeit/Präsentation), PBL-Modus.
- Ergebnis: kompetenzorientierte Lernziele, tabellarischer Verlauf mit Phase/Zeit/Inhalt/Aktionsform, Materialien je Phase, Voll editierbar, DOCX/Teilen.
- Unterrichtsreihe: Thema, Sprache, Anzahl der Unterrichtsstunden, Kompetenzen; Reihenfolge der Stunden änderbar.
- Scaffolding: sprachliche Lernziele, sukzessiver Abbau von Unterstützung, Phasen.

### 1.4 Quiz-Besonderheiten (öffentlicher Blog)

- Genau eine richtige und mehrere plausible falsche Antworten pro Multiple-Choice-Frage.
- Falsche Antworten müssen eindeutig falsch sein; ähnlich lange Antwortoptionen; keine doppelten Verneinungen.
- Nach der Auswahl kurze Begründung/Rückmeldung; „Mit KI überarbeiten" für einzelne Fragen.
- Export als Tabellendatei für Kahoot/H5P.

### 1.5 Zugang und Preise (korrektierte öffentliche Recherche)

- Die öffentlich beschriebenen Erstellungsabläufe sind als Produktbeschreibung zugänglich. Die tatsächliche Generierung, `/chat`, gespeicherte Inhalte, Ordner, Kurse, Profil/Einstellungen und MCP erfordern ein Konto. Für die Recherche wurden keine Zugangsdaten verwendet und keine Generierung mit fremden Konten ausgeführt.
- Öffentlich sichtbare Preisangaben: **Free** mit 5 Übungen, 3 Arbeitsblättern und 2 Unterrichtsplänen pro Monat; **Starter** 5 €/Monat bei jährlicher Abrechnung; **Pro** 10 €/Monat bei jährlicher Abrechnung. Zu den paid features zählen Musterlösungen, Gamification, Premium-Vorlagen und der vollständige Infografik-Katalog.
- Diese Grenzen sind ausdrücklich nicht als ExamVision-AI-Funktionsversprechen zu verstehen. ExamVision AI verwendet weder diese Konten noch diese Dienste und bildet die Abläufe lokal und eigenständig nach.

## 2. Vollständige Funktionsliste der Umsetzung in ExamVision AI

Die Umsetzung heißt **„Prüfung erstellen"** und ersetzt die bisherige einfache Create-Seite. Sie ist in fünf Schritte gegliedert und vollständig mit der bestehenden Speicherung, den Materialien, dem Timer, der Korrektur, „Meine Arbeiten" und dem PDF-Export verbunden.

### Schritt 1 – Rahmen & Inhalt

- [x] Sprache pro Erstellung (DE/EN/AR/FR/ES), unabhängig von der App-Sprache
- [x] Klassenstufe / Alter (6–7, 8–9, 10, 11–12, 13 usw.)
- [x] Fach (freie Eingabe + Vorschläge aus vorhandenen Arbeiten)
- [x] Thema oder Leitfrage
- [x] Titel der Arbeit
- [x] Ein-Satz-Beschreibung des Ziels („Beschreiben & anpassen")
- [x] Inhaltsquelle: vorhandene Materialien, eigener Text, nur Thema, oder Kombination
- [x] Materialien einzeln auswählen (wie „An meine Inhalte anpassen")
- [x] Text direkt einfügen und als Quelle verwenden
- [x] Lehrplan-/Vorlagen Dokument als Stilvorlage auswählen
- [x] Automatische Formaterkennung aus der Beschreibung („Format wählt sich selbst") oder manuell
- [x] Didaktische Vorlagen mit Filter nach Fach, Art und Niveau (eigene Katalogeinträge)
- [x] Upload direkter im Schritt möglich (PDF/Bild, rollengerecht)

### Schritt 2 – Lernziele & Aufbau

- [x] Mehrere Lernziele hinzufügen, bearbeiten, entfernen
- [x] Lernziele aus dem ausgewählten Material ableiten (lokal)
- [x] Aufgabenblöcke hinzufügen, entfernen, nach oben/unten verschieben (Drag-&-Drop-Äquivalent)
- [x] Pro Block: Format aus 43 Formaten, Anzahl Aufgaben, Punkte pro Aufgabe, Anweisung, Operator, Anforderungsbereich
- [x] Formate: offene Frage, Erklärung, Beschreibung, Vergleich, Begründung, Analyse, Bewertung, Transfer, Lückentext, Multiple Choice, Wahr/Falsch, Zuordnung, Karteikarte, Schritt für Schritt, Begriffserklärung, Sachtext, Zusammenfassung, Operatoren-Aufgabe, Anforderungsbereich I/II/III, Textanalyse, Quellenarbeit, Rechenaufgabe, Grafikinterpretation, Tabellenaufgabe, Fallbeispiel, Dilemma-Diskussion, Essay, Diktat, Vokabeln, Aussagen, Wortsuchrätsel, Kreuzworträtsel, Mindmap, Infografik, Bingo, Diskussion, Beobachtung, Experiment, Rollenspiel, Chat, Zeitstrahl
- [x] Multiple Choice: genau eine richtige und drei plausible falsche Antworten, Optionen editierbar
- [x] Punkteverteilung und Gesamtpunkte (automatisch aus Blöcken)
- [x] Teelpunkte erlauben / nur volle Punkte
- [x] Musterlösung / Erwartungshorizont pro Aufgabe, ein- oder ausblendbar
- [x] Differenzierung: Grundlage, Regelunterricht, Förderung, Kombination
- [x] Sprachliche Unterstützung (Scaffolding) ein-/ausschaltbar
- [x] Prüfungsart: Klassenarbeit mit Timer, Test ohne Timer, Übung, Arbeitsblatt
- [x] Dauer in Minuten (nur bei Timer-Modus)
- [x] Kopfzeile: Name, Klasse, Datum (editierbar)
- [x] Notenschlüssel aus Einstellungen übernommen und im PDF ausgewiesen

### Schritt 3 – Entwurf prüfen & bearbeiten

- [x] Vorschau aller Aufgaben mit Blockzuordnung, Format, Punkten und Quelle
- [x] Aufgaben online ändern: Prompt, Lösung, Punkte, Optionen, Format, Operator, Anforderungsbereich
- [x] Einzelne Aufgabe löschen oder neue eigene Aufgabe hinzufügen
- [x] Blockreihenfolge und Aufgabenreihenfolge ändern
- [x] Lernziele in der Vorschau anzeigen
- [x] Validierung: mindestens eine Aufgabe, Punkte > 0, Quelle vorhanden
- [x] Quellenhinweis: jede Aufgabe nennt Dokument/Thema

### Schritt 4 – KI-Vorschau (optional)

- [x] Bestehender optionaler KI-Connector mit Vorschau und ausdrücklicher Zustimmung pro Anfrage
- [x] Übernahme der KI-Vorschläge als Aufgaben in den Entwurf
- [x] Keine API-Schlüssel im Repository, HTTPS und Consentpflicht unverändert

### Schritt 5 – Ergebnis

- [x] Speichern als „Arbeit" in „Meine Arbeiten" (mit Erstellungsdatum, Fach, Punkten)
- [x] Direkt starten: Klassenarbeit mit Timer, Test/Übung ohne Timer
- [x] Bearbeiten gespeicherter Arbeiten über „Meine Arbeiten" → „Bearbeiten" (Rückführung in den Assistenten)
- [x] PDF Schülerfassung, Musterlösung, Korrekturbericht (deutsche Sonderzeichen, A4, Seitenzahlen, Bilder, RTL)
- [x] Nativer Teilen-/Öffnen-Dialog auf Android, Browser-Download im Web
- [x] Dateinamen `Fach_Titel_TT-MM-JJJJ.pdf` inkl. Suffixe
- [x] Keine attrappenhaften Link-/Kurs-/Kahoot-Buttons: nicht offline umsetzbare Funktionen werden nicht vorgetäuscht

### 2.6 Studio – für alle sieben Artefaktarten

Der Bereich **Inhalte erstellen** erzeugt ausschließlich aus den ausgewählten, erkennbaren Textstellen des eigenen Materials. Es gibt sieben vollständig verbundene Artefaktarten:

- [x] **Unterrichtsentwurf**: vier Phasen mit Zeit, Inhalt, Aktionsform und Materialbezug
- [x] **Arbeitsblatt**: Aufgaben mit Anweisung, Punkten und optionalen Musterlösungen
- [x] **Übungsaufgaben**: Aufgaben mit sofortiger Rückmeldung und Quellenbezug
- [x] **Präsentation**: Folien mit Erklärungen, Anwendung, Zusammenfassung und Quelle
- [x] **Grafik**: Balken, Zeitstrahl, Vergleich, Ablauf und Infografik aus echten Materialdaten
- [x] **Unterrichtsreihe** (neu in 1.4.0): mehrere aufeinander aufgebaute Stunden mit Kompetenzen, Lernzielen, Dauer und Quellen; Reihenfolge der Stunden änderbar
- [x] **Scaffolding** (neu in 1.4.0): vier Phasen mit Fachziel, Sprachziel, Aufgabe, Unterstützung und nächstem Schritt; die Unterstützung nimmt phasenweise ab

Für alle sieben Arten gilt: Erstellen aus Material, bearbeiten im Preview, speichern am vorhandenen Artefakt, erneut öffnen und als PDF exportieren. Die Editors unterstützen das Ändern von Titeln und Inhalten sowie das Hinzufügen, Entfernen und Verschieben von Phasen, Aufgaben, Folien, Grafikelementen und Stunden.

### 2.7 Bearbeitung, Speicherung und Schutz vor leeren Ergebnissen

- [x] Materialien lassen sich direkt bearbeiten: Dateiname, erkannter Text und Rolle bleiben erhalten; die Änderung wird in allen Speicherzielen übernommen.
- [x] Die Speicherung kombiniert localStorage, IndexedDB und auf Android `profile.json`. Die Zusammenführung erfolgt nach `savedAt`; ältere Einträge werden nicht still gelöscht.
- [x] Artefakte werden beim Speichern aktualisiert statt als neue Kopie angelegt; „Meine Arbeiten" und die Studio-Liste bleiben synchron.
- [x] Zu kurze oder nicht erkennbare Materialien erzeugen kein leeres Arbeitsblatt, keine leere Präsentation und keine leere Grafik. Stattdessen erscheint eine klare Fehlermeldung; es wird kein leeres Artefakt gespeichert.
- [x] Der optionale KI-Connector bleibt HTTPS-only, consentpflichtig und zeigt eine Vorschau. Ohne eigenen Endpunkt bleibt die lokale Generierung unverändert nutzbar.
- [x] Alle neuen Workflow-Texte sind in Deutsch, Englisch, Arabisch, Französisch und Spanisch übersetzt; Arabisch wird auch im PDF korrekt RTL gesetzt.

## 3. Umsetzungsgrenzen (bewusst und dokumentiert)

- Kein Login, keine Cloud, keine externen KI-Dienste ohne ausdrücklich konfigurierten eigenen HTTPS-Endpunkt. Die lokale Generierung arbeitet deterministisch mit den hochgeladenen Unterlagen.
- Keine Video-Transkription, kein H5P-/Kahoot-Import, kein fobizz-Export, keine qr-code-basierte Klassenverwaltung: diese Funktionen setzen externe Dienste voraus und würden gegen „keine Attrappen" verstoßen.
- Keine DOCX-Ausgabe; PDF ist der druckfertige Export (bestehende Architektur). Die To-Teach-typischen Eingaben und Einstellungen sind vollständig vorhanden.
- Keine Übernahme von To-Teach-Vorlageninhalten, Logos oder Layouts. Alle Vorlagen und Formate sind eigene, quellenbasierte Umsetzungen.
