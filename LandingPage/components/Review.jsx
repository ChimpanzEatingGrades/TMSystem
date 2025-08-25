import StarRating from './StarRating'
import classNames from 'classnames'

function Review({ title, img, msg, rating }) {
  return (
    <div className='p-6 shadow-brand border border-black/20 rounded-md relative transition-all h-full flex flex-col'>
      <div className='flex gap-4 items-center pb-4'>
        <img className='h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover' src={img} alt={title} />
        <div className='min-w-0'>
          <h3 className='text-brandBlack text-xl sm:text-2xl font-medium truncate'>{title}</h3>
          <div className='-ml-1'><StarRating value={rating} /></div>
        </div>
      </div>
      <p className='text-gray-600 text-sm sm:text-base leading-relaxed mt-2 line-clamp-4'>{msg}</p>
    </div>
  )
}

export default Review
