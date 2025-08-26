import { getButtonClasses } from '@/utils/buttonStyles'
import Image from 'next/image'

function SpecialDish({ title, subtitle, description, img }) {
  return (
    <div className='flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300'>
      {/* Image */}
      <div className='relative h-48 sm:h-56 w-full bg-gray-100'>
        <Image
          src={img}
          alt={title}
          fill
          className='object-cover'
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          priority
        />
      </div>
      
      {/* Content */}
      <div className='p-5 flex flex-col h-full'>
        <div className='flex-grow'>
          <span className='inline-block text-brandYellow text-lg font-medium mb-1'>
            {subtitle}
          </span>
          <h3 className='text-xl font-bold text-gray-900 mb-2 line-clamp-2'>
            {title}
          </h3>
          <p className='text-gray-600 text-sm mb-4 line-clamp-3'>
            {description}
          </p>
        </div>
        <a 
          href='#' 
          className={`${getButtonClasses('py-2 text-sm')} w-full text-center`}
        >
          Order Now
        </a>
      </div>
    </div>
  )
}

export default SpecialDish
