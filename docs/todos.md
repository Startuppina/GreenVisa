# TODO list

## Carrello e trasporti
-  **Bugfix:** correggere la rimozione dei trasporti dal carrello: attualmente, se se ne rimuove uno, spariscono tutti e tre.
-  **Bugfix:** aggiungere il controllo dei campi prima di mostrare il messaggio di warning al submit dei trasporti.

## Upload contenuti e allegati
-  **Bugfix:** verificare e correggere il caricamento delle notizie quando non viene inserita un’immagine.
-  **Bugfix:** verificare e correggere il caricamento delle certificazioni quando non viene inserita un’immagine.

## OCR e gestione veicoli
-  **Miglioramento:** far sì che l’OCR, durante l’aggiunta di un veicolo, legga anche il nome del modello (es. `Fiat Punto`) e lo mostri come nome del veicolo nella lista.
- miglioramento aggiungere un altro step in cui l'utente deve fare azione tra il caricamento delle carte di circolazione e la chiamata della pipeline ocr sulle immagini caricate, con la possibilità di rimuovere una o piu immagini. Magari con anche una preview.


## Greenness e analisi veicoli
-  **Miglioramento:** suddividere la logica di calcolo della greenness per singolo veicolo, così l’utente può identificare i mezzi più problematici.

## Backend e architettura
-  **Miglioramento:** migliorare la struttura dati del database.
-  **Miglioramento:** separare il `main` e distribuire gli endpoint in file/moduli con responsabilità distinte.
-  **Miglioramento:** valutare l’introduzione di wrapper o middleware dedicati all’autenticazione.

## Chatbot
-  **Miglioramento:** gestire le FAQ con risposte automatiche senza usare API.


## Interfaccia utente
-  **Miglioramento:** spostare il carrello nella navbar sulla destra e usare l’icona standard.

## Account ed email
-  **Bugfix:** correggere il problema per cui non vengono inviate le email di verifica dopo la creazione dell’account.

## Questionari
- **Bugfix** spesso quando il campo è numerico c'è zero di default, ma quando ci clicchi per scrivere succede che ci sta scritto dentro "02", se pre esempio si è inserito 2.
-  **Bugfix** vedere se l'intended behaviour è che possono essere aggiunti edifici a sbafo senza pagarli o se si vuole usare il comportamento che puoi aggiungerne in base a quante certificazioni hai comprato.

## Bo
- bugfix togliere tag e codice quando l'admin aggiunge una certificazione, controllare prima che non servono a niente ma sembra che non servano ad un cazzo.