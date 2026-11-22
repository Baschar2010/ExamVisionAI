# Datenschutzhinweise – ExamVision AI

ExamVision AI benötigt **kein Konto, kein Backend und keine API-Schlüssel**. Unterrichtstexte, Antworten, Arbeitsergebnisse, Chatverlauf und Lernfortschritt werden lokal im Browser-Speicher (IndexedDB, mit kleinem localStorage-Fallback) auf dem jeweiligen Gerät abgelegt. Über **Einstellungen → Alle Daten löschen** können die App-Daten entfernt werden; zusätzlich lassen sie sich über die Website-Daten des Browsers bzw. die App-Daten von Android löschen.

## Lokale Verarbeitung

- PDF-Dateien werden mit PDF.js lokal im Browser ausgelesen. Seiten ohne brauchbaren Textlayer werden gerastert und anschließend lokal per Tesseract.js-OCR nachgelesen; unleserliche Seiten werden markiert und nicht geraten.
- JPG- und PNG-Dateien werden ebenfalls lokal mit Tesseract.js verarbeitet. Beim **ersten** OCR-Lauf lädt die Bibliothek kostenlos JavaScript-/WASM-Dateien und Sprachdaten aus dem Tesseract.js-CDN. Dabei entsteht eine Netzwerkverbindung zu diesem CDN. **Bildinhalte werden nicht an einen Erkennungsserver übertragen.**
- Der **KI-Assistent** im Content-Studio ist eine lokale, belegbasierte Suche in deinen hochgeladenen Materialien. Er nennt die Textstellen als Quellen und formuliert keine neuen fachlichen Behauptungen. Ohne eigene Konfiguration sendet er nichts.
- Die automatische Antwortbewertung ist ein lokaler Abgleich mit Teilpunkten und Begründungen. Nicht sicher zuordenbare oder unleserliche Antworten werden nicht automatisch als richtig gewertet. Optional KI-Korrekturen sind gekennzeichnete Vorschläge, ersetzen aber nicht die lokale Bewertung.
- Die Oberfläche lädt **keine externen Schriften**. `DM Sans` und `Manrope` sind nur Namen in der CSS-Font-Liste; tatsächlich werden lokal verfügbare Fallbacks (`Segoe UI`, `system-ui`, `sans-serif`) verwendet. Es gibt keinen Google-Fonts- oder anderen Font-CDN-Aufruf.

## Optionaler KI-Connector

Der KI-Connector ist standardmäßig deaktiviert. Es werden nur dann Daten übertragen, wenn **alle** folgenden Bedingungen erfüllt sind:

1. In **Einstellungen → KI-Verbindung (optional)** wurden ein eigener **HTTPS**-Endpunkt und ein Modellname eingepflegt. Andere Protokolle werden abgewiesen.
2. Auf der Erstellungs- oder Auswertungsseite wurde **KI-Vorschau anzeigen** betätigt; die konkret zu übertragenden Auszüge werden vorher angezeigt.
3. Die ausdrückliche Zustimmung wurde für genau diese Anfrage aktiv gesetzt. Sie wird nicht dauerhaft gespeichert und nach der Anfrage zurückgesetzt.
4. Für Fragen werden nur markierte Textstellen aus den aktuellen Unterrichtsmaterialien übermittelt. Antworten werden auf Belege, Thema und Schema geprüft; bei Fehlern bleibt die lokale Erstellung aktiv.
5. Für eine KI-Korrektur werden nur Musterlösung und Antworttext der jeweiligen Aufgabe übermittelt. Das Ergebnis wird als Vorschlag gekennzeichnet; die lokale Bewertung bleibt bei Fehlern erhalten.

API-Schlüssel gehören ausschließlich in die Konfiguration des selbst betriebenen Servers und werden nie in der App gespeichert. Es ist kein kostenpflichtiger Dienst vorkonfiguriert.

## Keine automatische Synchronisierung

Es gibt **keinen Cloud-Sync und keine geräteübergreifende automatische Kopie**. Daten werden bei Bedarf über **Einstellungen → Daten exportieren** als JSON-Datei gespeichert und auf dem anderen Gerät über **Daten importieren** eingespielt. Der Import ersetzt die vorhandenen lokalen Daten nach Bestätigung vollständig.

Die Exportdatei (`format: examvision-ai-profile`, Version 1) enthält Dokumente, Prüfungen, Artefakte, Chatverlauf, Spracheinstellungen, OCR-Sprache, Notengrenzen, Lernzeit, Schwachthemen sowie optional den selbst konfigurierten KI-Endpunkt und Modellnamen. Sie enthält keine API-Schlüssel. Da sie deine Unterrichtsinhalte umfasst, sollte sie vertraulich behandelt und nicht öffentlich abgelegt werden. Die Datei wird nicht zusätzlich verschlüsselt.

## Reichweite

Die Android-App nutzt dieselbe Datenlogik in der Capacitor-WebView. Die Berechtigung `INTERNET` wird für den einmaligen OCR-CDN-Download und für einen ausdrücklich freigegebenen KI-Request benötigt; ohne diese Funktionen findet keine überflüssige Datenübertragung statt. Die App enthält keine Werbung und keine eigene Nutzungsanalyse.

Diese Hinweise beschreiben den technischen Stand der Anwendung und ersetzen keine rechtliche Prüfung vor einer öffentlichen Verteilung.
