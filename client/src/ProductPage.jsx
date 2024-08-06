import React from "react";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import ProductDetails from "./components/productDetails";
import ScrollToTop from "./components/scrollToTop";


export default function ProductPage() {
    return (
        <div >
            <ScrollToTop />
            <Navbar />
            <ProductDetails />
            <Footer/>
        </div>
    );
}