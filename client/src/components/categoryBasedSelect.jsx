import React from 'react';

function CategoryBasedSelect({ category, onSelectChange }) {
    // Definisci le opzioni per ogni categoria
    const options = {
        "Certificazione hotel": [
            { value: "default", label: "Scegli un'opzione" },
            { value: "1-24", label: "1-24 stanze" },
            { value: "25-49", label: "25-49 stanze" },
            { value: "50-99", label: "50-99 stanze" },
            { value: "100-499", label: "100-499 stanze" },
            //{ value: "201+", label: "201+ stanze" }
        ],
        "Certificazione spa e resorts": [
            { value: "default", label: "Scegli un'opzione" },
            { value: "1-20", label: "1-20 camere" },
            { value: "21-50", label: "21-50 camere" },
            { value: "51-100", label: "51-100 camere" },
            { value: "101-200", label: "101-200 camere" },
            { value: "201+", label: "201+ camere" }
        ],
        "Certificazione trasporti": [
            { value: "default", label: "Scegli un'opzione" },
            { value: "1-20", label: "1-20 veicoli" },
            { value: "21-50", label: "21-50 veicoli" },
            { value: "51-100", label: "51-100 veicoli" },
            { value: "101-200", label: "101-200 veicoli" },
            { value: "201+", label: "201+ veicoli" }
        ],
        "Certificazione industria": [
            { value: "default", label: "Scegli un'opzione" },
            { value: "1-10", label: "1-10 impianti" },
            { value: "11-50", label: "11-50 impianti" },
            { value: "51-100", label: "51-100 impianti" },
            { value: "101+", label: "101+ impianti" }
        ],
        "Certificazione store e retail": [
            { value: "default", label: "Scegli un'opzione" },
            { value: "1-10", label: "1-10 negozi" },
            { value: "11-50", label: "11-50 negozi" },
            { value: "51-100", label: "51-100 negozi" },
            { value: "101+", label: "101+ negozi" }
        ],
        "Certificazione bar e ristoranti": [
            { value: "default", label: "Scegli un'opzione" },
            { value: "1-49", label: "1-49 coperti" },
            { value: "50-99", label: "50-99 coperti" },
            { value: "100-199", label: "100-199 coperti" },
            { value: "200-299", label: "200-299 coperti" }
        ]
    };

    const getUnitLabel = (category) => {
        switch (category) {
            case "Certificazione hotel":
                return "stanze";
            case "Certificazione spa e resort":
                return "camere";
            case "Certificazione trasporti":
                return "veicoli";
            case "Certificazione industria":
                return "impianti";
            case "Certificazione store e retail":
                return "negozi";
            case "Certificazione bar e ristoranti":
                return "locali";
            default:
                return "";
        }
    };

    // Ottieni le opzioni per la categoria attuale
    const categoryOptions = options[category] || [];

    const handleSelectChange = (event) => {
        const selectedValue = event.target.value;
        onSelectChange(selectedValue);
    };

    return (
        <div>
            {category && (
                <div className="flex flex-row gap-5 items-center justify-center" style={{ justifyContent: 'space-between' }}>
                    <p className='font-bold'>{getUnitLabel(category)}</p> {/* Cambia l'etichetta in base alla categoria */}
                    <select className="bg-white w-[200px] rounded-lg h-[30px]" name={category} id={category} onChange={handleSelectChange}>
                        {categoryOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}

export default CategoryBasedSelect;
