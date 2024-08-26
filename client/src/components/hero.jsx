import React from "react";
import Navbar from "./navbar";
import { Link } from "react-router-dom";

function Hero() {
    return (
        <div className="w-full h-[70vh] relative m-0">
            <video autoPlay muted loop playsInline className="absolute w-full h-full object-cover z-0">
                <source src="/img/hero-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <Navbar />
            <div className="w-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-5 text-center z-20">
                <div className="font-arial text-4xl md:text-5xl lg:text-6xl w-[80%] md:w-[60%] lg:w-[35%] text-black">
                    La sostenibilità con un click!
                </div>
                <button className="mt-7 font-arial font-semibold text-xl text-white w-[70%] md:text-2xl md:w-[50%] lg:text-2xl lg:w-[30%] p-3 bg-[#2d7044] rounded-[15px] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044] border-4 border-transparent hover:border-[#2d7044]">
                    <Link to="/Products">ENTRA IN GREEN VISA</Link>
                </button>
            </div>
        </div>
    );
}

export default Hero;