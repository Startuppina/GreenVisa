import React from "react";


function MessagePopUp(props) {
  return (props.trigger) ? (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[30%] h-[30vh] flex flex-col items-center justify-center rounded-lg shadow-lg text-arial text-xl bg-slate-300">
        <h1 className="text-arial text-xl text-center font-bold pb-5 w-full">{props.children}</h1>
        <div className="w-full h-auto flex items-center justify-center">
            <button className="w-[40%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]" onClick={() => props.setTrigger(false)}>Ok</button>
        </div>
    </div>
  ) : "";
}

export default MessagePopUp