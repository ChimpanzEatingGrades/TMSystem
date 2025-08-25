import Head from 'next/head'
import Header from '@/components/Header'
import Main from '@/components/Main'
import Loader from '@/components/Loader'
import ScrollUp from '@/components/ScrollUp'

export default function Home() {
  return (
    <div className='min-h-screen pt-[60px] md:pt-[100px] lg:pt-[140px] bg-white overflow-x-hidden'>
      <Head>
        <title>Kapitan Sisig</title>
        <meta
          name='description'
          content='Experience authentic Filipino cuisine at Kapitan Sisig. Order now for the best sisig and Filipino dishes in town.'
        />
        <meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover' />
        <link rel='icon' href='/favicon.ico' />
        <meta name='theme-color' content='#FFFFFF' />
      </Head>
      <Header />
      <Main />
      <footer className='w-full text-center text-[0.95rem] text-black 600 py-4 border-t border-black/10 bg-brandGrey'>
        Copyright @ 2025 by Monkeys
      </footer>
      
      <Loader />
      <ScrollUp />
    </div>
  )
}
