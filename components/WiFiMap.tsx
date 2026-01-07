'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { fetchWifis, WiFi } from '@/lib/api'
import WiFiDetailsModal from './WiFiDetailsModal'
import AddWiFiButton from './AddWiFiButton'
import AddWiFiModal from './AddWiFiModal'
import NavigationBar from './NavigationBar'
import { haversineDistanceKm } from '@/lib/utils'

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  const L = require('leaflet')
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  })
}

const DefaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function WiFiMap() {
  const [wifis, setWifis] = useState<WiFi[]>([])
  const [selectedWiFi, setSelectedWiFi] = useState<WiFi | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [center, setCenter] = useState<[number, number]>([40.7128, -74.0060])
  const [zoom, setZoom] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<'name' | 'distance' | 'reports'>('distance')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [tileStyle, setTileStyle] = useState<'osm' | 'topo' | 'dark'>('osm')
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null)
  const [searchInputRef] = useState<React.RefObject<HTMLInputElement>>(() => ({ current: null } as React.RefObject<HTMLInputElement>))

  const loadWifis = useCallback(async () => {
    try {
      const data = await fetchWifis('approved')
      setWifis(data)
      if (typeof window !== 'undefined') {
        localStorage.setItem('wifis_cache_approved', JSON.stringify(data))
      }
    } catch (error) {
      console.error('Error fetching wifis:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('wifis_cache_approved')
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as WiFi[]
          if (parsed?.length) {
            setWifis(parsed)
            setLoading(false)
          }
        } catch {}
      }
      const fav = localStorage.getItem('wifi_favorites')
      if (fav) {
        try {
          const ids = JSON.parse(fav) as string[]
          setFavorites(new Set(ids))
        } catch {}
      }
      const ts = localStorage.getItem('wifi_tile_style') as 'osm' | 'topo' | 'dark' | null
      if (ts) setTileStyle(ts)
    }
    loadWifis()
    
    // Poll for updates every 5 seconds
    let interval = setInterval(loadWifis, 5000)
    const onVisibility = () => {
      if (document.hidden) {
        clearInterval(interval)
      } else {
        interval = setInterval(loadWifis, 5000)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => clearInterval(interval)
  }, [loadWifis])

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude])
          setZoom(15)
        },
        () => {
          // Use default location if geolocation fails
        }
      )
    }
  }, [])

  const handleMarkerClick = (wifi: WiFi) => {
    setSelectedWiFi(wifi)
  }

  const handleMapClick = () => {
    setSelectedWiFi(null)
  }

  const handleAddClick = () => {
    setShowAddModal(true)
  }

  const handleAddSuccess = () => {
    setShowAddModal(false)
    loadWifis()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !showAddModal) {
        e.preventDefault()
        const el = searchInputRef.current as unknown as HTMLInputElement | null
        el?.focus()
      } else if (e.key.toLowerCase() === 'f') {
        setOnlyFavorites((v) => !v)
      } else if (e.key === 'Escape') {
        if (selectedWiFi) setSelectedWiFi(null)
        if (showAddModal) setShowAddModal(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchInputRef, showAddModal, selectedWiFi])

  const derivedWifis = useMemo(() => {
    let list = wifis
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((w) => w.name.toLowerCase().includes(q))
    }
    if (onlyFavorites) {
      list = list.filter((w) => favorites.has(w.id))
    }
    let withDistance = list.map((w) => ({
      ...w,
      _distanceKm: haversineDistanceKm(center[0], center[1], w.latitude, w.longitude),
      _reports: w.reported_count ?? 0,
    }))
    if (maxDistanceKm !== null) {
      withDistance = withDistance.filter((w) => w._distanceKm <= maxDistanceKm)
    }
    switch (sortOption) {
      case 'name':
        withDistance.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'reports':
        withDistance.sort((a, b) => b._reports - a._reports)
        break
      case 'distance':
      default:
        withDistance.sort((a, b) => a._distanceKm - b._distanceKm)
        break
    }
    return withDistance
  }, [wifis, searchQuery, sortOption, center, onlyFavorites, favorites, maxDistanceKm])

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (typeof window !== 'undefined') {
        localStorage.setItem('wifi_favorites', JSON.stringify(Array.from(next)))
      }
      return next
    })
  }

  const clusterSizeDeg = useMemo(() => {
    if (zoom <= 6) return 0.5
    if (zoom <= 8) return 0.2
    if (zoom <= 10) return 0.08
    if (zoom <= 12) return 0.03
    if (zoom <= 14) return 0.015
    return 0.008
  }, [zoom])

  const clusters = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number; items: WiFi[] }>()
    const round = (v: number) => Math.round(v / clusterSizeDeg) * clusterSizeDeg
    for (const w of derivedWifis) {
      const lat = round(w.latitude)
      const lng = round(w.longitude)
      const key = `${lat}:${lng}`
      const entry = map.get(key)
      if (!entry) {
        map.set(key, { lat, lng, items: [w] })
      } else {
        entry.items.push(w)
      }
    }
    return Array.from(map.values())
  }, [derivedWifis, clusterSizeDeg])

  function TileStyleControl() {
    const m = useMap()
    useEffect(() => {
      // noop: react-leaflet handles layer change via jsx
      return () => {}
    }, [m, tileStyle])
    return null
  }

  const tileUrl =
    tileStyle === 'osm'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : tileStyle === 'topo'
        ? 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-lg font-semibold text-black">Loading WiFi hotspots...</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <NavigationBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOption={sortOption}
        onSortChange={setSortOption}
        onlyFavorites={onlyFavorites}
        onToggleFavorites={setOnlyFavorites}
        searchInputRef={searchInputRef}
        maxDistanceKm={maxDistanceKm}
        onMaxDistanceKmChange={setMaxDistanceKm}
      />
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrl}
        />
        <TileStyleControl />
        <MapClickHandler onClick={handleMapClick} />
        
        {clusters.map((c) =>
          c.items.length === 1 ? (
            <Marker
              key={c.items[0].id}
              position={[c.items[0].latitude, c.items[0].longitude]}
              icon={DefaultIcon}
              eventHandlers={{
                click: () => handleMarkerClick(c.items[0]),
              }}
            >
              <Popup>
                <div className="p-3 bg-white">
                  <h3 className="font-bold text-sm mb-2 text-black">{c.items[0].name}</h3>
                  <button
                    onClick={() => {
                      setSelectedWiFi(c.items[0])
                    }}
                    className="text-blue-700 text-xs font-semibold hover:underline bg-blue-100 px-2 py-1 rounded border border-blue-300"
                  >
                    View Details
                  </button>
                  <div className="mt-2">
                    <button
                      onClick={() => toggleFavorite(c.items[0].id)}
                      className={`text-xs font-semibold px-2 py-1 rounded border ${
                        favorites.has(c.items[0].id)
                          ? 'bg-yellow-200 text-black border-yellow-400'
                          : 'bg-gray-100 text-black border-gray-300'
                      }`}
                    >
                      {favorites.has(c.items[0].id) ? 'Favorited' : 'Add to Favorites'}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : (
            <Marker
              key={`cluster-${c.lat}-${c.lng}`}
              position={[c.lat, c.lng]}
              icon={DefaultIcon}
              eventHandlers={{
                click: () => {
                  setCenter([c.lat, c.lng])
                  setZoom((z) => Math.min(z + 2, 18))
                },
              }}
            >
              <Popup>
                <div className="p-3 bg-white">
                  <h3 className="font-bold text-sm mb-2 text-black">
                    {c.items.length} hotspots in area
                  </h3>
                  <button
                    onClick={() => {
                      setCenter([c.lat, c.lng])
                      setZoom((z) => Math.min(z + 2, 18))
                    }}
                    className="text-blue-700 text-xs font-semibold hover:underline bg-blue-100 px-2 py-1 rounded border border-blue-300"
                  >
                    Zoom In
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        )}
      </MapContainer>

      <div className="absolute top-20 right-4 z-30 flex flex-col gap-2">
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((position) => {
                setCenter([position.coords.latitude, position.coords.longitude])
                setZoom(15)
              })
            }
          }}
          className="px-3 py-2 bg-white border-2 border-gray-300 rounded-md text-sm font-semibold shadow-sm"
        >
          Locate Me
        </button>
        <select
          value={tileStyle}
          onChange={(e) => {
            const val = e.target.value as 'osm' | 'topo' | 'dark'
            setTileStyle(val)
            if (typeof window !== 'undefined') {
              localStorage.setItem('wifi_tile_style', val)
            }
          }}
          className="px-3 py-2 bg-white border-2 border-gray-300 rounded-md text-sm font-semibold shadow-sm"
        >
          <option value="osm">OSM</option>
          <option value="topo">Topo</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {selectedWiFi && (
        <WiFiDetailsModal
          wifi={selectedWiFi}
          onClose={() => setSelectedWiFi(null)}
          onReport={() => {
            setSelectedWiFi(null)
            loadWifis()
          }}
          isFavorite={favorites.has(selectedWiFi.id)}
          onToggleFavorite={toggleFavorite}
        />
      )}

      <AddWiFiButton onClick={handleAddClick} />

      {showAddModal && (
        <AddWiFiModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          initialLocation={
            center ? { lat: center[0], lng: center[1] } : undefined
          }
        />
      )}
    </div>
  )
}
