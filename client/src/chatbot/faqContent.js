export const FAQ_CONTENT = {
  transport: [
    {
      key: 'targa',
      label: 'Dove trovo il numero di targa?',
      answer: 'Il numero di targa si trova sulla carta di circolazione del veicolo. Inseriscilo esattamente come riportato nel documento, senza modifiche.',
    },
    {
      key: 'euro',
      label: 'Cosa significa classe Euro?',
      answer: 'La classe Euro indica la normativa sulle emissioni a cui il veicolo e conforme. La trovi sulla carta di circolazione alla voce V.9.',
    },
    {
      key: 'documenti_veicoli',
      label: 'Quali documenti servono per i veicoli?',
      answer: 'Il documento principale e la carta di circolazione. Da li puoi ricavare targa, categoria veicolo, tipo di carburante, potenza e classe Euro.',
    },
    {
      key: 'carburante',
      label: 'Come inserisco i dati del carburante?',
      answer: 'Inserisci il consumo annuo totale del carburante usando le quantita fisiche corrette: litri per benzina o gasolio, kg per il metano, kWh per i veicoli elettrici. Puoi recuperare il dato da fatture di rifornimento o sistemi di gestione flotta.',
    },
  ],
  buildings: [
    {
      key: 'consumi',
      label: 'Dove trovo i dati dei consumi energetici?',
      answer: 'I consumi si trovano sulle bollette di energia elettrica e gas. Somma i valori di tutte le bollette dell\'anno di riferimento. Molti fornitori mettono a disposizione anche un riepilogo annuale nel portale online.',
    },
    {
      key: 'ape',
      label: "Cos'e un attestato APE?",
      answer: 'L\'Attestato di Prestazione Energetica e il documento che classifica l\'efficienza energetica dell\'edificio, da A4 a G. La classe energetica e riportata nella prima pagina dell\'APE.',
    },
    {
      key: 'impianti',
      label: 'Quali informazioni servono sugli impianti?',
      answer: 'Per ogni impianto servono almeno tipo, potenza nominale in kW e anno di installazione. Per gli impianti di climatizzazione possono servire anche tipo di gas refrigerante e quantita di carica.',
    },
    {
      key: 'bollette',
      label: 'Come inserisco i dati delle bollette?',
      answer: 'Dalle bollette devi estrarre i consumi, non gli importi in euro. Inserisci i kWh per l\'elettricita, gli Smc per il gas naturale e, se presente, i litri di gasolio per riscaldamento, sommando i consumi dell\'anno di riferimento.',
    },
  ],
  spa: [
    {
      key: 'raccolta_diff',
      label: 'Come gestisco le domande sulla raccolta differenziata?',
      answer: 'Se la struttura non effettua regolarmente la raccolta differenziata, la domanda sul frazionamento aggiuntivo non va compilata. Se invece la raccolta differenziata e attiva, indica se esiste un\'ulteriore separazione per materiali specifici.',
    },
    {
      key: 'elettrodomestici',
      label: 'Come compilo le domande su lavastoviglie e lavatrici?',
      answer: 'Compila queste domande solo se la struttura dispone davvero di lavastoviglie o lavatrici. Le domande servono a verificare in dettaglio la classe energetica di queste categorie specifiche.',
    },
    {
      key: 'ristorazione',
      label: 'Quando devo compilare le domande su bar e ristorazione?',
      answer: 'Le domande su bar e ristorazione sono applicabili solo se la struttura offre effettivamente questi servizi. Se il servizio non esiste, non vanno compilate.',
    },
    {
      key: 'dispenser',
      label: 'Quando la domanda sulle cabine e sui dispenser e applicabile?',
      answer: 'La domanda sulle cabine e applicabile solo se la struttura dispone di cabine. Per i dispenser e i dosatori, rispondi in base alle pratiche ambientali realmente adottate dalla struttura.',
    },
  ],
};

export function getFaqs(questionnaireType) {
  return FAQ_CONTENT[questionnaireType] || FAQ_CONTENT.transport;
}

export function getFaqAnswer(questionnaireType, faqKey) {
  return getFaqs(questionnaireType).find(faq => faq.key === faqKey)?.answer || null;
}
