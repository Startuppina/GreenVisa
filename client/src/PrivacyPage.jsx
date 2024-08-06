import React from 'react'
import Privacy from './components/privacy'
import Navbar from './components/navbar'
import Footer from './components/footer'
import ScrollToTop from './components/scrollToTop'

function PrivacyPage() {
  return (  
    <>
      <ScrollToTop />
      <Navbar />
      <Privacy />
      <Footer />
    </>
  )
}

export default PrivacyPage