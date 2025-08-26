import { useEffect } from 'react'
import classNames from 'classnames'

function ScrollUp() {
  useEffect(() => {
    const scrollUp = document.getElementById('scroll-up')
    window.addEventListener('scroll', () => {
      if (!scrollUp) return
      if (window.scrollY >= 200) {
        scrollUp.classList.add('bottom-20')
      } else {
        scrollUp.classList.remove('bottom-20')
      }
    })
  }, [])

  return (
    <a href='#' className='fixed right-4 -bottom-[20%] inline-flex rounded-full cursor-pointer z-[999] text-brandBlack bg-brandGrey opacity-80 hover:text-white hover:bg-brandGreen hover:opacity-100 transition-all md:right-8' id='scroll-up' title={'Go up!'}>
      <i
        className={classNames('fas', 'fa-arrow-up', 'w-[4.5rem] h-[4.5rem] text-[1.7rem] text-center leading-[4.5rem]')}
      ></i>
    </a>
  )
}

export default ScrollUp
