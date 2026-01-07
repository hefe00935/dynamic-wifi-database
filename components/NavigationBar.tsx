'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserId, logout, checkAdmin } from '@/lib/api'

interface NavigationBarProps {
  searchQuery?: string
  onSearchChange?: (q: string) => void
  sortOption?: 'name' | 'distance' | 'reports'
  onSortChange?: (opt: 'name' | 'distance' | 'reports') => void
  onlyFavorites?: boolean
  onToggleFavorites?: (v: boolean) => void
  searchInputRef?: React.RefObject<HTMLInputElement>
  maxDistanceKm?: number | null
  onMaxDistanceKmChange?: (v: number | null) => void
}

export default function NavigationBar({
  searchQuery,
  onSearchChange,
  sortOption = 'distance',
  onSortChange,
  onlyFavorites = false,
  onToggleFavorites,
  searchInputRef,
  maxDistanceKm = null,
  onMaxDistanceKmChange,
}: NavigationBarProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const id = getUserId()
    setUserId(id)
    
    if (id) {
      checkAdmin(id).then(setIsAdmin).catch(() => setIsAdmin(false))
    }
  }, [])

  const handleSignOut = async () => {
    await logout()
    setUserId(null)
    setIsAdmin(false)
    router.push('/')
  }

  return (
    <nav className="absolute top-0 left-0 right-0 z-40 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-black">WiFi Map</h1>
            </div>
            <div className="flex items-center gap-4">
              {userId ? (
                <>
                  {isAdmin && (
                    <button
                      onClick={() => router.push('/admin')}
                      className="px-4 py-2 text-sm font-semibold text-black bg-blue-100 hover:bg-blue-200 rounded-md border border-blue-300 transition-colors"
                    >
                      Admin
                    </button>
                  )}
                  <span className="text-sm font-medium text-black">User ID: {userId.substring(0, 8)}</span>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm font-medium text-black bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push('/auth')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              value={searchQuery ?? ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search SSID..."
              ref={searchInputRef}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={sortOption}
              onChange={(e) => onSortChange?.(e.target.value as 'name' | 'distance' | 'reports')}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white text-black"
            >
              <option value="distance">Distance</option>
              <option value="name">Name</option>
              <option value="reports">Reports</option>
            </select>
            <label className="flex items-center gap-1 px-2 text-sm">
              <input
                type="checkbox"
                checked={onlyFavorites}
                onChange={(e) => onToggleFavorites?.(e.target.checked)}
                className="rounded border border-gray-400"
              />
              <span className="text-xs font-medium text-black">Favorites</span>
            </label>
            <label className="flex items-center gap-1 text-sm">
              <span className="text-xs font-semibold text-black">Max (km)</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={maxDistanceKm ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  onMaxDistanceKmChange?.(val === '' ? null : Math.max(0, Number(val)))
                }}
                placeholder="Any"
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md bg-white text-black"
              />
            </label>
            {maxDistanceKm !== null && (
              <button
                onClick={() => onMaxDistanceKmChange?.(null)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 text-black font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}


