import React, { useState } from 'react'

export default function ImageWithFallback({ src, alt='', className, style={}, placeholder='https://via.placeholder.com/150', ...props }){
  const [imgSrc, setImgSrc] = useState(src || placeholder)
  function onError(){
    if (imgSrc !== placeholder) setImgSrc(placeholder)
  }
  return (
    <img src={imgSrc} alt={alt} className={className} style={style} loading="lazy" onError={onError} {...props} />
  )
}

