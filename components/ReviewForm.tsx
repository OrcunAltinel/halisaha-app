'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import StarRating from './StarRating'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/locale'

type Props = {
  reservationId: string
  astroturfId: string
  onSuccess: (rating: number, comment: string) => void
  onCancel: () => void
}

const supabase = createSupabaseBrowserClient()

export default function ReviewForm({ reservationId, astroturfId, onSuccess, onCancel }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { locale } = useLocale()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError(t(locale, 'Please select a star rating.', 'Lütfen bir yildiz puani seçin.'))
      return
    }
    setSubmitting(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError(t(locale, 'You must be logged in to leave a review.', 'Yorum bırakmak için giriş yapmalısınız.'))
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase.from('reviews').insert({
      reservation_id: reservationId,
      astroturf_id: astroturfId,
      user_id: user.id,
      rating,
      comment: comment.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    onSuccess(rating, comment.trim())
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 border-t dark:border-gray-700 pt-4 space-y-3"
    >
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{t(locale, 'Rate your experience', 'Deneyimini puanla')}</p>

      <StarRating value={rating} onChange={setRating} size="lg" />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t(locale, 'Share your experience (optional)', 'Deneyimini paylaş (isteğe bağlı)')}
        rows={3}
        maxLength={500}
        className="w-full rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="rounded-xl bg-black dark:bg-white px-5 py-2 text-sm font-semibold text-white dark:text-black disabled:opacity-40 hover:opacity-90 transition"
        >
          {submitting ? t(locale, 'Submitting…', 'Gönderiliyor…') : t(locale, 'Submit review', 'Yorumu gönder')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border dark:border-gray-700 px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          {t(locale, 'Cancel', 'İptal')}
        </button>
      </div>
    </form>
  )
}
