import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated } from "./isAuthenticated";

function Navbar() {
    const [showMenu, setShowMenu] = useState(window.innerWidth > 800); // Check if screen width is greater than 800px
    const [openDrawer, setOpenDrawer] = useState(false);
    const navigate = useNavigate(); // Use useNavigate hook for navigation

    useEffect(() => {
        const handleResize = () => {
            setShowMenu(window.innerWidth > 800);
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const handleUserIconClick = async () => {
        const authenticated = await isAuthenticated();
        if (!authenticated) {
            navigate("/login");
        } else {
            navigate("/user");
        }
    };

    return (
        <nav className="flex space-between center p-0 bg-transparent h-[100px] md:h-[150px]">
            <Link to="/">
                <img
                    src="/img/logo.png"
                    alt="Green Visa Logo"
                    className="w-[100px] h-[100px] md:w-[150px] md:h-[150px] absolute top-0 left-4 z-10 cursor-pointer"
                />
            </Link>
            <div className={showMenu ? "absolute top-[30px] right-[15px]" : "hidden"}>
                <ul className="list-none flex gap-[20px] font-[Arial] text-[1.2em] font-bold m-0">
                    <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/">Home</Link></li>
                    <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/cart">Carrello</Link></li>
                    <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/News">News</Link></li>
                    <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/Products">Entra in Green Visa</Link></li>
                    <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/Contacts">Contattaci</Link></li>
                    <li className="cursor-pointer hover:text-[#2d7044]">
                        <img
                            src="/img/user-icon.png"
                            alt="user"
                            style={{ width: "30px", height: "30px" }}
                            onClick={handleUserIconClick}
                        />
                    </li>
                </ul>
            </div>

            {/* Show menu button when the window is small */}
            <div className={!showMenu ? "" : "hidden"}>
                <img
                    src="/img/menu.png"
                    alt="menu"
                    className="w-[35px] h-[35px] cursor-pointer absolute right-4 top-4"
                    onClick={() => setOpenDrawer(!openDrawer)}
                />
            </div>


            {/* Drawer */}
            <div className={"fixed top-0 right-0 h-full w-64 transform transition-transform duration-300 bg-white p-4 z-30 " + (openDrawer ? "translate-x-0" : "translate-x-full")}>
                <img
                    src="/img/close.png"
                    alt="close"
                    className="w-[40px] h-[40px] cursor-pointer absolute right-4 top-4"
                    onClick={() => setOpenDrawer(!openDrawer)}
                />

                <ul className="list-none flex flex-col gap-[20px] font-[Arial] text-[1.2em] font-bold m-0 mb-4">
                    <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/">Home</Link></li>
                    <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/cart">Carrello</Link></li>
                    <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/News">News</Link></li>
                    <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/Products">Entra in Green Visa</Link></li>
                    <li className="cursor-pointer hover:text-[#2d7044]"><Link to="/Contacts">Contattaci</Link></li>
                    <li className="cursor-pointer hover:text-[#2d7044]">
                        <img
                            src="/img/user-icon.png"
                            alt="user"
                            style={{ width: "30px", height: "30px" }}
                            onClick={handleUserIconClick}
                        />
                    </li>
                </ul>
            </div>
        </nav>
    );
}

export default Navbar;
