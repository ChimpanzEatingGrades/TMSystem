import Dish from './Dish'
import dishList from '@/utils/dishList'

function Dishes() {
  return (
    <section className='w-full py-12 sm:py-16 bg-white' id='dishes'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-10'>
          <h3 className='sub-heading'>Our dishes</h3>
          <h1 className='heading mb-3'>Popular dishes</h1>
          <p className='max-w-2xl mx-auto text-gray-600 text-base sm:text-lg'>
            Discover our most loved dishes, made with the finest ingredients
          </p>
        </div>
        
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {dishList.map((item, index) => (
            <Dish key={index} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Dishes
