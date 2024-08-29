import React from "react";
import Navbar from "./components/navbar";
import BuildingFrom from "./components/buildingFrom";

export default function Buildings() {
    const [numBuildings, setNumBuildings] = React.useState(0);
    const [showBuildingForm, setShowBuildingForm] = React.useState(false);

    return (
        <div>
            <Navbar/>
            <main className="text-arial text-xl">
                <h1 className="text-3xl font-bold text-center">I TUOI EDIFICI</h1>

                {numBuildings === 0 ? (
                    <div className="text-center mt-20">
                        <h1 className="text-2xl mb-4">Non hai ancora edifici registrati, aggiungine uno</h1>
                        <div className="flex justify-center" onClick={() => setShowBuildingForm(!showBuildingForm)}>
                            <img src="/img/add.png" title="hospitality" className="w-[80px] md:w-[80px] transition-transform duration-300 ease-in-out hover:scale-105 rounded-lg" />
                        </div>

                        {showBuildingForm && <BuildingFrom />}
                    </div>
                ) : (
                    <div className="text-center mt-10">
                        <h1 className="text-2xl font-bold text-center mb-3">Edifici: {numBuildings}</h1>
                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="w-[400px] h-[200px] bg-[#D3BC8D] rounded-lg p-4 hover:transform hover:scale-105 duration-300">
                                <div className="font-bold h-full flex items-center justify-center text-2xl uppercase">Edificio 1</div>
                            </div>
                            <div className="w-[400px] h-[200px] bg-[#D3BC8D] rounded-lg p-4 hover:transform hover:scale-105 duration-300">
                                <div className="font-bold h-full flex items-center justify-center text-2xl uppercase">Edificio 2</div>
                            </div>
                            <div className="w-[400px] h-[200px] bg-[#D3BC8D] rounded-lg p-4 hover:transform hover:scale-105 duration-300">
                                <div className="font-bold h-full flex items-center justify-center text-2xl uppercase">Edificio 3</div>
                            </div>
                        </div>

                        
                    </div>
                )
                }
            </main>
        </div>
    );
}

