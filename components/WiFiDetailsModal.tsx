'use client'

import { useState } from 'react'
import { WiFi, reportWiFi } from '@/lib/api'

interface WiFiDetailsModalProps {
  wifi: WiFi
  onClose: () => void
  onReport: () => void
  isFavorite?: boolean
  onToggleFavorite?: (id: string) => void
}

export default function WiFiDetailsModal({
  wifi,
  onClose,
  onReport,
  isFavorite = false,
  onToggleFavorite,
}: WiFiDetailsModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reporting, setReporting] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleReport = async () => {
    setReporting(true)
    try {
      await reportWiFi(wifi.id, wifi.reported_count || 0)
      alert('Thank you for reporting. We will review this hotspot.')
      onReport()
      onClose()
    } catch (error) {
      console.error('Error reporting wifi:', error)
      alert('Failed to report. Please try again.')
    } finally {
      setReporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative border-2 border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-4 pr-8 text-black">WiFi Details</h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            <span className="px-2 py-1 text-xs rounded border-2 border-gray-300 bg-gray-100 text-black font-semibold">
              Reports: {wifi.reported_count ?? 0}
            </span>
            {wifi.last_reported_at && (
              <span className="px-2 py-1 text-xs rounded border-2 border-gray-300 bg-gray-100 text-black font-semibold">
                Last: {new Date(wifi.last_reported_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Network Name (SSID)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={wifi.name}
                readOnly
                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-md bg-white text-black font-mono"
              />
              <button
                onClick={() => copyToClipboard(wifi.name)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded-md text-sm font-medium border border-gray-400 transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Password
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={wifi.password}
                readOnly
                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-md bg-white text-black font-mono"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded-md text-sm font-medium border border-gray-400 transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={() => copyToClipboard(wifi.password)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded-md text-sm font-medium border border-gray-400 transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Location
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${wifi.latitude.toFixed(6)}, ${wifi.longitude.toFixed(6)}`}
                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-md bg-white text-black font-mono"
              />
              <button
                onClick={() => copyToClipboard(`${wifi.latitude}, ${wifi.longitude}`)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded-md text-sm font-medium border border-gray-400 transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <a
                href={`https://www.google.com/maps?q=${wifi.latitude},${wifi.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-black rounded-md text-sm font-semibold border-2 border-blue-300 transition-colors"
              >
                Open in Maps
              </a>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-gray-300 flex gap-2">
            <button
              onClick={handleReport}
              disabled={reporting}
              className="flex-1 px-4 py-2 bg-red-200 hover:bg-red-300 text-black rounded-md text-sm font-semibold border-2 border-red-400 disabled:opacity-50 transition-colors"
            >
              {reporting ? 'Reporting...' : 'Report Incorrect Info'}
            </button>
            <button
              onClick={() => onToggleFavorite?.(wifi.id)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold border-2 transition-colors ${
                isFavorite
                  ? 'bg-yellow-200 hover:bg-yellow-300 text-black border-yellow-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-black border-gray-300'
              }`}
            >
              {isFavorite ? 'Favorited' : 'Add to Favorites'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold shadow-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

