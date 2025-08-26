function About() {
  return (
    <section className='w-full bg-white text-center' id='about'>
      <div className='w-full max-w-[1200px] mx-auto px-4 md:px-8 py-8 bg-brandGrey rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.06)]'>
      <h3 className='sub-heading'>About us</h3>
      <h1 className='heading pb-10'>Why choose us?</h1>

      <div className='flex flex-wrap gap-6 items-center'>
        <div className='basis-[45rem] grow transition-all'>
        <img 
          src='images/about-img.png' 
          alt='' 
          className='max-w-[1000px] w-full mx-auto pt-4' 
         />
        </div>

        <div className='basis-[45rem] grow transition-all'>
          <h3 className='text-brandBlack text-[4rem] py-2'>Best food in the country</h3>
          <p className='text-gray-500 text-[1.5rem] py-2 leading-8'>
            Test.
          </p>
          <p className='text-gray-500 text-[1.5rem] py-2 leading-8'>
            Lorem ipsum.
          </p>
          <div className='flex gap-4 flex-wrap py-4 mt-2'>
            <div className='bg-brandGrey rounded-md border border-black/20 flex items-center justify-center gap-4 basis-[17rem] grow p-6'>
              <i className='fas fa fa-shipping-fast text-[2.5rem] text-brandGreen'></i>
              <span className='text-[1.5rem] text-brandBlack'>Fast delivery</span>
            </div>
            <div className='bg-brandGrey rounded-md border border-black/20 flex items-center justify-center gap-4 basis-[17rem] grow p-6'>
              <i className='fas fa fa-dollar-sign text-[2.5rem] text-brandGreen'></i>
              <span className='text-[1.5rem] text-brandBlack'>Easy payments</span>
            </div>
            <div className='bg-brandGrey rounded-md border border-black/20 flex items-center justify-center gap-4 basis-[17rem] grow p-6'>
              <i className='fas fa fa-headset text-[2.5rem] text-brandGreen'></i>
              <span className='text-[1.5rem] text-brandBlack'>Good service</span>
            </div>
          </div>
          <a href='#' className='button'>
            Learn more!
          </a>
        </div>
      </div>
      </div>
    </section>
  )
}

export default About
