import { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Script from 'next/script'
import '@/styles/tailwind.css'


function MyApp({ Component, pageProps }) {
  const router = useRouter()

  // Handle scroll restoration for smooth scrolling
  useEffect(() => {
    const handleRouteChange = () => {
      // Smooth scroll to top on route change
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <>
      <Head>
        {/* Character Encoding */}
        <meta charSet="utf-8" />
        
        {/* Viewport and Mobile Settings */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" 
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Theme and Description */}
        <meta name="theme-color" content="#FFC601" />
        <meta name="description" content="Kapitan Sisig - Authentic Filipino Cuisine" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Google Fonts */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@200;300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </Head>

      {/* Google Analytics */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `,
        }}
      />

      <div className="min-h-screen flex flex-col">
        <div className="flex-grow overflow-x-hidden scroll-smooth" style={{ scrollPaddingTop: '5.5rem' }}>
          <Component {...pageProps} />
        </div>
      </div>
    </>
  )
}

export default MyApp
