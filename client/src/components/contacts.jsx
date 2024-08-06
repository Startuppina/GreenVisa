import React from "react";
import Navbar from "./navbar";
import Footer from "./footer";

function Contacts() {
    return (
        <>
            <div className="w-full min-h-screen md:bg-[url('/img/login.jpg')] sm:bg-white bg-cover bg-center bg-no-repeat flex items-center justify-center md:p-8">
                <div className="p-6 bg-white w-full md:w-[80%] md:min-h-[60%] md:rounded-lg">
                    <h1 className="font-arial text-2xl md:text-3xl text-center font-bold mb-5">CONTATTACI VIA EMAIL</h1>
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="w-full md:w-[48%] p-4">
                            <form action="" className="w-full">
                                <div className='mb-5'>
                                    <label htmlFor="name" className='font-arial text-xl font-bold text-start block mb-2'>Nome e cognome</label>
                                    <input type="text" name="nome" id="name" className='w-full p-2 bg-[#d9d9d9] ' />
                                </div>
                                <div className='mb-5'>
                                    <label htmlFor="email" className='font-arial text-xl font-bold text-start block mb-2'>Email</label>
                                    <input type="email" name="email" id="email" className='w-full p-2 bg-[#d9d9d9] ' />
                                </div>
                                <div className='mb-5'>
                                    <label htmlFor="soggetto" className='font-arial text-xl font-bold text-start block mb-2'>Soggetto</label>
                                    <input type="text" name="soggetto" id="soggetto" className='w-full p-2 bg-[#d9d9d9] ' />
                                </div>
                                <div className='mb-5'>
                                    <label htmlFor="message" className='font-arial text-xl font-bold text-start block mb-2'>Messaggio</label>
                                    <textarea name="message" id="message" className='w-full h-44 p-2 bg-[#d9d9d9]  resize-none'></textarea>
                                </div>
                                <div className='flex justify-center'>
                                    <input type="submit" value="Invia" className="mt-7 font-arial font-semibold text-xl w-[70%] md:text-2xl md:w-[50%] lg:text-2xl lg:w-[30%] p-1 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]" />
                                </div>
                            </form>
                        </div>
                        <div className="w-full md:w-[48%] p-4 flex flex-col items-center">
                            <h1 className="font-arial text-2xl md:text-3xl text-center font-bold mb-5">Oppure chatta con noi</h1>
                            <img src="/img/whatsapp.png" alt="whatsapp" className="w-[200px] md:w-[250px] lg:w-[300px] m-auto hover:transform hover:scale-105 transition-transform duration-300" />
                        </div>
                    </div>
                </div>
            </div>

        </>
    )
}

export default Contacts