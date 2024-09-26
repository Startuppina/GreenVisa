import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function UsersBuildings() {
    const [userInfo, setUserInfo] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserInfo = async () => {
            const token = localStorage.getItem("token");
            try {
                const response = await axios.get("http://localhost:8080/api/fetch-user-info-by-buildings", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.status === 200) {
                    setUserInfo(response.data);
                    console.log(response.data);
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchUserInfo();
    }, []);

    const userBuildingRedirect = (id, username) => {
        navigate(`/user-buildings/${id}/${username}`);
    }

    return (
        <div className="flex flex-col h-auto w-full md:w-[98.5%] mx-auto my-10 font-arial text-xl m-4">
            <div className="flex-grow text-arial text-xl p-4 rounded-2xl border shadow-xl py-6">
                <h1 className="text-2xl font-bold text-black text-center pb-5">Edifici degli utenti</h1>
                <p className="text-xl text-center mb-4">In questa sezione verranno registrati tutti gli utenti che hanno registrato almeno un edificio</p>


                <div className="space-y-4">
                    {userInfo.map((user, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-md border">
                            <div className="mb-3">
                                <h2 className="text-xl font-bold">Nome e Cognome</h2>
                                <p className="text-lg">{user.username}</p>
                            </div>
                            <div className="mb-3">
                                <h2 className="text-xl font-bold">Email</h2>
                                <p className="text-lg">{user.email}</p>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    className="p-2 w-auto z-10 bg-[#2d7044] text-white rounded-lg border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]"
                                    onClick={() => {
                                        userBuildingRedirect(user.id, user.username);
                                    }}
                                >
                                    Accedi ai suoi edifici
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}

export default UsersBuildings;