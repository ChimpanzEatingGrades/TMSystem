import { useEffect, useState } from 'react';

function Loader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hide loader after page loads
    const handleLoad = () => {
      setIsLoading(false);
    };

    // If page is already loaded
    if (document.readyState === 'complete') {
      setIsLoading(false);
    } else {
      window.addEventListener('load', handleLoad);
    }

    // Cleanup
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className='fixed top-0 left-0 h-full w-full z-[10000] bg-white flex items-center justify-center overflow-hidden animate-fadeOut'>
      <img 
        src='/images/loader.gif' 
        alt='Loading...' 
        className='w-full max-w-[35rem] transition-all' 
      />
    </div>
  );
}

export default Loader;
