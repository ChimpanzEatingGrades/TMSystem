"use client"


import KapImg1 from "../assets/images/KapImg1.jpg";
import KapImg2 from "../assets/images/KapImg2.jpg";
import KapImg3 from "../assets/images/KapImg3.jpg";
import Navbar from "../components/Navbar";

import { useState } from "react"
import { MapPin, Phone, Mail, Share2 } from "lucide-react"


const About = () => {
  const [hoveredItem, setHoveredItem] = useState(null)

  const contactItems = [
    {
      id: 1,
      icon: MapPin,
      title: "ADDRESS",
      content: "GDL Building, Toril, Davao City, 8000 Davao del Sur",
    },
    {
      id: 2,
      icon: Phone,
      title: "CALL US",
      content: "+63 968 852 5779",
    },
    {
      id: 3,
      icon: Mail,
      title: "EMAIL",
      content: "officialkapitansisig@gmail.com",
    },
    {
      id: 4,
      icon: Share2,
      title: "SOCIALS",
      content: ["www.instagram.com/kapitan_sisig", "www.facebook.com/p/Kapitan-Sisig-100088514343723/"],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4 tracking-tight">KAPITAN SISIG</h1>
            <div className="w-32 h-1 bg-[#FFC601] mx-auto rounded-full"></div>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-8">SERVED EVERY DAY SINCE 2022</h2>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-16 shadow-lg">
          <div className="w-24 h-1 bg-[#DD7373] mx-auto rounded-full mb-8"></div>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed text-center max-w-4xl mx-auto">
            Kapitan Sisig started in a home kitchen in Toril in 2022, serving affordable, high-quality sisig through
            pre-orders. Growing through word-of-mouth and social media, it continues to bring delicious, home-cooked
            flavors to the community.
          </p>
          <div className="w-24 h-1 bg-[#DD7373] mx-auto rounded-full mt-8"></div>
        </div>

        {/* Contact Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black text-center mb-12">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactItems.map((item) => {
              const IconComponent = item.icon
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="w-16 h-16 bg-[#FFC601] rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent size={32} className="text-black" />
                  </div>
                  <h3 className="text-lg font-semibold text-black mb-3">{item.title}</h3>
                  <div className="text-gray-600 text-sm leading-relaxed">
                    {Array.isArray(item.content) ? (
                      item.content.map((line, index) => (
                        <div key={index} className="mb-1">
                          <a
                            href={
                              line.includes("instagram")
                                ? `https://${line}`
                                : line.includes("facebook")
                                  ? `https://${line}`
                                  : "#"
                            }
                            className="hover:text-[#DD7373] transition-colors duration-200 break-all"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {line}
                          </a>
                        </div>
                      ))
                    ) : item.id === 2 ? (
                      <a href={`tel:${item.content}`} className="hover:text-[#DD7373] transition-colors duration-200">
                        {item.content}
                      </a>
                    ) : item.id === 3 ? (
                      <a
                        href={`mailto:${item.content}`}
                        className="hover:text-[#DD7373] transition-colors duration-200 break-all"
                      >
                        {item.content}
                      </a>
                    ) : (
                      item.content
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-16">
          <div className="w-24 h-1 bg-[#FFC601] mx-auto rounded-full mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative overflow-hidden rounded-xl aspect-square border border-gray-200">
              <img
                src={KapImg1}
                alt="Kapitan Sisig Restaurant Interior"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <p className="text-white p-4 font-semibold">Our Cozy Interior</p>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-xl aspect-square border border-gray-200">
              <img
                src={KapImg2}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <p className="text-white p-4 font-semibold">Signature Sisig</p>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-xl aspect-square border border-gray-200">
              <img
                src={KapImg3}
                alt="Variety of Filipino Dishes"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <p className="text-white p-4 font-semibold">More Delicious Options</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-br from-[#FFC601] to-yellow-400 rounded-2xl p-12 shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">Ready to Taste the Best Sisig in Town?</h2>
          <p className="text-xl text-gray-800 mb-8 max-w-2xl mx-auto">
            {"Visit us today or call ahead to place your order. We can't wait to serve you!"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+639688525779"
              className="bg-black hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center shadow-lg"
            >
              <Phone size={20} className="mr-2" />
              Call Now
            </a>
            <a
              href="mailto:officialkapitansisig@gmail.com"
              className="bg-white border-2 border-black text-black hover:bg-gray-100 font-bold py-4 px-8 rounded-lg transition-all duration-300 inline-flex items-center justify-center shadow-lg"
            >
              <Mail size={20} className="mr-2" />
              Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
