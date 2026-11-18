# PROGETTO: Web App per la gestione delle monetine durante i giochi natalizi

Agisci come un Senior Full-Stack Developer, UI/UX Designer e Creative Frontend Developer.

Il tuo obiettivo è progettare e sviluppare una web app moderna, intuitiva, divertente e responsive che permetta di sostituire le monetine fisiche utilizzate durante le tradizionali partite e i giochi natalizi con un sistema digitale di trasferimento di denaro tra partecipanti.

## 1. CONCEPT

La piattaforma permette di creare una stanza di gioco condivisa alla quale possono accedere amici e familiari tramite un codice o un link di invito.

Ogni partecipante entra nella stanza, inserisce il proprio nome e associa il proprio account PayPal tramite un metodo sicuro, senza condividere password o credenziali.

Durante il gioco, i partecipanti accumulano debiti e crediti virtuali, proprio come se stessero utilizzando monetine fisiche.

Al termine della partita, la piattaforma calcola automaticamente i saldi e propone le transazioni necessarie per regolare i conti tra i partecipanti.

## 2. FUNZIONALITÀ PRINCIPALI

### Creazione della stanza
- Creazione di una nuova stanza.
- Generazione automatica di un codice univoco.
- Link di invito condivisibile su WhatsApp.
- Possibilità di impostare un nome personalizzato alla partita.
- Visualizzazione dei partecipanti collegati in tempo reale.

### Gestione dei partecipanti
Ogni partecipante deve poter:
- Inserire il proprio nome o nickname.
- Associare il proprio PayPal.
- Visualizzare gli altri partecipanti.
- Visualizzare il proprio saldo durante la partita.
- Consultare lo storico dei movimenti.

### Gestione delle monetine virtuali
Durante la partita deve essere possibile:
- Selezionare un partecipante.
- Selezionare il destinatario delle monetine.
- Scegliere la quantità da trasferire.
- Confermare il movimento.
- Aggiornare immediatamente i saldi di entrambi i partecipanti.

Ogni movimento deve essere registrato nello storico della stanza.

### Chiusura della partita e pagamenti

Al termine del gioco, l'organizzatore può avviare la fase di chiusura.

Il sistema deve:
1. Bloccare temporaneamente i nuovi movimenti.
2. Calcolare il saldo netto di ogni partecipante.
3. Individuare chi deve pagare e chi deve ricevere.
4. Ottimizzare il numero di transazioni necessarie.
5. Mostrare una schermata riepilogativa con tutti i pagamenti proposti.
6. Richiedere l'approvazione dei partecipanti coinvolti.
7. Attivare le richieste di pagamento tramite PayPal solo dopo le approvazioni necessarie.

Nessuna transazione monetaria deve essere eseguita automaticamente senza autorizzazione esplicita.

Prevedere la possibilità di utilizzare link PayPal.Me o un'integrazione ufficiale PayPal, verificando le effettive possibilità tecniche delle API.

## 3. UX/UI: L'ELEMENTO DISTINTIVO

La caratteristica più importante della piattaforma è la simulazione del passaggio fisico della monetina.

Non voglio una classica interfaccia finanziaria o un semplice elenco di transazioni.

Voglio un'esperienza interattiva e giocosa.

### Animazione del passaggio della moneta

Quando un partecipante trasferisce una monetina a un altro:

- La moneta deve apparire sullo schermo.
- Deve poter essere trascinata verso l'avatar del destinatario.
- Durante il trascinamento deve simulare il movimento di una vera monetina.
- Al rilascio deve essere riprodotta un'animazione di passaggio.
- La moneta deve raggiungere visivamente il destinatario.
- Deve essere presente un feedback visivo e sonoro.
- Il saldo dei due partecipanti deve aggiornarsi con un'animazione.

L'interazione deve funzionare sia con mouse sia con touchscreen.

### Stile grafico

Creare un'interfaccia:
- Festiva, natalizia e giocosa.
- Moderna e curata nei dettagli.
- Con animazioni fluide e microinterazioni.
- Con avatar personalizzabili.
- Con monetine tridimensionali o dall'effetto realistico.
- Con colori caldi, verde natalizio, rosso e dettagli dorati.
- Con un'atmosfera che ricordi un gioco da tavolo natalizio.

Evitare un'estetica infantile: il prodotto deve essere divertente ma visivamente professionale.

## 4. SCHERMATE PRINCIPALI

Realizzare almeno queste schermate:

1. Landing page: presentazione del servizio e pulsanti per creare o unirsi a una stanza.
2. Creazione stanza: configurazione della partita.
3. Lobby: visualizzazione dei partecipanti e dei relativi avatar.
4. Tavolo di gioco: interfaccia principale per il trasferimento delle monetine.
5. Storico: cronologia dei movimenti.
6. Chiusura partita: riepilogo dei saldi e transazioni proposte.
7. Approvazione pagamenti: conferma individuale dei trasferimenti.
8. Risultato finale: riepilogo della partita e dei pagamenti completati.

## 5. REQUISITI TECNICI

- Web app responsive, ottimizzata soprattutto per smartphone.
- Architettura predisposta per più stanze simultanee.
- Aggiornamenti in tempo reale dei saldi e dei partecipanti.
- Database persistente.
- Autenticazione e gestione sicura delle sessioni.
- Validazione di ogni movimento.
- Protezione contro doppi pagamenti e doppie registrazioni.
- Sistema di autorizzazioni per organizzatori e partecipanti.
- Integrazione PayPal attraverso strumenti ufficiali e sicuri.

Puoi valutare tecnologie come React o Next.js, TypeScript, Tailwind CSS, Framer Motion e Supabase.

## 6. METODO DI SVILUPPO

Procedi per fasi:

1. Definisci architettura e flussi applicativi.
2. Progetta il sistema di design.
3. Sviluppa le schermate principali.
4. Implementa il sistema delle stanze e dei partecipanti.
5. Implementa le monetine virtuali e le animazioni drag & drop.
6. Implementa il calcolo dei saldi.
7. Implementa il flusso di approvazione e l'integrazione PayPal.
8. Testa l'applicazione su desktop e smartphone.

Prima di sviluppare, presenta una breve descrizione dell'architettura e delle scelte tecnologiche.

Non limitarti a creare un prototipo statico: realizza un prodotto funzionante, con interazioni reali, dati persistenti e un'esperienza utente coerente.

La priorità assoluta è rendere il trasferimento delle monetine un'esperienza visiva divertente, intuitiva e memorabile.