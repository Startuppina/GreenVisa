import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import ScrollToTop from "./components/scrollToTop";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import AutoTable from 'jspdf-autotable';
import { MutatingDots } from "react-loader-spinner";

/*const generatePDF = () => {
    const input = document.getElementById('table-to-pdf');
    html2canvas(input, { scale: 0.8 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); // Formato A4
        const imgWidth = 190; // Larghezza massima per PDF
        const pageHeight = pdf.internal.pageSize.height;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        // Aggiungi l'immagine alla prima pagina
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Aggiungi ulteriori pagine se necessario
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`report-edifici-${new Date().toISOString()}.pdf`);
    });
};*/

function ReportPage() {
    const [buildings, setBuildings] = useState([]);
    const [userData, setUserData] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const getEnergyUnit = (energySource) => {
        const energyOptions = [
            { label: "Gas Naturale (Metano)", unit: "Sm³" },
            { label: "GPL", unit: "mc" },
            { label: "Gasolio", unit: "mc" },
            { label: "Olio combustibile", unit: "t" },
            { label: "Pellet", unit: "t" },
            { label: "Cippato di legna", unit: "t" },
            { label: "Biogas", unit: "Sm³" },
            { label: "Elettricità", unit: "kWh" },
            { label: "Energia termica", unit: "kWh" },
        ];

        // Trova l'unità di misura corretta in base alla fonte energetica
        const energyOption = energyOptions.find(option => option.label === energySource);
        return energyOption ? energyOption.unit : ''; // Restituisce l'unità o una stringa vuota se non trovata
    };

    const generatePDF = () => {
        const doc = new jsPDF();

        // Aggiungi l'immagine del logo
        const img = new Image();
        img.src = '/img/logo.png';
        img.onload = () => {
            // Centra l'immagine del logo
            const logoX = (doc.internal.pageSize.getWidth() - 32) / 2;
            doc.addImage(img, 'PNG', logoX, 10, 32, 32); // Posiziona l'immagine al centro (32x32 dimensioni)

            // Aggiungi Titolo Report
            doc.setFontSize(16);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor('#374151');
            doc.text('Report Edifici', doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });


            // Aggiungi Sottotitolo Informazioni Utente
            doc.setFontSize(12);
            doc.setFont('Helvetica', 'bold');
            doc.text('Informazioni Utente', doc.internal.pageSize.getWidth() / 2, 70, { align: 'center' });

            doc.setFont('Helvetica', 'normal');
            // Centratura dei dati utente
            doc.text(`Utente: ${userData.username ? userData.username : 'N/D'}`, doc.internal.pageSize.getWidth() / 2, 80, { align: 'center' });
            doc.text(`Azienda: ${userData.company_name ? userData.company_name : 'N/D'}`, doc.internal.pageSize.getWidth() / 2, 87, { align: 'center' });
            doc.text(`Email: ${userData.email ? userData.email : 'N/D'}`, doc.internal.pageSize.getWidth() / 2, 94, { align: 'center' });
            doc.text(`Telefono: ${userData.phone_number ? userData.phone_number : 'N/D'}`, doc.internal.pageSize.getWidth() / 2, 101, { align: 'center' });
            doc.text(`Partita IVA: ${userData.p_iva ? userData.p_iva : 'N/D'}`, doc.internal.pageSize.getWidth() / 2, 108, { align: 'center' });
            doc.text(`Codice Fiscale: ${userData.tax_code ? userData.tax_code : 'N/D'}`, doc.internal.pageSize.getWidth() / 2, 115, { align: 'center' });
            doc.text(`Sede Legale: ${userData.legal_headquarter ? userData.legal_headquarter : 'N/D'}`, doc.internal.pageSize.getWidth() / 2, 122, { align: 'center' });

            // Aggiungi Titolo Risultati degli Edifici
            doc.setFont('Helvetica', 'bold');
            doc.text('Risultati degli Edifici', 14, 140, { align: 'left' });

            // Definizione delle tabelle dei risultati degli edifici
            const tableHead = [
                [
                    { content: 'Edificio', styles: { halign: 'left' } },
                    { content: 'Voto', styles: { halign: 'center' } },
                    { content: 'Emissioni CO2', styles: { halign: 'center' } },
                    { content: 'Emissioni CO2 per Superficie', styles: { halign: 'center' } },
                ],
            ];

            const tableBody = buildings.map((building) => [
                { content: building.building.name, styles: { halign: 'left' } },
                {
                    content: building.building.emissionmark !== null ? `${building.building.emissionmark > 10 ? '10+' : building.building.emissionmark}/10` : 'N/D',
                    styles: { halign: 'center', fontStyle: 'bold', textColor: '#16a34a' }, // Verde scuro, font semi-grassetto
                },
                {
                    content: building.building.emissionco2 !== null ? `${building.building.emissionco2} tonsCO2e` : 'N/D',
                    styles: { halign: 'center' },
                },
                {
                    content: building.building.areaemissionco2 !== null ? `${building.building.areaemissionco2} tonsCO2e m²` : 'N/D',
                    styles: { halign: 'center' },
                },
            ]);

            // Generazione della tabella con autoTable
            doc.autoTable({
                startY: 145, // Posizione iniziale sotto il titolo
                head: tableHead,
                body: tableBody,
                theme: 'grid', // Stile con bordi a griglia
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
                    lineColor: [200, 200, 200], // Colore del bordo nero
                },
                columnStyles: {
                    0: { cellWidth: 30 }, // Larghezza della colonna "Edificio"
                    1: { cellWidth: 40 }, // Larghezza della colonna "Voto"
                    2: { cellWidth: 52 }, // Larghezza della colonna "Emissioni CO2"
                    3: { cellWidth: 52 }, // Larghezza della colonna "Emissioni CO2 per Superficie"
                },
                didDrawPage: (data) => {
                    // Verifica se è necessario aggiungere una nuova pagina
                    if (data.cursor.y > doc.internal.pageSize.height - 30) {
                        doc.addPage();
                    }
                },
            });

            // Titolo Informazioni Generali
            doc.setFont('Helvetica', 'bold');
            doc.text('Informazioni generali', 14, doc.lastAutoTable.finalY + 10);

            buildings.forEach((buildingData, index) => {
                // Calcola la posizione dinamica per ogni edificio
                let currentY = doc.lastAutoTable.finalY + 18;
                if (currentY > doc.internal.pageSize.height - 50) {
                    doc.addPage();
                    currentY = 30; // Ricomincia dall'inizio della nuova pagina
                }
                doc.text(`${buildingData.building.name}`, 14, currentY);

                const buildingTableHead = [
                    [
                        { content: 'Parametro', styles: { halign: 'left', fillColor: [240, 240, 240], fontStyle: 'bold' } },
                        { content: 'Dato', styles: { halign: 'center', fillColor: [240, 240, 240], fontStyle: 'bold' } },
                    ],
                ];

                const buildingTableBody = [
                    [{ content: 'Locazione', styles: { halign: 'left' } }, { content: buildingData.building.location, styles: { halign: 'left' } }],
                    [{ content: 'Indirizzo', styles: { halign: 'left' } }, { content: buildingData.building.address, styles: { halign: 'left' } }],
                    [{ content: 'Destinazione d\'uso', styles: { halign: 'left' } }, { content: buildingData.building.usage, styles: { halign: 'left' } }],
                    [{ content: 'Anno di Costruzione', styles: { halign: 'left' } }, { content: buildingData.building.construction_year, styles: { halign: 'left' } }],
                    [{ content: 'Superficie', styles: { halign: 'left' } }, { content: `${buildingData.building.area} m²`, styles: { halign: 'left' } }],
                    [{ content: 'Ristrutturazioni', styles: { halign: 'left' } }, { content: buildingData.building.renovation, styles: { halign: 'left' } }],
                    [{ content: 'Distribuzione Calore', styles: { halign: 'left' } }, { content: buildingData.building.heat_distribution, styles: { halign: 'left' } }],
                    [{ content: 'Ventilazione', styles: { halign: 'left' } }, { content: buildingData.building.ventilation, styles: { halign: 'left' } }],
                    [{ content: 'Controllo Energetico', styles: { halign: 'left' } }, { content: buildingData.building.energy_control, styles: { halign: 'left' } }],
                    [{ content: 'Manutenzione', styles: { halign: 'left' } }, { content: buildingData.building.maintenance, styles: { halign: 'left' } }],
                    [{ content: 'Fornitura Elettrica', styles: { halign: 'left' } }, { content: buildingData.building.electricity_forniture, styles: { halign: 'left' } }],
                    [{ content: 'Recupero Acqua', styles: { halign: 'left' } }, { content: buildingData.building.water_recovery, styles: { halign: 'left' } }],
                    [{ content: 'Contatore Elettrico', styles: { halign: 'left' } }, { content: buildingData.building.electricity_meter, styles: { halign: 'left' } }],
                    [{ content: 'Dispositivi a Incandescenza', styles: { halign: 'left' } }, { content: `${buildingData.building.incandescent}`, styles: { halign: 'left' } }],
                    [{ content: 'Dispositivi a LED', styles: { halign: 'left' } }, { content: `${buildingData.building.led}`, styles: { halign: 'left' } }],
                    [{ content: 'Dispositivi a Scarica di Gas', styles: { halign: 'left' } }, { content: `${buildingData.building.gas_lamp}`, styles: { halign: 'left' } }],
                    [{ content: 'Analizzatori di rete controllo consumi elettrici', styles: { halign: 'left' } }, { content: `${buildingData.building.analyzers}`, styles: { halign: 'left' } }],
                    [{ content: 'Sistemi di controllo automatici dei corpi illuminanti', styles: { halign: 'left' } }, { content: buildingData.building.autolightingcontrolsystem, styles: { halign: 'left' } }],
                ];

                // Genera la tabella per l'edificio specifico
                doc.autoTable({
                    startY: currentY + 5,
                    head: buildingTableHead,
                    body: buildingTableBody,
                    theme: 'grid',
                    styles: {
                        fontSize: 10,
                        cellPadding: 2,
                    },
                    headStyles: {
                        fillColor: [240, 240, 240],
                        textColor: '#000000',
                        halign: 'center',
                        fontStyle: 'bold',
                        lineWidth: 0.1,
                        lineColor: [200, 200, 200],
                        cellWidth: 91, // Larghezza delle colonne

                    },
                });

                // Aggiorna la posizione per la prossima riga
                currentY = doc.lastAutoTable.finalY;


            });

            // Imposta il titolo per i consumi
            doc.setFont('Helvetica', 'bold');
            doc.text('Consumi annui', 14, doc.lastAutoTable.finalY + 10); // Posiziona dopo la tabella delle informazioni

            // Variabile per tenere traccia dell'altezza corrente
            let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 250; // Inizia a una nuova posizione in base all'ultima tabella

            // Genera la tabella dei consumi per ogni edificio
            buildings.forEach((building) => {
                // Titolo edificio
                doc.setFont('Helvetica', 'bold');
                currentY += 8; // Aggiungi un margine
                doc.text(`${building.building.name}`, 14, currentY);

                // Intestazione della tabella dei consumi
                const consumptionTableHead = [
                    [
                        { content: 'Fonte Energetica', styles: { halign: 'left', fillColor: [240, 240, 240], fontStyle: 'bold' } },
                        { content: 'Consumo', styles: { halign: 'center', fillColor: [240, 240, 240], fontStyle: 'bold' } },
                    ],
                ];

                const consumptionTableBody = building.consumptions.length > 0 ? (
                    building.consumptions.map((energySource) => {
                        return [
                            { content: energySource.energy_source, styles: { halign: 'left' } },
                            { content: energySource.consumption ? `${energySource.consumption} ${energySource.energy_source}` : 'N/D', styles: { halign: 'left' } },
                        ];
                    })
                ) : (
                    [
                        [
                            { content: 'Nessun consumo ancora caricato', colSpan: 2, styles: { halign: 'left' } }
                        ]
                    ]
                );


                // Generazione della tabella dei consumi energetici
                doc.autoTable({
                    startY: currentY + 5, // Posizionamento sotto il titolo dell'edificio
                    head: consumptionTableHead,
                    body: consumptionTableBody,
                    theme: 'grid', // Stile a griglia per coerenza
                    styles: {
                        fontSize: 10, // Font più piccolo per i dati della tabella
                        cellPadding: 2, // Spaziatura delle celle
                    },
                    headStyles: {
                        fillColor: [240, 240, 240], // Sfondo grigio per l'intestazione
                        textColor: '#000000', // Colore del testo nero
                        halign: 'center', // Allinea al centro l'intestazione
                        fontStyle: 'bold', // Grassetto per l'intestazione
                        lineWidth: 0.1, // Spessore del bordo
                        lineColor: [200, 200, 200], // Colore del bordo grigio
                        cellWidth: 91, // Larghezza delle colonne
                    },
                    columnStyles: {
                        0: { cellWidth: 70 }, // Colonna "Fonte Energetica" più larga
                        1: { cellWidth: 50 }, // Colonna "Consumo" più stretta
                    },
                });

                // Aggiorna la posizione corrente in base all'altezza finale della tabella
                currentY = doc.lastAutoTable.finalY;

            });

            // Imposta il font e il titolo per la sezione impianti
            doc.setFont('Helvetica', 'bold');
            currentY += 8; // Aggiungi margine prima del titolo
            doc.text('Impianti', 14, currentY);

            // Itera sugli edifici per generare le tabelle degli impianti
            buildings.forEach((building) => {
                // Titolo edificio
                doc.setFont('Helvetica', 'bold');
                currentY += 8; // Aggiungi un margine
                doc.text(`${building.building.name}`, 14, currentY);

                // Tabella 1: Dettagli impianto
                const plantTableHead = [
                    [
                        { content: 'Parametro', styles: { halign: 'left', fillColor: [240, 240, 240], fontStyle: 'bold' } },
                        { content: 'Valore', styles: { halign: 'center', fillColor: [240, 240, 240], fontStyle: 'bold' } },
                    ],
                ];

                const plantTableBody = building.plants.length > 0
                    ? building.plants.flatMap((plant) => [
                        [
                            { content: 'Descrizione', styles: { halign: 'left' } },
                            { content: plant.description || 'N/D', styles: { halign: 'left' } },
                        ],
                        [
                            { content: 'Tipo di Impianto', styles: { halign: 'left' } },
                            { content: plant.plant_type || 'N/D', styles: { halign: 'left' } },
                        ],
                        [
                            { content: 'Tipo di Servizio', styles: { halign: 'left' } },
                            { content: plant.service_type || 'N/D', styles: { halign: 'left' } },
                        ],
                        [
                            { content: 'Tipo di Generatore', styles: { halign: 'left' } },
                            { content: plant.generator_type || 'N/D', styles: { halign: 'left' } },
                        ],
                        [
                            { content: 'Fonte utilizzata', styles: { halign: 'left' } },
                            { content: plant.fuel_type || 'N/D', styles: { halign: 'left' } },
                        ],
                        [
                            {
                                content: 'Descrizione del Generatore (se altro)',
                                styles: { halign: 'left' }
                            },
                            { content: plant.generator_description || 'N/D', styles: { halign: 'left' } },
                        ],
                        // Riga extra per creare l'effetto di un bordo inferiore spesso
                        [
                            { content: '', styles: { border: { bottom: { style: 'solid', width: 2 } } } }, // Riga per il bordo
                            { content: '', styles: { halign: 'center' } },
                        ],
                    ])
                    : [[
                        { content: 'Nessun impianto ancora caricato', styles: { halign: 'left', colSpan: 2 } },
                        { content: '', styles: { halign: 'center' } }
                    ]];



                // Generazione della tabella dei dettagli impianto
                doc.autoTable({
                    startY: currentY + 5, // Posizionamento sotto il titolo dell'edificio
                    head: plantTableHead,
                    body: plantTableBody,
                    theme: 'grid',
                    styles: {
                        fontSize: 10,
                        cellPadding: 2,
                    },
                    headStyles: {
                        fillColor: [240, 240, 240],
                        textColor: '#000000',
                        halign: 'center',
                        fontStyle: 'bold',
                        lineWidth: 0.1,
                        lineColor: [200, 200, 200],
                        cellWidth: 91, // Larghezza delle colonne
                    },
                });

                // Aggiorna la posizione Y per il prossimo edificio
                currentY = doc.lastAutoTable.finalY + 10; // Posizionamento per il prossimo edificio, con margine extra


                // Aggiorna la posizione corrente
                currentY = doc.lastAutoTable.finalY;

                // Tabella 2: Dettagli solari e fotovoltaici
                const solarTableHead = [
                    [
                        { content: 'Parametro', styles: { halign: 'left', fillColor: [240, 240, 240], fontStyle: 'bold' } },
                        { content: 'Valore', styles: { halign: 'center', fillColor: [240, 240, 240], fontStyle: 'bold' } },
                    ],
                ];

                const solarTableBody = [
                    [{ content: 'Impianto Solare Termico (quantità totale installata)', styles: { halign: 'left' } },
                    { content: building.solaData.totalInstalledArea ? `${building.solaData.totalInstalledArea} m²` : 'N/D', styles: { halign: 'left' } }],
                    [{ content: 'Impianto Fotovoltaico (potenza totale)', styles: { halign: 'left' } },
                    { content: building.photoData.totalPower ? `${building.photoData.totalPower} kW` : 'N/D', styles: { halign: 'left' } }],
                ];

                // Generazione della tabella dei dettagli solari
                doc.autoTable({
                    startY: currentY + 10, // Posizionamento sotto il titolo dell'edificio
                    head: solarTableHead,
                    body: solarTableBody,
                    theme: 'grid',
                    styles: {
                        fontSize: 10,
                        cellPadding: 2,
                    },
                    headStyles: {
                        fillColor: [240, 240, 240],
                        textColor: '#000000',
                        halign: 'center',
                        fontStyle: 'bold',
                        lineWidth: 0.1,
                        lineColor: [200, 200, 200],
                        cellWidth: 91, // Larghezza delle colonne

                    },
                });

                // Aggiorna la posizione corrente
                currentY = doc.lastAutoTable.finalY;

                // Aggiungi nuova pagina se necessario
                if (currentY > doc.internal.pageSize.height - 30) {
                    doc.addPage();
                    currentY = 20; // Resetta l'altezza corrente all'inizio della nuova pagina
                }
            });


            // Salva il PDF
            doc.save(`report-edifici-${new Date().toISOString()}.pdf`);
            setIsLoading(false);
        };
    };

    useEffect(() => {
        const fetchBuildings = async () => {
            try {
                const response = await axios.get(`/api/fetch-report-data`, {
                    withCredentials: true
                });
                if (response.status === 200) {
                    setBuildings(response.data.buildings);
                    setUserData(response.data.user);
                }
            } catch (error) {
                console.log(error);
            }
        };
        fetchBuildings();
    }, []);

    return (
        <>
            <Navbar />
            <ScrollToTop />
            <div className="flex justify-center">
                {isLoading ? (
                    <div className="flex justify-center items-center mt-5">
                        <MutatingDots
                            height="100"
                            width="100"
                            color="#2d7044"
                            secondaryColor='#2d7044'
                            radius='12.5'
                            ariaLabel="mutating-dots-loading"
                            visible={true}
                        />
                    </div>
                ) : (
                    <button onClick={() => {
                        setIsLoading(true);
                        setTimeout(() => {
                            generatePDF();
                        }, 3000);
                    }}
                        className="mb-4 p-2 bg-blue-500 border-2 border-blue-500 rounded-lg text-white hover:bg-white hover:text-blue-500 transition-color duration-300 ease-in-out mt-10">
                        Scarica PDF
                    </button>
                )}
            </div>
            <div id="table-to-pdf" className="container mx-auto bg-white p-20 mt-2 mb-10 text-2xl">
                <div className="flex justify-center">
                    <img src="/img/logo.png" alt="Logo" className="w-32 h-32 mb-6" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Report Edifici</h1>

                <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">Informazioni Utente</h2>
                <div className="mb-4 flex flex-col items-center justify-center">
                    <p className="text-gray-700">Utente: {userData.username}</p>
                    <p className="text-gray-700">Azienda: {userData.company_name}</p>
                    <p className="text-gray-700">Email: {userData.email}</p>
                    <p className="text-gray-700">Telefono: {userData.phone_number ? userData.phone_number : 'N/D'}</p>
                    <p className="text-gray-700">Partita IVA: {userData.p_iva ? userData.p_iva : 'N/D'}</p>
                    <p className="text-gray-700">Codice Fiscale: {userData.tax_code ? userData.tax_code : 'N/D'}</p>
                    <p className="text-gray-700">Sede Legale: {userData.legal_headquarter ? userData.legal_headquarter : 'N/D'}</p>
                </div>

                <h2 className="text-2l font-semibold text-gray-700 mb-4">Risultati degli Edifici</h2>
                <table className="min-w-full bg-white border border-gray-200 mb-6 overflow-x-auto table-auto">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="py-2 px-4 border-2 text-left">Edificio</th>
                            <th className="py-2 px-4 border-2 text-center">Voto</th>
                            <th className="py-2 px-4 border-2 text-center">Emissioni CO2</th>
                            <th className="py-2 px-4 border-2 text-center">Emissioni CO2 per Superficie</th>
                        </tr>
                    </thead>
                    <tbody>
                        {buildings.map((building, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-2">{building.building.name}</td>
                                <td className="py-2 px-4  border-2 text-green-600 font-semibold text-center">
                                    {building.building.emissionmark !== null ? `${building.building.emissionmark > 10 ? '10+' : building.building.emissionmark}/10` : 'N/D'}
                                </td>
                                <td className="py-2 px-4 border-2 text-center">
                                    {building.building.areaemissionco2 !== null
                                        ? (
                                            <>
                                                {building.building.emissionco2} tons CO<sub>2</sub>e
                                            </>
                                        )
                                        : 'N/D'}                                </td>
                                <td className="py-2 px-4 border-2 text-center">
                                    {building.building.areaemissionco2 !== null
                                        ? (
                                            <>
                                                {building.building.areaemissionco2} tons CO<sub>2</sub>e/m²
                                            </>
                                        )
                                        : 'N/D'}
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>


                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Informazioni Generali</h2>

                {buildings.map((buildingData) => (
                    <div key={buildingData.building.id} className="mb-6">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">{buildingData.building.name}</h3>
                        <table className="min-w-full bg-white border border-gray-200 mb-4 overflow-x-auto">
                            <thead>
                                <tr className="p-2 bg-gray-100">
                                    <th className="py-2 px-4 border-2 text-left">Parametro</th>
                                    <th className="py-2 px-4 border-2">Dato</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Locazione</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.location}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Indirizzo</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.address}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Destinazione d'uso</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.usage}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Anno di Costruzione</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.construction_year}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Superficie</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.area} m²</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Ristrutturazioni</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.renovation}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Distribuzione Calore</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.heat_distribution}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Ventilazione</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.ventilation}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Controllo Energetico</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.energy_control}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Manutenzione</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.maintenance}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Fornitura Elettrica</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.electricity_forniture}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Recupero Acqua</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.water_recovery}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Contatore Elettrico</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.electricity_meter}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Dispositivi a Incandescenza</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.incandescent}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Dispositivi a LED</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.led}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Dispositivi a Scarica di Gas</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.gas_lamp}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Analizzatori di rete controlo consumi elettrici</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.analyzers}</td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Sistema di Controllo automatici dei corpi illuminanti</td>
                                    <td className="py-2 px-4 border-2">{buildingData.building.autolightingcontrolsystem}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ))}


                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Consumi Annuali</h2>

                {buildings.map((building) => (
                    <div key={building.building.id} className="mb-6">
                        <h3 className="text-2lg font-semibold text-gray-800 mb-2">{building.building.name}</h3>
                        <table className="min-w-full bg-white border border-gray-200 mb-4 overflow-x-auto">
                            <thead>
                                <tr className="p-2 bg-gray-100">
                                    <th className="py-2 px-4 border-2 text-left">Fonte Energetica</th>
                                    <th className="py-2 px-4 border-2">Consumo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Itera su tutte le fonti energetiche */}
                                {building.consumptions.length > 0 ? (
                                    building.consumptions.map((energySource, index) => (
                                        // Trova il consumo associato alla fonte energetica corrente
                                        <tr key={index}>
                                            {/* Prima colonna: Fonte Energetica */}
                                            <td className="py-2 px-4 border-2">{energySource.energy_source}</td>
                                            {/* Colonna successiva: Consumo per il singolo edificio */}
                                            <td className="py-2 px-4 border-2">
                                                {energySource ? `${energySource.consumption} ${getEnergyUnit(energySource.energy_source)}` : 'N/D'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="p-2">
                                        <td className="py-2 px-4 border-2" colSpan={2}>Nessun consumo ancora caricato</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ))}


                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Impianti</h2>
                {buildings.map((building) => (
                    <div key={building.building.id} className="mb-8">
                        <h2 className="text-2lg font-semibold text-gray-800 mb-2">{building.building.name}</h2>

                        {/* Tabella 1: Dettagli impianto */}
                        <table className="min-w-full bg-white border border-gray-200 mb-6 overflow-x-auto">
                            <thead>
                                <tr className="p-2 bg-gray-100">
                                    <th className="py-2 px-4 border-2 text-left">Parametro</th>
                                    <th className="py-2 px-4 border-2">Valore</th>
                                </tr>
                            </thead>
                            <tbody>
                                {building.plants.length > 0 ? (
                                    building.plants.map((plant, index) => (
                                        <React.Fragment key={index}>
                                            <tr className="p-2">
                                                <td className="py-2 px-4 border-2">Descrizione</td>
                                                <td className="py-2 px-4 border-2">{plant.description || 'N/D'}</td>
                                            </tr>
                                            <tr className="p-2">
                                                <td className="py-2 px-4 border-2">Tipo di Impianto</td>
                                                <td className="py-2 px-4 border-2">{plant.type || 'N/D'}</td>
                                            </tr>
                                            <tr className="p-2">
                                                <td className="py-2 px-4 border-2">Tipo di Servizio</td>
                                                <td className="py-2 px-4 border-2">{plant.service_type || 'N/D'}</td>
                                            </tr>
                                            <tr className="p-2">
                                                <td className="py-2 px-4 border-2">Tipo di Generatore</td>
                                                <td className="py-2 px-4 border-2">{plant.generator_type || 'N/D'}</td>
                                            </tr>
                                            <tr className="p-2">
                                                <td className="py-2 px-4 border-2">Descrizione del Generatore (se altro)</td>
                                                <td className="py-2 px-4 border-2">{plant.generator_description || 'N/D'}</td>
                                            </tr>
                                            <tr className="border-2-1 ">
                                                <td className="py-2 px-4 border-2">Fonte utilizzata</td>
                                                <td className="py-2 px-4 border-2">{plant.fuel_type || 'N/D'}</td>
                                            </tr>
                                            <tr className="border-2-1 ">
                                                <td className="py-6 px-4 border-2"></td>
                                                <td className="py-6 px-4 border-2"></td>
                                            </tr>
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <tr className="p-2">
                                        <td className="py-2 px-4 border-2" colSpan={2}>Nessun impianto ancora caricato</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Tabella 2: Dettagli solari e fotovoltaici */}
                        <table className="min-w-full bg-white border border-gray-200 mb-6">
                            <thead>
                                <tr className="p-2 bg-gray-100">
                                    <th className="py-2 px-4 border-2 text-left">Parametro</th>
                                    <th className="py-2 px-4 border-2">Valore</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Impianto Solare Termico (quantità totale installata)</td>
                                    <td className="py-2 px-4 border-2">{building.solaData.totalInstalledArea ? `${building.solaData.totalInstalledArea} m²` : 'N/D'} </td>
                                </tr>
                                <tr className="p-2">
                                    <td className="py-2 px-4 border-2">Impianto Fotovoltaico (potenza totale)</td>
                                    <td className="py-2 px-4 border-2">{building.photoData.totalPower ? `${building.photoData.totalPower} kW` : 'N/D'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ))}


            </div >
            <Footer />
        </>
    )
}

/*INSERIRE ANCHE REPORT DOMANDE */

export default ReportPage