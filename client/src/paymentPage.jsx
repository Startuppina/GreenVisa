import React from "react";
import Payment from "./components/payment";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import ScrollToTop from "./components/scrollToTop";

function PaymentPage() {
    return (
        <div>
            <ScrollToTop />
            <Navbar />
            <Payment />
            <Footer />
        </div>
    );
}

export default PaymentPage;