import React, { useEffect, useState } from "react";

function ConfirmPopUp(props) {
    const [position, setPosition] = useState({ top: '50%', left: '50%' });

    const updatePosition = () => {
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        // Calcola il centro della finestra attuale rispetto alla posizione corrente
        const top = scrollY + viewportHeight / 2;
        const left = scrollX + viewportWidth / 2;

        setPosition({ top, left });
    };

    useEffect(() => {
        updatePosition(); // Posiziona il popup inizialmente

        window.addEventListener('scroll', updatePosition); // Aggiorna la posizione durante lo scroll
        window.addEventListener('resize', updatePosition); // Aggiorna la posizione durante il ridimensionamento

        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, []);

    return props.trigger ? (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-25 transition-opacity duration-300 ease-out"
        >
          <div
            className={`w-[420px] h-[30vh] flex flex-col items-center justify-center rounded-lg shadow-lg text-arial text-xl bg-white transition-opacity duration-300 ease-out ${props.trigger ? 'animate-fadeIn animate-scaleUp' : 'opacity-0'}`}
          >
            <h1 className="text-arial text-xl text-center font-bold pb-5 w-[70%]">{props.children}</h1>
            <div className="w-[60%] flex flex-row gap-3">
              <div className="w-full h-auto flex items-center justify-center">
                <button 
                  className="w-full p-1 bg-black text-white rounded-lg border-2 border-transparent hover:border-black transition-colors duration-300 ease-in-out hover:bg-white hover:text-black" 
                  onClick={() => props.setTrigger(false)}
                >
                  No
                </button>
              </div>
              <div className="w-full h-auto flex items-center justify-center">
                <button 
                  className="w-full p-1 bg-red-500 text-white rounded-lg border-2 border-transparent hover:border-red-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-red-500" 
                  onClick={props.onButtonClick}
                >
                  Si
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null;
}

export default ConfirmPopUp;
