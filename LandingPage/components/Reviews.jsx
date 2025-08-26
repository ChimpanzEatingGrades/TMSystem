import Review from './Review'
import reviewList from '@/utils/reviewList'
import Slider from './Slider'

export default function Reviews() {
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 1000,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
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
    <section className='w-full py-12 sm:py-16 bg-gray-50' id='reviews'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h3 className='sub-heading text-center'>Customer&apos;s Review</h3>
        <h1 className='heading text-center mb-8 sm:mb-12'>What They Say</h1>
        
        <div className='px-2 sm:px-4'>
          <Slider settings={sliderSettings}>
            {reviewList.map((review, index) => (
              <div key={index} className='px-2 py-2'>
                <div className='h-full'><Review {...review} /></div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  )
}
