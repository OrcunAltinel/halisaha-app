import FootballLoader from '@/components/FootballLoader'

export default function Loading() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Reservations</h1>
          <p className="mt-2 text-gray-600">See all the slots you have booked.</p>
        </div>
        <FootballLoader message="Loading your reservations…" />
      </div>
    </main>
  )
}
