import React from "react";
import Marquee from "react-fast-marquee";

function Infinite_carousel() {
    
  return (
      <div className="w-[95%] mx-auto overflow-hidden whitespace-nowrap">
          <Marquee gradient gradientColor="#2d7044" gradientWidth={30}>
              <div className="w-[45vw] md:w-[25vw] inline-block m-2 transition-transform duration-300 ease-in-out hover:scale-105">
                  <img src="/img/hospitality.png" title="hospitality" className="rounded-lg" />
              </div>
              <div className="w-[45vw] md:w-[25vw] inline-block m-2 transition-transform duration-300 ease-in-out hover:scale-105">
                  <img src="/img/spa.png" title="spa and resort" className="rounded-lg" />
              </div>
              <div className="w-[45vw] md:w-[25vw] inline-block m-2 transition-transform duration-300 ease-in-out hover:scale-105">
                  <img src="/img/transport.png" title="transport" className="rounded-lg" />
              </div>
              <div className="w-[45vw] md:w-[25vw] inline-block m-2 transition-transform duration-300 ease-in-out hover:scale-105">
                  <img src="/img/industry.png" title="industry" className="rounded-lg" />
              </div>
              <div className="w-[45vw] md:w-[25vw] inline-block m-2 transition-transform duration-300 ease-in-out hover:scale-105">
                  <img src="/img/store.png" title="store and retail" className="rounded-lg" />
              </div>
              <div className="w-[45vw] md:w-[25vw] inline-block m-2 transition-transform duration-300 ease-in-out hover:scale-105">
                  <img src="/img/restaurant.png" title="restaurants" className="rounded-lg" />
              </div>
          </Marquee>
      </div>
  );
}

export default Infinite_carousel