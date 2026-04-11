'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = {
  images: string[]
  alt: string
}

export default function TurfImageGallery({ images, alt }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const close = useCallback(() => setLightboxIndex(null), [])
  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length))
  }, [images.length])
  const prev = useCallback(() => {
    setLightboxIndex((i) =>
      i === null ? null : (i - 1 + images.length) % images.length
    )
  }, [images.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIndex, close, next, prev])

  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [lightboxIndex])

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-400 dark:text-gray-500">
        No photos available
      </div>
    )
  }

  const primary = images[0]
  const tiles = images.slice(1, 5)

  return (
    <>
      {/* Mobile: horizontal scroll strip */}
      <div className="block sm:hidden">
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-2xl">
          {images.map((url, idx) => (
            <button
              key={url}
              type="button"
              onClick={() => setLightboxIndex(idx)}
              className="aspect-[4/3] min-w-[85%] shrink-0 snap-center overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${alt} - photo ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          {images.length} {images.length === 1 ? 'photo' : 'photos'} — swipe to view
        </p>
      </div>

      {/* Desktop: collage grid */}
      <div className="hidden sm:block">
        <div
          className={`grid gap-2 overflow-hidden rounded-2xl ${tiles.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}
          style={{ aspectRatio: '16 / 9' }}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="group relative h-full w-full overflow-hidden bg-gray-100 dark:bg-gray-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={primary} alt={`${alt} - main photo`} className="h-full w-full object-cover transition group-hover:brightness-95" />
          </button>

          {tiles.length > 0 && (
            <div className={`grid gap-2 ${
              tiles.length === 1 ? 'grid-cols-1 grid-rows-1'
              : tiles.length === 2 ? 'grid-cols-1 grid-rows-2'
              : 'grid-cols-2 grid-rows-2'
            }`}>
              {tiles.map((url, idx) => {
                const actualIndex = idx + 1
                const isLastTile = idx === tiles.length - 1
                const hasMore = images.length > 5
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setLightboxIndex(actualIndex)}
                    className="group relative h-full w-full overflow-hidden bg-gray-100 dark:bg-gray-800"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`${alt} - photo ${actualIndex + 1}`} className="h-full w-full object-cover transition group-hover:brightness-95" />
                    {isLastTile && hasMore && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-base font-semibold text-white">
                        +{images.length - 5} more
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          View all {images.length} photos →
        </button>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                aria-label="Previous photo"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                aria-label="Next photo"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </>
          )}

          <div className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightboxIndex]}
              alt={`${alt} - photo ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-full object-contain"
            />
            <p className="mt-3 text-center text-sm text-white/70">
              {lightboxIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
