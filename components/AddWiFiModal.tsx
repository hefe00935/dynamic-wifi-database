'use client'

import { useState, useEffect, useRef } from 'react'
import { createWiFi, checkRateLimit, getUserId } from '@/lib/api'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { Icon } from 'leaflet'
import HCaptcha from '@hcaptcha/react-hcaptcha'

const CustomMarkerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function LocationPicker({ 
  latitude, 
  longitude, 
  onLocationChange 
}: { 
  latitude: number
  longitude: number
  onLocationChange: (lat: number, lng: number) => void 
}) {
  useMapEvents({
    click: (e) => {
      onLocationChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface AddWiFiModalProps {
  onClose: () => void
  onSuccess: () => void
  initialLocation?: { lat: number; lng: number }
}

const MAX_SUBMISSIONS_PER_DAY = 10

export default function AddWiFiModal({
  onClose,
  onSuccess,
  initialLocation,
}: AddWiFiModalProps) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [latitude, setLatitude] = useState(initialLocation?.lat || 40.7128)
  const [longitude, setLongitude] = useState(initialLocation?.lng || -74.0060)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [rateLimitError, setRateLimitError] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState('')
  const captchaRef = useRef<HCaptcha>(null)
  const [rateInfo, setRateInfo] = useState<{ count: number; max: number } | null>(null)
  const [passwordScore, setPasswordScore] = useState(0)
  
  const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY

  useEffect(() => {
    if (useCurrentLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude)
          setLongitude(position.coords.longitude)
        },
        (err) => {
          console.error('Error getting location:', err)
          setError('Could not get your location. Please select on the map.')
        }
      )
    }
  }, [useCurrentLocation])

  useEffect(() => {
    const userId = getUserId()
    if (!userId) {
      setRateInfo(null)
      return
    }
    checkRateLimit(userId)
      .then((info) => setRateInfo({ count: info.count, max: info.max }))
      .catch(() => setRateInfo(null))
  }, [])

  useEffect(() => {
    const score =
      (password.length >= 8 ? 1 : 0) +
      (/[A-Z]/.test(password) ? 1 : 0) +
      (/[a-z]/.test(password) ? 1 : 0) +
      (/[0-9]/.test(password) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(password) ? 1 : 0)
    setPasswordScore(score)
  }, [password])

  const checkUserRateLimit = async (userId: string | null): Promise<boolean> => {
    if (!userId) return true // No user ID, allow submission
    
    try {
      const limit = await checkRateLimit(userId)
      if (!limit.canSubmit) {
        setRateLimitError(
          `You've reached the daily limit of ${limit.max} submissions. Please try again tomorrow.`
        )
        return false
      }
      return true
    } catch (err) {
      console.error('Error checking rate limit:', err)
      return true // Allow submission if check fails
    }
  }

  const verifyCaptcha = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Error verifying captcha:', error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setRateLimitError('')
    setCaptchaError('')

    if (!name.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }
    if (name.trim().length < 3) {
      setError('SSID must be at least 3 characters')
      return
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError('Invalid location coordinates')
      return
    }

    // Verify captcha if configured
    if (HCAPTCHA_SITE_KEY) {
      if (!captchaToken) {
        setCaptchaError('Please complete the captcha verification')
        return
      }

      const isValid = await verifyCaptcha(captchaToken)
      if (!isValid) {
        setCaptchaError('Captcha verification failed. Please try again.')
        captchaRef.current?.resetCaptcha()
        setCaptchaToken(null)
        return
      }
    }

    setSubmitting(true)

    try {
      // Get user ID (optional - can be null for anonymous submissions)
      const userId = getUserId()

      // Check rate limit if user is logged in
      const canSubmit = await checkUserRateLimit(userId)
      if (!canSubmit) {
        setSubmitting(false)
        return
      }

      // Create WiFi submission
      await createWiFi({
        name: name.trim(),
        password: password.trim(),
        latitude,
        longitude,
        user_id: userId,
      })

      // Reset captcha on success
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha()
      }
      setCaptchaToken(null)
      onSuccess()
    } catch (err: any) {
      console.error('Error submitting wifi:', err)
      setError(err.message || 'Failed to submit WiFi hotspot. Please try again.')
      // Reset captcha on error
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha()
      }
      setCaptchaToken(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-black">Add WiFi Hotspot</h2>
            <button
              onClick={onClose}
              className="text-black hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
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
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Network Name (SSID) *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., CoffeeShop_WiFi"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Password *
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter WiFi password"
              />
              <div className="mt-2 h-2 w-full bg-gray-200 rounded">
                <div
                  className={`h-2 rounded ${
                    passwordScore >= 4
                      ? 'bg-green-500'
                      : passwordScore >= 2
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${(passwordScore / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-black mt-1 font-medium">
                Strength: {passwordScore >= 4 ? 'Strong' : passwordScore >= 2 ? 'Medium' : 'Weak'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Location
              </label>
              <div className="mb-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useCurrentLocation}
                    onChange={(e) => setUseCurrentLocation(e.target.checked)}
                    className="rounded border-2 border-gray-400"
                  />
                  <span className="text-sm font-medium text-black">Use my current location</span>
                </label>
              </div>
              <div className="h-64 rounded-md overflow-hidden border border-gray-300">
                <MapContainer
                  center={[latitude, longitude]}
                  zoom={15}
                  style={{ width: '100%', height: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker
                    latitude={latitude}
                    longitude={longitude}
                    onLocationChange={(lat, lng) => {
                      setLatitude(lat)
                      setLongitude(lng)
                      setUseCurrentLocation(false)
                    }}
                  />
                  <Marker
                    position={[latitude, longitude]}
                    icon={CustomMarkerIcon}
                  />
                </MapContainer>
              </div>
              <p className="text-xs font-medium text-black mt-1">
                Click on the map to set the location, or use your current location
              </p>
            </div>

            {rateInfo && (
              <div className="px-3 py-2 bg-gray-100 border-2 border-gray-300 rounded-md text-sm font-semibold text-black">
                Submissions today: {rateInfo.count} / {rateInfo.max}
              </div>
            )}

            {HCAPTCHA_SITE_KEY && (
              <div>
                <HCaptcha
                  sitekey={HCAPTCHA_SITE_KEY}
                  onVerify={(token) => {
                    setCaptchaToken(token)
                    setCaptchaError('')
                  }}
                  onError={() => {
                    setCaptchaError('Captcha error. Please try again.')
                    setCaptchaToken(null)
                  }}
                  onExpire={() => {
                    setCaptchaToken(null)
                  }}
                  ref={captchaRef}
                />
                {captchaError && (
                  <p className="text-red-700 font-semibold text-sm mt-1 bg-red-100 px-2 py-1 rounded">{captchaError}</p>
                )}
              </div>
            )}

            {(error || rateLimitError) && (
              <div className="bg-red-100 border-2 border-red-400 text-black px-4 py-3 rounded-md text-sm font-semibold">
                {error || rateLimitError}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border-2 border-gray-400 rounded-md bg-gray-100 hover:bg-gray-200 text-black font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || (!!HCAPTCHA_SITE_KEY && !captchaToken)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold shadow-md disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
