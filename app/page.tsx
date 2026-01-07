import dynamic from 'next/dynamic'

// Dynamically import the map component to avoid SSR issues with Leaflet
const WiFiMap = dynamic(() => import('@/components/WiFiMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-lg">Loading map...</div>
    </div>
  ),
})

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <WiFiMap />
    </main>
  )
}

