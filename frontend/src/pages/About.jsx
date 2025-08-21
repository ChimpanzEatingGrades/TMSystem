"use client"

import { useState } from "react"
import { MapPin, Phone, Mail, Share2 } from "lucide-react"
import "./About.css"

const About = () => {
  const [hoveredItem, setHoveredItem] = useState(null)

  const contactItems = [
    {
      id: 1,
      icon: MapPin,
      title: "ADDRESS",
      content: "123 Food Street, Manila, Philippines",
    },
    {
      id: 2,
      icon: Phone,
      title: "CALL US",
      content: "+63 912 345 6789",
    },
    {
      id: 3,
      icon: Mail,
      title: "EMAIL",
      content: "hello@kapitansisig.com",
    },
    {
      id: 4,
      icon: Share2,
      title: "SOCIALS",
      content: "@kapitansisig",
    },
  ]

  return (
    <div className="about-page">
      <div className="container">
        <h1 className="main-title">ABOUT</h1>

        <hr className="divider" />

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
                <p className="contact-content">{item.content}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default About
