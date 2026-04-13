'use client'

import { useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type Props = {
  userId: string
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  disabled?: boolean
}

const DEFAULT_MAX_IMAGES = 5
const BUCKET = 'turf-images'
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_MB = 15 // pre-compression limit; compression will shrink to ~1MB

export default function ImageUploader({
  userId,
  value,
  onChange,
  maxImages = DEFAULT_MAX_IMAGES,
  disabled = false,
}: Props) {
  const supabase = createSupabaseBrowserClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slotsLeft = maxImages - value.length
  const canAddMore = slotsLeft > 0 && !disabled

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    // Reset input so selecting the same file again still fires onChange
    if (inputRef.current) inputRef.current.value = ''

    if (files.length === 0) return

    setError(null)

    // Enforce total limit
    if (files.length > slotsLeft) {
      setError(
        `You can only add ${slotsLeft} more image${slotsLeft === 1 ? '' : 's'}.`
      )
      return
    }

    // Validate types and sizes up front
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a supported image type. Use JPEG, PNG, or WebP.`)
        return
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`"${file.name}" is too large. Max ${MAX_FILE_SIZE_MB}MB per file.`)
        return
      }
    }

    setUploading(true)

    try {
      const uploadedUrls: string[] = []

      for (const file of files) {
        // Compress: target ~1MB, max dimension 1600px, use web worker if available
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
          fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
        })

        // Build a unique path: {userId}/{timestamp}-{random}.{ext}
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`
        const path = `${userId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, compressed, {
            cacheControl: '3600',
            upsert: false,
            contentType: compressed.type,
          })

        if (uploadError) {
          throw new Error(`Failed to upload "${file.name}": ${uploadError.message}`)
        }

        const { data: publicUrlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(path)

        uploadedUrls.push(publicUrlData.publicUrl)
      }

      onChange([...value, ...uploadedUrls])
    } catch (err) {
      console.error('[ImageUploader] upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove(url: string) {
    // Remove from parent state immediately
    onChange(value.filter((u) => u !== url))

    // Best-effort delete from storage. We extract the path after the bucket name.
    // Public URL format: https://<project>.supabase.co/storage/v1/object/public/turf-images/<path>
    try {
      const marker = `/${BUCKET}/`
      const idx = url.indexOf(marker)
      if (idx === -1) return
      const path = url.slice(idx + marker.length)
      await supabase.storage.from(BUCKET).remove([path])
    } catch (err) {
      console.warn('[ImageUploader] storage delete failed (non-fatal):', err)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {value.map((url, idx) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Pitch photo"
              className="h-full w-full object-cover"
            />
            {idx === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                Thumbnail
              </span>
            )}
            <button
              type="button"
              onClick={() => handleRemove(url)}
              disabled={disabled}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
              aria-label="Remove image"
            >
              Remove
            </button>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <span className="text-xs font-medium">Uploading…</span>
            ) : (
              <>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-xs font-medium">Add photo</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {value.length}/{maxImages}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Up to {maxImages} photos. JPEG, PNG, or WebP. Images are automatically resized to keep upload sizes small.
        The first photo will be used as the thumbnail on the listings page.
      </p>
    </div>
  )
}