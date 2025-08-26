import Stars from './StarRating'
import classNames from 'classnames'

function Dish({ title, img, rating, price, description, favorited, detailed }) {
  return (
    <div className='p-6 bg-white rounded-md border border-black/20 shadow-brand relative overflow-hidden text-center transition-all group h-full flex flex-col'>
      <div className='relative mb-4 overflow-hidden rounded-md bg-gray-100'>
        <img 
          className='w-full h-48 sm:h-56 object-cover transition-transform duration-300 hover:scale-105' 
          src={img} 
          alt={title} 
          loading='lazy'
        />
        {favorited && (
          <button className='absolute top-2 right-2 bg-white/80 rounded-full p-2 text-brandBlack hover:bg-brandGreen hover:text-white transition-colors'>
            <i className='fas fa-heart text-xl'></i>
          </button>
        )}
        {detailed && (
          <button className='absolute top-2 left-2 bg-white/80 rounded-full p-2 text-brandBlack hover:bg-brandGreen hover:text-white transition-colors'>
            <i className='fas fa-eye text-xl'></i>
          </button>
        )}
      </div>
      <div className='flex-grow flex flex-col'>
        <h3 className='text-xl font-semibold text-gray-900 mb-2'>{title}</h3>
        {description && (
          <p className='text-gray-600 text-sm mb-3 line-clamp-2'>{description}</p>
        )}
        <div className='mt-auto'>
          <div className='flex justify-center mb-3'>
            <Stars value={rating} />
          </div>
          <div className='flex items-center justify-between mt-2'>
            <span className='text-brandGreen font-bold text-xl'>{price}</span>
            <button className='bg-brandGreen text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors'>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dish
