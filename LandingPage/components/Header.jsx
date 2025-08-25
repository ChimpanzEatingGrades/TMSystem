import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import menuItems from '@/utils/menuItems'
import { getButtonClasses } from '@/utils/buttonStyles'

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  const handleScroll = useCallback(() => {
    // Handle header scroll effect
    if (window.scrollY > 50) {
      setIsScrolled(true)
    } else {
      setIsScrolled(false)
    }

    // Handle active section detection
    const sections = document.querySelectorAll('section[id]')
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100
      const sectionHeight = section.offsetHeight
      const sectionId = section.getAttribute('id')
      
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        setActiveSection(sectionId)
      }
    })
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-[1000] w-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.08)] border-b border-black/10 ${isScrolled ? 'py-2' : 'py-3'} px-5 sm:px-6 lg:px-8 transition-all duration-300`}>
      <div className='w-full mx-auto max-w-[1200px] flex items-center justify-between'>
        <a href='#' className='flex items-center gap-2 sm:gap-4 flex-shrink-0 relative -top-[2px] sm:-top-[4px] md:-top-[5px]'>
          <div className='w-10 h-10 sm:w-14 sm:h-14 relative'>
            <Image
              src='/images/KapitanLogo.png'
              alt='Kapitan Sisig logo'
              fill
              sizes='(max-width: 768px) 40px, 56px'
              className='object-contain'
              priority
            />
          </div>
          <span className='text-xl sm:text-2xl font-bold text-brandBlack whitespace-nowrap'>
            Kapitan<span className='text-brandYellow'>Sisig</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className='hidden md:flex items-center space-x-8'>
          {menuItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`px-3 py-2 font-medium transition-colors duration-200 capitalize ${
                activeSection === item.href.replace('#', '')
                  ? 'text-brandYellow font-bold'
                  : 'text-brandBlack hover:text-brandYellow'
              }`}
            >
              {item.name}
            </a>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className='md:hidden z-50 p-2 text-brandBlack hover:text-brandYellow transition-colors'
          onClick={toggleMenu}
          aria-label='Toggle menu'
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <svg className='w-7 h-7' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          ) : (
            <svg className='w-7 h-7' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16m-7 6h7' />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } md:hidden`}
      >
        <div 
          className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={toggleMenu}
        />
        
        <div 
          className={`absolute top-0 right-0 h-full w-4/5 max-w-sm bg-white shadow-lg flex flex-col transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className='p-4 border-b border-gray-100 flex justify-between items-center'>
            <div className='flex items-center gap-2'>
              <div className='w-10 h-10 relative'>
                <Image
                  src='/images/KapitanLogo.png'
                  alt='Kapitan Sisig logo'
                  fill
                  className='object-contain'
                />
              </div>
              <span className='text-xl font-bold text-brandBlack'>
                Kapitan<span className='text-brandYellow'>Sisig</span>
              </span>
            </div>
          </div>
          
          <nav className='flex-1 overflow-y-auto p-4 space-y-2'>
            {menuItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={`block px-4 py-3 rounded-lg transition-colors text-lg ${
                  activeSection === item.href.replace('#', '')
                    ? 'bg-brandYellow/10 text-brandYellow font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
          </nav>
          
          <div className='p-4 border-t border-gray-100'>
            <a
              href='#'
              className={`${getButtonClasses('w-full')} text-center justify-center`}
              onClick={() => setIsMenuOpen(false)}
            >
              Order Now
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
