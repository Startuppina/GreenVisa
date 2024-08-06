import Hero from './components/hero.jsx'
import Carousel from './components/carousel2.jsx'
import Protocolli from './components/protocolli.jsx'
import Vantaggi from './components/vantaggi.jsx'
import Footer from './components/footer.jsx'
import { Link } from 'react-router-dom'
import ScrollToTop from './components/scrollToTop.jsx'


function App() {

  return (
    <>
      <ScrollToTop />
      <Hero />
      <Carousel />
      <Protocolli />
      <Vantaggi />
      <div className='mt-12 w-full h-auto flex flex-col items-center justify-center'>
        <h1 className='font-arial text-4xl text-center font-semibold p-4'>
            Ora che hai tutte le informazioni necessarie...
        </h1>
        <button className="mt-7 mb-10 font-arial font-semibold text-xl w-[70%] md:text-2xl md:w-[50%] lg:text-2xl lg:w-[30%] p-3 bg-[#2d7044] rounded-[15px] border-2 border-transparent hover:border-[#2d7044] transition-colors duration-300 ease-in-out hover:bg-white hover:text-[#2d7044]">
          <Link to="/Products">ENTRA IN GREEN VISA</Link>
        </button>
      </div>
      <Footer />
    </>
  );
}

export default App
