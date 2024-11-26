const veicoli = [
    {
        marca: "ABARTH",
        carburanti: {
            Benzina: [
                {
                    modello: "595 1.4 165 CV T-Jet",
                    cilindrata: 1368,
                    consumi: { min: 7.1, max: 7.3 },
                    emissioni: { min: 158, max: 163 }
                },
                {
                    modello: "595 1.4 180 CV T-Jet",
                    cilindrata: 1368,
                    consumi: { min: 7.2, max: 7.5 },
                    emissioni: { min: 162, max: 168 }
                }
            ],
            Elettrico: [
                {
                    modello: "500e 42 kWh",
                    cilindrata: 0,
                    consumi: { min: 17.1, max: 17.1 },
                    emissioni: { min: 0, max: 0 }
                }
            ]
        }
    },
    {
        marca: "AIWAYS",
        carburanti: {
            Elettrico: [
                {
                    modello: "AIWAYS U5 5p ber X-Cite",
                    cilindrata: 0,
                    consumi: { min: 0, max: 16.6 },
                    emissioni: { min: 0, max: 0 }
                },
                {
                    modello: "AIWAYS U5 5p ber X-Prime",
                    cilindrata: 0,
                    consumi: { min: 0, max: 17 },
                    emissioni: { min: 0, max: 0 }
                },
                {
                    modello: "AIWAYS U6 5p ber",
                    cilindrata: 0,
                    consumi: { min: 0, max: 16 },
                    emissioni: { min: 0, max: 0 }
                }
            ]
        }
    },
    {
        marca: "ALFA ROMEO",
        carburanti: {
            Benzina: [
                {
                    modello: "Stelvio 2.0 Turbo B 280 CV aut ",
                    cilindrata: 2000,
                    consumi: { min: 8.4, max: 8.9 },
                    emissioni: { min: 191, max: 202 }
                },
                {
                    modello: "Stelvio 2.9 V6 520 CV aut 4WD ",
                    cilindrata: 2900,
                    consumi: { min: 11.8, max: 11.8 },
                    emissioni: { min: 267, max: 267 }
                },
                {
                    modello: "Giulia 2.0 Turbo B 280 CV aut ",
                    cilindrata: 2000,
                    consumi: { min: 7.6, max: 8.1 },
                    emissioni: { min: 173, max: 183 }
                },
                {
                    modello: "Giulia 2.9 V6 510 CV aut ",
                    cilindrata: 2900,
                    consumi: { min: 10.0, max: 10.1 },
                    emissioni: { min: 228, max: 229 }
                }
            ],
            Gasolio: [
                {
                    modello: "Stelvio 2.2 Turbo D 160 CV aut ",
                    cilindrata: 2200,
                    consumi: { min: 5.7, max: 6.2 },
                    emissioni: { min: 150, max: 161 }
                },
                {
                    modello: "Stelvio 2.2 Turbo D 210 CV aut 4WD ",
                    cilindrata: 2200,
                    consumi: { min: 6.0, max: 6.4 },
                    emissioni: { min: 158, max: 169 }
                },
                {
                    modello: "Giulia 2.2 Turbo D 160 CV aut ",
                    cilindrata: 2200,
                    consumi: { min: 5.0, max: 5.3 },
                    emissioni: { min: 130, max: 139 }
                },
                {
                    modello: "Giulia 2.2 Turbo D 210 CV aut 4WD ",
                    cilindrata: 2200,
                    consumi: { min: 5.5, max: 5.7 },
                    emissioni: { min: 144, max: 149 }
                },
                {
                    modello: "Tonale 1.6 130 CV aut ",
                    cilindrata: 1600,
                    consumi: { min: 5.3, max: 5.8 },
                    emissioni: { min: 138, max: 153 }
                },
            ],
            IBRIDO_Benzina_Elettrico: [
                {
                    modello: "Tonale 1.5 Hybrid 130 CV aut ",
                    cilindrata: 1500,
                    consumi: { min: 5.5, max: 6.0 },
                    emissioni: { min: 125, max: 136 }
                },
                {
                    modello: "Giulia 2.9 V6 520 CV aut 4WD ",
                    cilindrata: 1500,
                    consumi: { min: 6.0, max: 6.2 },
                    emissioni: { min: 135, max: 140 }
                }
            ],
            IBRIDO_Benzina_Elettrico_PLUGIN: [
                {}
            ]
        }
    }
];

