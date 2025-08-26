// Utility function to generate button classes
export const getButtonClasses = (additionalClasses = '') => {
  return `mt-4 inline-block text-[1.7rem] text-white bg-brandBlack rounded-[0.5rem] cursor-pointer p-2 px-6 transition-all duration-200 ease-in-out hover:bg-brandYellow hover:text-brandBlack hover:tracking-wider ${additionalClasses}`.trim();
};

// Utility function to generate heading classes
export const getHeadingClasses = (additionalClasses = '') => {
  return `text-center text-brandBlack text-[2.5rem] md:text-[3rem] font-bold pb-6 md:pb-8 uppercase transition-all duration-200 ease-in-out ${additionalClasses}`.trim();
};

// Utility function to generate sub-heading classes
export const getSubHeadingClasses = (additionalClasses = '') => {
  return `text-center text-brandYellow text-[1.5rem] md:text-[2rem] font-semibold pt-2 md:pt-4 transition-all duration-200 ease-in-out ${additionalClasses}`.trim();
};

// Swiper container classes
export const swiperContainerClasses = 'w-full max-w-[1200px] mx-auto px-4';

// Swiper pagination bullet active class
export const swiperPaginationBulletActiveClass = '!bg-brandYellow';

// Section container class
export const sectionContainer = 'py-12 md:py-20 px-4 md:px-6 max-w-7xl mx-auto';

// Input field styles
export const inputStyles = 'w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brandYellow focus:border-transparent';

// Label styles
export const labelStyles = 'block text-sm font-medium text-gray-700 mb-1';
