import jsPDF from "jspdf";
function generatePDF(surveyData, questionnaireName, userData, totalScore, json) {

    return () => {
        const pdf = new jsPDF();
        const tableData = [];

        // Aggiungi immagine al PDF
        const image = new Image();
        image.src = '/img/logo.png';
        const logoX = (pdf.internal.pageSize.getWidth() - 32) / 2;
        pdf.addImage(image, 'JPEG', logoX, 10, 32, 32);

        // Impostazioni del titolo del PDF
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(16); // Aumenta la dimensione del font per il titolo
        pdf.setTextColor('#374151');
        pdf.text(`Report Questionario ${questionnaireName}`, pdf.internal.pageSize.getWidth() / 2, 60, { align: 'center' });

        // Aggiungi sottotitolo informazioni utente
        pdf.setFontSize(12); // Dimensione del font per il sottotitolo
        pdf.text('Informazioni Utente', pdf.internal.pageSize.getWidth() / 2, 80, { align: 'center' });

        pdf.setFont('Helvetica', 'normal');
        const userInfoYStart = 90; // Offset per l'inizio delle informazioni utente
        const userInfoYSpacing = 8; // Spaziatura verticale tra le informazioni utente
        const userInfoLines = [
            `Utente: ${userData.username || 'N/D'}`,
            `Azienda: ${userData.company_name || 'N/D'}`,
            `Email: ${userData.email || 'N/D'}`,
            `Telefono: ${userData.phone_number || 'N/D'}`,
            `Partita IVA: ${userData.p_iva || 'N/D'}`,
            `Codice Fiscale: ${userData.tax_code || 'N/D'}`,
            `Sede Legale: ${userData.legal_headquarter || 'N/D'}`,
        ];

        userInfoLines.forEach((line, index) => {
            pdf.text(line, pdf.internal.pageSize.getWidth() / 2, userInfoYStart + (index * userInfoYSpacing), { align: 'center' });
        });

        // Aggiungi il punteggio totale al PDF
        const totalScoreY = 150; // Usa la Y finale della tabella precedente se esiste
        // Imposta il colore del testo
        pdf.setTextColor(45, 112, 68); // Imposta il colore usando valori RGB (corrispondente a #2d7044)
        pdf.setFont('Helvetica', 'bold'); // Imposta il font in grassetto
        pdf.setFontSize(14); // Aumenta la dimensione del font per renderlo più evidente
        pdf.text(`Voto assegnato: ${totalScore}`, pdf.internal.pageSize.getWidth() / 2, totalScoreY, { align: 'center' });


        // Funzione per aggiungere righe alla tabella
        const addRowToTable = (question, answer) => {
            tableData.push([question, answer]);
        };

        // Elaborazione delle domande e delle risposte
        json.pages.forEach(page => {
            page.elements.forEach(element => {
                const questionTitle = element.title || '';
                const answer = surveyData[element.name]; // Supponendo che surveyData contenga le risposte

                switch (element.type) {
                    case 'radiogroup':
                        const selectedChoice = element.choices.find(choice => choice.value === answer);
                        addRowToTable(questionTitle, selectedChoice ? selectedChoice.text : '0');
                        break;

                    case 'multipletext':
                        const multipleTextAnswers = surveyData[element.name] || {};
                        if (element.items) {
                            element.items.forEach(item => {
                                const itemAnswer = multipleTextAnswers[item.name] || '0';
                                addRowToTable(`${questionTitle} - ${item.title}`, itemAnswer);
                            });
                        } else {
                            addRowToTable(questionTitle, '0');
                        }
                        break;

                    case 'matrixdynamic':
                        if (element.columns) { // Verifica se `element.columns` esiste
                            //console.log('Element columns:', element.columns); // Log delle colonne presenti nel `matrixdynamic`

                            const matrixAnswers = surveyData[element.name] || [];
                            matrixAnswers.forEach((row, index) => {
                                const rowText = `Riga ${index + 1}`;
                                Object.keys(row).forEach(column => {
                                    //console.log(`Column Name: ${column}`); // Log del nome della colonna
                                    //console.log('Element Columns:', element.columns); // Ripristina le colonne per confrontarle

                                    const columnTitle = element.columns.find(col => col.name === column)?.title || column;
                                    const cellAnswer = row[column] || '0';

                                    // Verifica il tipo della colonna
                                    const columnDef = element.columns.find(col => col.name === column);
                                    //console.log('Column Definition:', columnDef); // Log delle proprietà della colonna

                                    if (columnDef && columnDef.cellType === 'dropdown') {
                                        const choice = columnDef.choices.find(choice => choice.value === cellAnswer);
                                        const answerText = choice ? choice.text : '0';
                                        addRowToTable(`${questionTitle} (${rowText}) - ${columnTitle}`, answerText);
                                    } else {
                                        addRowToTable(`${questionTitle} (${rowText}) - ${columnTitle}`, cellAnswer);
                                    }
                                });
                            });
                        } else {
                            //console.warn('Elemento matrixdynamic senza colonne');
                        }
                        break;


                    case 'dropdown':
                        const dropdownChoice = element.choices.find(choice => choice.value === answer);
                        addRowToTable(questionTitle, dropdownChoice ? dropdownChoice.text : '0');
                        break;

                    default:
                    //console.warn(`Tipo di domanda non gestito: ${element.type}`);
                }
            });
        });

        // Aggiungi la tabella delle domande e risposte
        const startY = 160; // Usa la Y finale della tabella precedente se esiste
        pdf.autoTable({
            head: [['Domanda', 'Risposta']],
            body: tableData,
            theme: 'grid',
            startY: startY,
            styles: {
                fontSize: 10, // Font più piccolo per la tabella
                cellPadding: 2, // Spaziatura interna delle celle
            },
            headStyles: {
                fillColor: [240, 240, 240], // Sfondo grigio chiaro per l'intestazione
                textColor: '#000000', // Colore del testo dell'intestazione
                halign: 'center', // Allinea il testo al centro nell'intestazione
                fontStyle: 'bold', // Grassetto per l'intestazione
                lineWidth: 0.1, // Spessore del bordo
                lineColor: [200, 200, 200], // Colore del bordo grigio
            },
            columnStyles: {
                0: { cellWidth: 120 }, // Larghezza della colonna "Domanda"
                1: { cellWidth: 60, halign: 'center' }, // Larghezza della colonna "Risposta"
            },
        });


        // Salvataggio del PDF
        pdf.save(`Questionario-trasporti-${userData.username}-${new Date().getTime()}.pdf`);
    };
}

export default generatePDF;