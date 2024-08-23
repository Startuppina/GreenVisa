import { useState, useEffect } from 'react';
import axios from 'axios';

const CodeUsage = () => {
    const [copiedCodes, setCopiedCodes] = useState({});
    const [codici, setCodici] = useState([]);

  useEffect(() => {

    const fetchFromPublished = async () => {

        try{
            const response = await axios.get('http://localhost:8080/api/fetch-published-codes', 
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
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
  }, []);

  const handleCopy = (codice) => {
    navigator.clipboard.writeText(codice);
    setCopiedCodes(prevState => ({ ...prevState, [codice]: true }));
    setTimeout(() => {
      setCopiedCodes(prevState => ({ ...prevState, [codice]: false }));
    }, 2000); // Ripristina lo stato dopo 2 secondi
  };


  return (
    <div className='w-full flex flex-col md:flex-row items-center justify-center gap-4'>
      <div className='w-full h-[220px] bg-yellow-500 p-4 rounded-lg overflow-y-auto'>
        <h2 className='text-2xl font-bold mb-4'>Codici Utilizzabili</h2>
        {codici.map((codice, index) => (
            <div className='mb-3 flex items-center justify-between bg-white p-4 rounded-lg shadow'>
                <div className='flex flex-col md:flex-row md:space-x-20'>
                  <span className='text-lg font-mono text-red-500 w-[100px]'>{codice.code}</span>
                  <span className='text-lg font-mono'>Utilizzo: {codice.used_by}</span>
                </div>
                <button
                onClick={() => handleCopy(codice.code)}
                className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300'
                >
                {copiedCodes[codice.code] ? 'Copiato!' : 'Copia'}
                </button>
            </div>
        ))}
      </div>
    </div>
  );
};

export default CodeUsage;
