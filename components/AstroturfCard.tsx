type Astroturf = {
    id: string
    name: string
    location_name?: string | null
    address: string
    description?: string | null
    price_per_hour: number
  }
  
  export default function AstroturfCard({ field }: { field: Astroturf }) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">
        <div className="mb-4 h-48 rounded-xl bg-gray-200" />
  
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">{field.name}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {field.location_name || 'Unknown location'}
            </p>
          </div>
  
          <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            Active
          </div>
        </div>
  
        <p className="mt-3 text-sm text-gray-600">{field.address}</p>
  
        {field.description && (
          <p className="mt-3 line-clamp-2 text-sm text-gray-500">{field.description}</p>
        )}
  
        <div className="mt-5 flex items-center justify-between">
          <p className="text-lg font-bold">{field.price_per_hour} TL</p>
  
          <button className="rounded-xl bg-black px-4 py-2 text-white transition hover:opacity-90">
            View details
          </button>
        </div>
      </div>
    )
  }