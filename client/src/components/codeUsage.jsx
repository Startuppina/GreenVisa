import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRecoveryContext } from '../provider/provider';

const CodeUsage = () => {
  const [copiedCodes, setCopiedCodes] = useState({});
  const [codici, setCodici] = useState([]);

  const { codeTrigger } = useRecoveryContext();

  useEffect(() => {

    const fetchFromPublished = async () => {

      try {
        const response = await axios.get(`${import.meta.env.VITE_REACT_SERVER_ADDRESS}/api/fetch-published-assinged-codes`,
          {
            withCredentials: true
          }
        );
        if (response.status === 200) {
          setCodici(response.data.codes);
        }
      } catch (error) {
        console.log(error);
      }

    };
    fetchFromPublished();
  }, [codeTrigger]);

  const handleCopy = (codice) => {
    navigator.clipboard.writeText(codice);
    setCopiedCodes(prevState => ({ ...prevState, [codice]: true }));
    setTimeout(() => {
      setCopiedCodes(prevState => ({ ...prevState, [codice]: false }));
    }, 2000); // Ripristina lo stato dopo 2 secondi
  };


  return (
    <div className="w-full lg:w-1/2 bg-yellow-500 p-4 rounded-xl overflow-y-auto flex-1">
      <h2 className="text-2xl font-bold mb-4 text-center lg:text-left">Codici sconto disponibili</h2>
      {codici.length === 0 && <p>Nessun codice disponibile</p>}
      {codici.map((codice, index) => (
        <div
          key={index} // Aggiungi una chiave unica per migliorare le prestazioni di React
          className="mb-4 flex flex-row items-center lg:items-start justify-between bg-white p-4 rounded-lg shadow tranform transition duration-300 hover:scale-[1.02] hover:shadow-lg"
        >
          <div className="flex flex-col items-start space-y-2 lg:space-y-0 w-full lg:w-auto">
            <span className="text-lg font-mono text-red-500 flex-shrink-0">{codice.code}</span>
            <span className="text-lg font-mono text-gray-700">Utilizzo: {codice.used_by}</span>
          </div>
          <button
            onClick={() => handleCopy(codice.code)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300 my-auto"
          >
            {copiedCodes[codice.code] ? 'Copiato!' : 'Copia'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default CodeUsage;
