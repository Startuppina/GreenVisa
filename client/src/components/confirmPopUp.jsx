import React, { useEffect } from "react";

function ConfirmPopUp(props) {

    const [position, setPosition] = React.useState({top : '50%', left: '50%'});

    useEffect(() => {
          const handleScroll = () => {
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;
    
            // Calcola il centro della finestra attuale rispetto alla posizione corrente
            const top = scrollY + viewportHeight / 2;
            const left = scrollX + viewportWidth / 2;
    
            setPosition({ top, left });
          };
    
          handleScroll(); // Posiziona il popup inizialmente
          window.addEventListener('scroll', handleScroll); // Aggiorna la posizione durante lo scroll
    
          return () => {
            window.removeEventListener('scroll', handleScroll);
          };
        }
    , []);



    return props.trigger ? (
        <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-50 w-[420px] h-[30vh] flex flex-col items-center justify-center rounded-lg shadow-lg text-arial text-xl bg-[#d9d9d9]"
        style={{ top: `${position.top}px`, left: `${position.left}px` }} // Applica lo stile direttamente
        >
            <h1 className="text-arial text-xl text-center font-bold pb-5 w-[70%]">{props.children}</h1>
            <div className="w-[60%] flex flex-row gap-3">
                <div className="w-full h-auto flex items-center justify-center">
                    <button 
                        className="w-full p-1 bg-black text-white rounded-lg border-2 border-transparent hover:border-black transition-colors duration-300 ease-in-out hover:bg-white hover:text-black" 
                        onClick={() => props.setTrigger(false)}>
                        No
                    </button>
                </div>
                <div className="w-full h-auto flex items-center justify-center">
                    <button 
                        className="w-full p-1 bg-red-500 text-white rounded-lg border-2 border-transparent hover:border-red-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-red-500" 
                        onClick={props.onButtonClick}>
                        Si
                    </button>
                </div>
            </div>
        </div>
    ) : null;
}

export default ConfirmPopUp;
