import { useState } from 'react'
import classNames from 'classnames'

function StarRating({ min = 0, max = 5, value }) {
  const [rating, setRating] = useState(value)
  const [hover, setHover] = useState(min)
  return (
    <div className='flex gap-0.5'>
      {[...Array(max)].map((star, index) => {
        const ratingValue = index + 1
        const isMarked = (hover || rating) >= ratingValue
        return (
          <span
            key={index}
            data-value={ratingValue}
            className={classNames('fas fa-star text-lg sm:text-xl cursor-pointer transition-all w-5 text-center', {
              'text-brandGreen': isMarked,
              'text-brandGrey': !isMarked
            })}
            onClick={() => setRating(ratingValue)}
            onMouseOver={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(min)}
          />
        )
      })}
    </div>
  )
}

export default StarRating
