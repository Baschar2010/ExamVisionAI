# Testbericht

Stand: 22.11.2026

## Erfolgreich verifiziert

- TypeScript-Prüfung und Vite-Produktionsbuild.
- PDF-Upload mit drei Seiten; 8 Textstellen aus allen Seiten erkannt.
- Getrennter Import einer alten Klassenarbeit als Stilvorlage.
- Bild-OCR auf einem erzeugten PNG; zwei Textstellen erkannt. Leeres PNG wurde als unleserlich markiert.
- Mehrere Bilddateien in einem Upload auswählen.
- Arbeit mit Vorlage erstellen; angezeigte Aufgaben bezogen ihre Lösungstextstellen aus den neuen Unterrichtsmaterialien.
- Antworten im Browser eingeben, abgeben, Punkte/Prozent/Note sehen und Lernfortschritt aktualisieren.
- Prüfungsmodus mit sichtbarem Countdown, Aufgabenwechsel und Abgabe.
- Prüfungs- und Lernübersicht-PDF exportieren. Der Beispiel-Export war eine lesbare A4-PDF-Datei.
- Arabische Oberfläche und RTL-Anordnung.
- Gespeicherte Arbeiten und Dokumente nach Neuladen der Production-Vorschau wiederherstellen.
- Antwortbogen-PDF importieren; Antwortdatei und zugehörige Arbeit in der Korrekturseite auswählbar.
- Android-Debug-APK gebaut, Paketkennung/Anwendungsname ausgelesen und APK-Signatur geprüft.
- Der finale Android-Build nach Hinzufügen des Antwortbogenmodus war erfolgreich; `apksigner verify` bestätigte die v2-Signatur.

## Nicht vollständig verifiziert

- Nach der abschließenden Implementierung wurde der Klick auf „Antwortbogen auswerten“ mit nummerierten Antworten nicht erneut im Browser durchgespielt.
- Handschriftliche Antworterkennung und unsichere OCR-Zuordnung in realen Fotos.
- Timer bis zum automatischen Ablauf bei null.
- Lange Arbeiten mit automatischem Seitenumbruch und abgeschnittenen Inhalten.
- Installation und Start auf echtem Android-Gerät; es war kein Gerät oder Emulator angeschlossen.
- Datenlöschdialog nicht ausgelöst, damit keine gespeicherten Testdaten versehentlich dauerhaft entfernt werden.

## Grenzen der Implementierung

- Kein generatives KI-Modell. Aufgaben sind belegtextbezogene lokale Vorlagen, keine fachliche KI-Generierung.
- Antwortbewertung ist ein einfacher Schlüsselwortabgleich. Das Ergebnis muss überprüft werden.
- Stilvorlage beeinflusst die Auswahl nach ungefähren Textlängen; Aufbau, Punkteverteilung und Schwierigkeitsgrad werden nicht zuverlässig modelliert.
- Der Schwierigkeitsregler verändert noch nicht die fachliche Tiefe.
- OCR von Handschrift und PDF-Scans ist nicht zuverlässig; ein leeres PDF-Textlayer erhält einen Hinweis, wird aber nicht automatisch in Seitenbilder umgewandelt.
- App-Texte sind in fünf Sprachen verfügbar; Aufgaben- und Korrekturformulierungen sind überwiegend deutsch.
- OCR-Software und Sprachmodelle werden bei Bedarf aus dem Tesseract-CDN geladen. Die Bilddatei wird dort nicht zur Erkennung hochgeladen.
