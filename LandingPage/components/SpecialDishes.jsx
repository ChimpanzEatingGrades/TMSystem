'use client';

import SpecialDish from './SpecialDish';
import specialDishes from '@/utils/specialDishes';
import { getHeadingClasses } from '@/utils/buttonStyles';
import Slider from './Slider';

export default function SpecialDishes() {
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 1000,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          initialSlide: 1
        }
      }
    ]
  };

  return (
    <section className='py-12 sm:py-16 bg-gradient-to-b from-white to-gray-50'>
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden z-0'>
        <div className='absolute -top-20 -right-20 w-64 h-64 bg-brandYellow/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70'></div>
        <div className='absolute -bottom-20 -left-20 w-72 h-72 bg-brandYellow/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70'></div>
      </div>

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-10'>
          <h2 className={getHeadingClasses()}>
            Our Special Dishes
          </h2>
          <p className='max-w-2xl mx-auto text-gray-600 text-base sm:text-lg mt-3 pb-10'>
            Discover our chef's special creations made with the finest ingredients
          </p>
        </div>

        <div className='relative px-2'>
          <Slider settings={sliderSettings}>
            {specialDishes.map((dish, index) => (
              <div key={index} className='px-2 py-2 h-full'>
                <SpecialDish {...dish} />
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}
