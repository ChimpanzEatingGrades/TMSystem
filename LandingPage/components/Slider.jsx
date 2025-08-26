import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const CustomSlider = ({ children, settings = {}, className = '' }) => {
  const defaultSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: false,
    ...settings
  };

  return (
    <div className={`relative ${className}`}>
      <Slider {...defaultSettings}>
        {children}
      </Slider>
    </div>
  );
};

export default CustomSlider;
