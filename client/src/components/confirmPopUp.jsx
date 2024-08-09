import React from "react";

function ConfirmPopUp(props) {
    return props.trigger ? (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[420px] h-[30vh] flex flex-col items-center justify-center rounded-lg shadow-lg text-arial text-xl bg-[#d9d9d9]">
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
