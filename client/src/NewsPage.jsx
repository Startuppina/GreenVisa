import React from 'react'
import News from './components/news_carousel'
import Navbar from './components/navbar'
import Footer from './components/footer'
import ScrollToTop from './components/scrollToTop'
import CourseUploadForm from './components/news_form'

const NewsPage = () => {

  return (
    <div>
      <ScrollToTop />
      <Navbar />
      <News />
      <CourseUploadForm/>
      <Footer/>
    </div>
  )
}

export default NewsPage