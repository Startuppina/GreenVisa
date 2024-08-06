import React from 'react'
import Contacts from './components/contacts.jsx'
import Navbar from './components/navbar.jsx';
import Footer from './components/footer.jsx';
import ScrollToTop from './components/scrollToTop.jsx';

function ContactsPage() {
  return (
    <>
    <ScrollToTop />
    <Navbar />
    <Contacts />
    <Footer />
    </>
  )
}

export default ContactsPage