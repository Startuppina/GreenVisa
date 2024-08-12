import React from 'react';

const PassInfo = ({ onClose }) => {
    return (
        <div className='fixed inset-0 flex items-center justify-center z-50'>
            <div className='relative p-4 bg-white rounded-lg shadow-lg w-[90%] max-w-md border border-gray-300'>
                <button
                    className='absolute top-2 right-2 text-gray-600 hover:text-gray-900'
                    onClick={onClose}
                    aria-label="Close"
                >
                    &#10005;
                </button>
                <h3 className='text-xl font-semibold mb-2'>Requisiti della Password</h3>
                <ul className='list-disc pl-5 text-sm'>
                    <li>La password deve contenere almeno 8 caratteri.</li>
                    <li>Deve includere almeno una lettera maiuscola.</li>
                    <li>Deve contenere almeno una lettera minuscola.</li>
                    <li>Deve avere almeno un numero.</li>
                    <li>Deve includere almeno un carattere speciale (ad esempio: !, @, #, $, %, &, *)</li>
                </ul>
                <p className='mt-3 text-sm'>
                    Una password forte aiuta a proteggere il tuo account e i tuoi dati personali. Evita di usare parole comuni, nomi o date di nascita. Usa una combinazione di lettere, numeri e simboli per aumentarne la sicurezza.
                </p>
            </div>
        </div>
    );
};

export default PassInfo;
