import React from 'react'
import News from './components/news_carousel'
import Navbar from './components/navbar'
import Footer from './components/footer'
import ScrollToTop from './components/scrollToTop'
import NewsUnread from './components/newsUnread'

const NewsPage = () => {

  return (
    <div>
      <ScrollToTop />
      <Navbar />
      <main>
        <News />
        <NewsUnread />
      </main>
      <Footer/>
    </div>
  )
}

export default NewsPage