'use client'

type Props = {
  value: number
  onChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' }

export default function StarRating({ value, onChange, size = 'md' }: Props) {
  const interactive = !!onChange

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={`leading-none transition-transform ${sizeClass[size]} ${
            interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          } ${star <= value ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
