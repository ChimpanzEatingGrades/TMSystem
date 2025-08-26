function Footer() {
  return (
    <footer className='w-full flex flex-col py-4 px-[7%] bg-white md:px-8'>
      <div className='grid grid-cols-[repeat(auto-fit,minmax(25rem,1fr))] gap-6 transition-all'>
        <div>
          <h3 className='py-2 text-[2.5rem] text-brandBlack'>locations</h3>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>india</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>japan</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>russia</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>USA</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>france</a>
        </div>
        <div>
          <h3 className='py-2 text-[2.5rem] text-brandBlack'>quick links</h3>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>home</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>dishes</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>about</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>menu</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>reivew</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>order</a>
        </div>
        <div>
          <h3 className='py-2 text-[2.5rem] text-brandBlack'>contact info</h3>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>+123-456-7890</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>+111-222-3333</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>shaikhanas@gmail.com</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>anasbhai@gmail.com</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>mumbai, india - 400104</a>
        </div>
        <div>
          <h3 className='py-2 text-[2.5rem] text-brandBlack'>follow us</h3>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>facebook</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>twitter</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>instagram</a>
          <a href='#' className='block py-2 text-[1.5rem] text-gray-500 hover:text-brandGreen underline-offset-2 hover:underline transition-all'>linkedin</a>
        </div>
      </div>
      <div className='text-center border-t border-black/10 text-[2rem] text-brandBlack p-2 pt-6 mt-6'>
        Copyright @ 2021 by{' '}
        <a
          target='_blank'
          rel='noreferrer'
          href='https://github.com/smarqueslopez'
          className='text-brandGreen'
        >
          smarqueslopez
        </a>
      </div>
    </footer>
  )
}

export default Footer
