import React from 'react'
import Navbar from './navbar'
import Footer from './footer'

function Privacy() {
  return (
    <>
    <div className='flex flex-col font-arial p-4 md:p-20'>
        <h1 className='text-3xl font-bold text-center mb-5'>Privacy Policy</h1>
        <div>
            <h3 className='text-2xl text-left font-bold mb-5'>Titolare del trattamento</h3>
            <p className='text-justify text-xl'>Il Titolare del trattamento, ai sensi dell’art. 13 del GDPR è GREENVISA Srl – Viale G. Cesare, 14, 
                00192 – Roma (RM) – P.IVA 14866791008 che rispetta il diritto dei propri utenti ad essere informati con 
                riguardo alla raccolta e alle altre operazioni di trattamento dei loro dati personali, e fornisce le 
                seguenti informazioni circa il trattamento dei dati personali che Lei, in qualità di interessato, ci 
                ha comunicato...</p>
        </div>
    </div>
    </>
  )
}

export default Privacy