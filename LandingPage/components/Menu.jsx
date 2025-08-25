import Dish from './Dish'
import menuDishList from '@/utils/menuDishList'

function Menu() {
  return (
    <section className='w-full py-12 sm:py-16' id='menu'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h3 className='sub-heading text-center'>Our menu</h3>
        <h1 className='heading text-center mb-8 sm:mb-12'>Today&apos;s Speciality</h1>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
          {menuDishList.map((menu, index) => (
            <Dish key={index} {...menu} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Menu
