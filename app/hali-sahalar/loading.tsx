export default function LoadingAstroturfsPage() {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-3xl font-bold md:text-4xl">Astroturfs</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-4 h-48 animate-pulse rounded-xl bg-gray-200" />
                <div className="mb-2 h-6 w-32 animate-pulse rounded bg-gray-200" />
                <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="mb-4 h-4 w-40 animate-pulse rounded bg-gray-200" />
                <div className="h-10 w-28 animate-pulse rounded-xl bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }