"use client"

import { useState } from "react"
import { MapPin, Phone, Mail, Share2 } from "lucide-react"
import KapImg1 from "../assets/images/KapImg1.jpg";
import KapImg2 from "../assets/images/KapImg2.jpg";
import KapImg3 from "../assets/images/KapImg3.jpg";
import Navbar from "../components/Navbar";
import "../styles/About.css"

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
    <div>
      <Navbar />
    <div className="about-page">
      
      <div className="container">
        <div className="Logo"></div>
        <h1 className="main-title">SERVED EVERY DAY SINCE 2022</h1>

        <hr className="divider" />
        <p className="paragraph">Kapitan Sisig started in a home kitchen in Toril in 2022, serving affordable, high-quality sisig through pre-orders.
        Growing through word-of-mouth and social media, it continues to bring delicious, home-cooked flavors to the community.</p>
        <hr className="divider" />
        <h2 className="contact">Contact Us</h2>
        <div className="contact-grid">
          {contactItems.map((item) => {
            const IconComponent = item.icon
            return (
              <div
                key={item.id}
                className="contact-item"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  transform: hoveredItem === item.id ? "scale(1.05)" : "scale(1)",
                }}
              >
                <IconComponent size={32} className="contact-icon" />
                <h3 className="contact-title">{item.title}</h3>
                <p className="contact-content">
                {Array.isArray(item.content)
                  ? item.content.map((line, index) => (
                      <span key={index}>
                        {line}
                        <br />
                      </span>
                    ))
                  : item.content}
              </p>
              </div>
            )
          })}
        </div>
        <hr className="divider" />
          <div className="image-gallery-container">
          <div className="image-2"><img src={KapImg2} alt="Kapitan Sisig Image2" className="kapimg2" /></div>
            <div className="image-1"><img src={KapImg1} alt="Kapitan Sisig Image1" className="kapimg1" /></div>
            <div className="image-3"><img src={KapImg3} alt="Kapitan Sisig Image3" className="kapimg3" /></div>
          </div>
      </div>
    </div>
    </div>
  )
}

export default About
