import React from 'react'
import Article from './components/article'
import Navbar from './components/navbar'
import Footer from './components/footer'
import ScrollToTop from './components/scrollToTop'

function ArticlePage()  {
  return (
    <div>
      <ScrollToTop />
      <Navbar />
      <main>
        <Article />
      </main>
      <Footer />
    </div>
  )
}

export default ArticlePage