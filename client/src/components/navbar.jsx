import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Navbar() {
    const [showMenu, setShowMenu] = useState(window.innerWidth <= 800);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [finder, showFinder] = useState(false);
    const navigate = useNavigate(); // Use useNavigate hook for navigation

    useEffect(() => {
        const handleResize = () => {
            setShowMenu(window.innerWidth <= 800);
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const fetchAuth = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/auth', {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    const handleUserIconClick = async () => {
        const data = await fetchAuth();
        if (data && data.isAuth) {
            console.log("Utente autenticato");
            navigate("/News");
        } else {
            console.log("Utente non autenticato");
            navigate("/login");
        }
    };

    return (
        <nav className="flex space-between center p-0 bg-transparent h-[100px] md:h-[150px]">
            <Link to="/"><img src="/public/img/logo.png" alt="Green Visa Logo" className="w-[100px] h-[100px] md:w-[150px] md:h-[150px] absolute top-0 left-4 z-10 cursor-pointer" /></Link>
            <div className={showMenu ? "hidden" : "absolute top-[30px] right-[15px]"}>
                <div>
                    <ul className="list-none flex gap-[20px] font-[Arial] text-[1.2em] font-bold m-0">
                        <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/">Home</Link></li>
                        <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/News">News</Link></li>
                        <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/Contacts">Contattaci</Link></li>
                        <li className="cursor-pointer hover:text-[#2d7044]"><img src="/public/img/user-icon.png" alt="user" style={{ width: "30px", height: "30px" }} onClick={handleUserIconClick} /></li>
                    </ul>
                    <img src="/public/img/menu.png" alt="menu" className={showMenu ? "block w-[30px] h-[30px] cursor-pointer absolute right-0 m-0" : "hidden"} />
                </div>
                <img src="/public/img/search-icon.png" alt="search" className="w-[30px] h-[30px] cursor-pointer absolute right-0 mt-[15px]" onClick={() => showFinder(!finder)} />
                <input type="search" placeholder="Cerca" className={finder ? "w-[200px] h-[30px] p-3 font-arial font-semibold absolute right-[45px] mt-[15px] rounded-lg bg-[#2d7044]" : "hidden"} />
            </div>

            <div className={showMenu ? "absolute top-0 left-0 right-0 bottom-0" : "hidden"}>
                <img src="/public/img/menu.png" alt="menu" className="w-[35px] h-[35px] cursor-pointer absolute right-4 top-4" onClick={() => setOpenDrawer(!openDrawer)} />
            </div>

            {/* Drawer */}
            <div className={"fixed top-0 right-0 h-full w-64 transform transition-transform duration-300 bg-white p-4 z-30 " + (openDrawer ? "translate-x-0" : "translate-x-full")}>
                <img src="/public/img/close.png" alt="close" className="w-[40px] h-[40px] cursor-pointer absolute right-4 top-4" onClick={() => setOpenDrawer(!openDrawer)} />

                <ul className="list-none flex flex-col gap-[20px] font-[Arial] text-[1.2em] font-bold m-0 mb-4">
                    <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/">Home</Link></li>
                    <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/News">News</Link></li>
                    <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/Contacts">Contattaci</Link></li>
                    <li className="cursor-pointer hover:text-[#2d7044]"><img src="/public/img/user-icon.png" alt="user" style={{ width: "30px", height: "30px" }} onClick={handleUserIconClick} /></li>
                </ul>
                <input type="search" placeholder="Cerca..." className="w-full p-2 border border-gray-300 rounded-md"></input>
            </div>
        </nav>
    );
}

export default Navbar;
