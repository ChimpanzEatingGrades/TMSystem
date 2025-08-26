import SpecialDishes from './SpecialDishes'
import Dishes from './Dishes'
import About from './About'
import Menu from './Menu'
import Reviews from './Reviews'
import Order from './Order'

function Main() {
  return (
    <main className='w-full flex flex-col py-6 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto bg-white transition-all'>
      <section id='home' className='scroll-mt-20'>
        <SpecialDishes />
      </section>
      <section id='dishes' className='scroll-mt-20'>
        <Dishes />
      </section>
      <section id='about' className='scroll-mt-20'>
        <About />
      </section>
      <section id='menu' className='scroll-mt-20'>
        <Menu />
      </section>
      <section id='reviews' className='scroll-mt-20'>
        <Reviews />
      </section>
      <section id='order' className='scroll-mt-20'>
        <Order />
      </section>
    </main>
  )
}

export default Main
