import React from "react";
import { Link } from "react-router-dom";

function Footer({ styleProp }) {
    return (
        <div className="p-5 flex flex-col lg:flex-row justify-between bg-[#e6e6e6]" style={styleProp}>
            <div className="w-full items-center lg:items-start justify-center flex flex-col">
                <h1 className="text-3xl font-bold">Green Visa</h1>
                <span className="text-xl">La sostenibilità con un click!</span>
            </div>

            <div className="w-full items-center justify-center flex flex-row flex-wrap gap-5 p-3 text-xl">
                <Link to="/Products">Entra in green visa</Link>
                {/*<Link to="/payment">Pagamento</Link>*/}
                <Link to="/News">News</Link>
                <Link to="/Carrello">Carrello</Link>
                <Link to="/Contacts">Contattaci</Link>
                <Link to="/privacy">Privacy Policy</Link>
            </div>

            <div className="w-full items-center justify-center lg:justify-end  flex flex-row flex-wrap gap-5 pt-2">
                <a href="https://www.facebook.com/greenvisanetwork" target="_blank" rel="noreferrer"><img src="/img/facebook.png" alt="facebook" className="w-14" /></a>
                <a href="https://www.linkedin.com/company/greenvisanetwork/" target="_blank" rel="noreferrer"><img src="/img/linkedin.png" alt="linkedin" className="w-14" /></a>
                <a href="https://www.instagram.com/greenvisanetwork/" target="_blank" rel="noreferrer"><img src="/img/insta.png" alt="instagram" className="w-14" /></a>
                <a href="https://www.youtube.com/@emiengineeringtv610" target="_blank" rel="noreferrer"><img src="/img/yt.png" alt="youtube" className="w-14" /></a>
            </div>

        </div>
    );
}

export default Footer