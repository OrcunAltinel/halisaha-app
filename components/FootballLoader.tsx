export default function FootballLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="relative flex flex-col items-center">
        <div className="animate-bounce text-5xl select-none">⚽</div>
        <div className="mt-1 h-2 w-8 rounded-full bg-gray-300 blur-sm animate-pulse" />
      </div>
      <p className="text-sm font-medium text-gray-400">{message}</p>
    </div>
  )
}
