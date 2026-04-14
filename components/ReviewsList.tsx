import { getIntlLocale, t, type Locale } from '@/lib/locale'
import StarRating from './StarRating'

type Review = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user_profiles: { username: string | null } | null
}

type Props = {
  reviews: Review[]
  locale: Locale
}

function avgRating(reviews: Review[]) {
  if (reviews.length === 0) return 0
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
}

export default function ReviewsList({ reviews, locale }: Props) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t(locale, 'No reviews yet. Be the first to leave one after your visit!', 'Henüz yorum yok. Ziyaretinden sonra ilk yorumu sen birak!')}
      </p>
    )
  }

  const avg = avgRating(reviews)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">
          {avg.toFixed(1)}
        </span>
        <div>
          <StarRating value={Math.round(avg)} size="md" />
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {locale === 'tr'
              ? `${reviews.length} yorum`
              : `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {reviews.map((review) => {
          const displayName = review.user_profiles?.username ?? t(locale, 'Anonymous', 'Anonim')
          const date = new Date(review.created_at).toLocaleDateString(getIntlLocale(locale), {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })

          return (
            <div
              key={review.id}
              className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{date}</p>
                </div>
                <StarRating value={review.rating} size="sm" />
              </div>
              {review.comment && (
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {review.comment}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
