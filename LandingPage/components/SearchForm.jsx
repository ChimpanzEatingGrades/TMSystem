import classNames from 'classnames'

function SearchForm({ active, onClose }) {
  return (
    <form
      action=''
      className={classNames(
        'w-full h-full fixed -top-[110%] left-0 z-[1004] bg-black/80 flex items-center justify-center px-4 transition-all',
        { '!top-0': active }
      )}
      id='search-form'
    >
      <input
        className='w-[50rem] max-[768px]:w-[90%] py-4 text-[3rem] bg-transparent text-white border-b border-white placeholder:text-brandGrey focus:outline-none focus:ring-0'
        type='search'
        placeholder='Search here...'
        name=''
        id='search-box'
      />
      <span
        className='fas fa-search text-white cursor-pointer text-[3rem] ml-4 hover:text-brandGreen transition-all'
      ></span>
      <span
        className='fas fa-times absolute top-8 right-12 text-white cursor-pointer text-[5rem] hover:text-brandGreen transition-all'
        onClick={onClose}
      ></span>
    </form>
  )
}

export default SearchForm
