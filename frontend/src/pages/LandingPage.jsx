"use client"

import { useState } from "react"
import { MapPin, Phone, Mail, Clock, Star, ChefHat } from "lucide-react"
import Navbar from "../components/Navbar"

const LandingPage = () => {
  const [showMenu, setShowMenu] = useState(false)

  const menuItems = [
    { name: "Classic Sisig", price: "₱120", description: "Our signature crispy pork sisig with onions and chili" },
    { name: "Chicken Sisig", price: "₱110", description: "Tender chicken sisig with our special sauce" },
    { name: "Bangus Sisig", price: "₱130", description: "Fresh milkfish sisig with calamansi" },
    { name: "Tofu Sisig", price: "₱100", description: "Vegetarian-friendly tofu sisig option" },
    { name: "Sisig Rice Bowl", price: "₱150", description: "Complete meal with rice and egg" },
    { name: "Sisig Burrito", price: "₱140", description: "Sisig wrapped in soft tortilla" },
  ]

  const features = [
    {
      icon: ChefHat,
      title: "Authentic Recipe",
      description: "Traditional Filipino sisig made with love and authentic ingredients",
    },
    {
      icon: Clock,
      title: "Fresh Daily",
      description: "Prepared fresh every day using the finest local ingredients",
    },
    {
      icon: Star,
      title: "Community Favorite",
      description: "Loved by locals since 2022, growing through word-of-mouth",
    },
  ]

  return (
    <div>
    <Navbar />
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-900 to-red-900">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
            KAPITAN
            <span className="block text-amber-300">SISIG</span>
          </h1>
          <p className="text-xl md:text-2xl text-amber-100 mb-8 max-w-2xl mx-auto">
            {"Authentic Filipino sisig served fresh daily since 2022"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowMenu(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              View Menu
            </button>
            <a
              href="tel:+639688525779"
              className="bg-transparent border-2 border-amber-300 text-amber-300 hover:bg-amber-300 hover:text-black font-bold py-4 px-8 rounded-lg transition-all duration-300"
            >
              Order Now
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">Why Choose Kapitan Sisig?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div
                  key={index}
                  className="bg-black/20 backdrop-blur-sm rounded-xl border border-amber-700/30 p-8 text-center hover:bg-black/30 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconComponent size={40} className="text-amber-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-amber-100 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-20 px-4 bg-black/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Our Story</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-orange-400 mx-auto rounded-full mb-8"></div>
          <p className="text-xl text-amber-100 leading-relaxed mb-8">
            {
              "What started as a humble home kitchen operation in Toril has grown into a beloved community staple. Since 2022, we've been serving authentic, high-quality sisig that brings families and friends together around the dinner table."
            }
          </p>
          <p className="text-lg text-amber-200 leading-relaxed">
            {
              "Every dish is prepared with the same care and attention as if we were cooking for our own family. That's the Kapitan Sisig promise."
            }
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">Visit Us Today</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-amber-700/30 p-8 text-center">
              <MapPin size={40} className="text-amber-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Location</h3>
              <p className="text-amber-100">GDL Building, Toril, Davao City</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-amber-700/30 p-8 text-center">
              <Phone size={40} className="text-amber-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Call Us</h3>
              <a href="tel:+639688525779" className="text-amber-100 hover:text-amber-300 transition-colors">
                +63 968 852 5779
              </a>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-amber-700/30 p-8 text-center">
              <Mail size={40} className="text-amber-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Email</h3>
              <a
                href="mailto:officialkapitansisig@gmail.com"
                className="text-amber-100 hover:text-amber-300 transition-colors"
              >
                officialkapitansisig@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Modal */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-amber-700/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">Our Menu</h2>
                <button onClick={() => setShowMenu(false)} className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {menuItems.map((item, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-white">{item.name}</h3>
                      <span className="text-amber-300 font-bold text-lg">{item.price}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <a
                  href="tel:+639688525779"
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 px-8 rounded-lg transition-all duration-300 inline-block"
                >
                  Call to Order
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}

export default LandingPage
