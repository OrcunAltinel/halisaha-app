import FootballLoader from '@/components/FootballLoader'

export default function LoadingAstroturfsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <FootballLoader message="Finding pitches near you…" />
      </div>
    </main>
  )
}
