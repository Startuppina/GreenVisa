import React from 'react'
import News from './components/news_carousel'
import Navbar from './components/navbar'
import Footer from './components/footer'
import ScrollToTop from './components/scrollToTop'
import NewsForm from './components/news_form'

const NewsPage = () => {

  return (
    <div>
      <ScrollToTop />
      <Navbar />
      <News />
      <NewsForm />
      <Footer/>
    </div>
  )
}

export default NewsPage