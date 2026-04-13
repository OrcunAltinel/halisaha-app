'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import ImageUploader from '@/components/ImageUploader'

type Location = {
  id: string
  name: string
}

export default function ListYourPitchPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [authLoading, setAuthLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [locations, setLocations] = useState<Location[]>([])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [locationId, setLocationId] = useState('')
  const [pricePerHour, setPricePerHour] = useState('')
  const [phone, setPhone] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Load auth + locations on mount
  useEffect(() => {
    let mounted = true

    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (!session?.user) {
        router.push('/login?redirect=/list-your-pitch')
        return
      }

      setUserId(session.user.id)

      const { data: locs, error: locErr } = await supabase
        .from('locations')
        .select('id, name')
        .order('name', { ascending: true })

      if (locErr) {
        console.error('[ListYourPitch] locations error:', locErr)
      }

      if (mounted) {
        setLocations(locs ?? [])
        setAuthLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [router, supabase])

  function validate(): string | null {
    if (name.trim().length < 3) return 'Pitch name must be at least 3 characters.'
    if (address.trim().length < 5) return 'Please provide a full address.'
    if (!locationId) return 'Please select a location.'
    const price = Number(pricePerHour)
    if (!pricePerHour || Number.isNaN(price) || price <= 0) {
      return 'Please enter a valid price per hour.'
    }
    if (imageUrls.length === 0) {
      return 'Please upload at least one photo of your pitch.'
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const validationError = validate()
    if (validationError) {
      setErrorMsg(validationError)
      return
    }

    if (!userId) {
      setErrorMsg('You must be signed in to submit an application.')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase.from('turf_applications').insert({
        user_id: userId,
        name: name.trim(),
        description: description.trim() || null,
        address: address.trim(),
        location_id: locationId,
        price_per_hour: Number(pricePerHour),
        phone: phone.trim() || null,
        image_urls: imageUrls,
      })

      if (error) {
        throw new Error(error.message)
      }

      setSuccessMsg(
        'Your application has been submitted. We will review it shortly.'
      )
      // Reset form
      setName('')
      setDescription('')
      setAddress('')
      setLocationId('')
      setPricePerHour('')
      setPhone('')
      setImageUrls([])

      // Redirect to my-applications after a short delay so the user sees the message
      setTimeout(() => {
        router.push('/my-applications')
      }, 1500)
    } catch (err) {
      console.error('[ListYourPitch] submit error:', err)
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Failed to submit application. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
            <p className="text-gray-600 dark:text-gray-400">Loading…</p>
          </div>
        </div>
      </main>
    )
  }

  const inputClass = "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-green-500 dark:focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-400"

  return (
    <main className="min-h-screen bg-gray-200 dark:bg-gray-950 px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            List your pitch
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Tell us about your astroturf and we will review your application.
            Approved pitches go live on the platform so players can book them
            directly.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800 sm:p-8"
        >
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
              Pitch name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mersin Spor Halı Saha"
              className={inputClass}
            />
          </div>

          {/* Location */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
              City / Area <span className="text-red-500">*</span>
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
              Full address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, neighborhood, landmarks…"
              className={inputClass}
            />
          </div>

          {/* Price */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
              Price per hour (₺) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
              placeholder="e.g. 500"
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
              Contact phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 ..."
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Optional. Shown to players who book your pitch.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-900 dark:text-white">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Surface type, facilities (showers, parking, lighting), any rules…"
              className={inputClass}
            />
          </div>

          {/* Images */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
              Photos <span className="text-red-500">*</span>
            </label>
            {userId && (
              <ImageUploader
                userId={userId}
                value={imageUrls}
                onChange={setImageUrls}
                maxImages={5}
                disabled={submitting}
              />
            )}
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800">
              {successMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 dark:border-gray-800 pt-4 sm:flex-row sm:justify-between">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-green-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}