'use client'

import { useState } from 'react'
import Image from 'next/image'

type ProductImageGalleryProps = {
  images: string[]
  productName: string
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const normalizedImages = images.filter((image) => Boolean(image))
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = normalizedImages[activeIndex]

  if (!activeImage) {
    return (
      <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center text-gray-400 font-mono text-sm uppercase tracking-widest">
        No image available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] bg-gray-50 border border-gray-100 overflow-hidden group">
        <Image
          src={activeImage}
          alt={productName}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {normalizedImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {normalizedImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-square overflow-hidden border transition-colors ${
                activeIndex === index ? 'border-black' : 'border-gray-100 hover:border-gray-300'
              }`}
              aria-label={`Show ${productName} image ${index + 1}`}
            >
              <Image src={image} alt={`${productName} ${index + 1}`} fill className="object-cover" sizes="(max-width: 768px) 25vw, 12vw" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
