'use client'

import { useState, useEffect } from 'react'
import { fetchWifis, updateWiFiStatus, WiFi } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const [wifis, setWifis] = useState<WiFi[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const router = useRouter()

  const loadWifis = async () => {
    setLoading(true)
    try {
      const data = await fetchWifis(undefined, filter)
      setWifis(data)
    } catch (error) {
      console.error('Error fetching wifis:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWifis()
    
    // Poll for updates every 3 seconds
    const interval = setInterval(loadWifis, 3000)
    return () => clearInterval(interval)
  }, [filter])

  const handleStatusChange = async (wifiId: string, newStatus: 'approved' | 'rejected') => {
    setProcessing(wifiId)
    try {
      await updateWiFiStatus(wifiId, newStatus)
      loadWifis()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wifi_user_id')
      localStorage.removeItem('wifi_user_email')
    }
    router.push('/')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-200 text-black border-green-400'
      case 'rejected':
        return 'bg-red-200 text-black border-red-400'
      case 'pending':
        return 'bg-yellow-200 text-black border-yellow-400'
      default:
        return 'bg-gray-200 text-black border-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white shadow-md border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-black">Admin Dashboard</h1>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 border-2 border-gray-400 rounded-md bg-gray-100 hover:bg-gray-200 text-black font-semibold transition-colors"
              >
                View Map
              </button>
              <button
                onClick={() => router.push('/admin/reports')}
                className="px-4 py-2 border-2 border-gray-400 rounded-md bg-gray-100 hover:bg-gray-200 text-black font-semibold transition-colors"
              >
                View Reports
              </button>
              <button
                onClick={() => router.push('/admin/users')}
                className="px-4 py-2 border-2 border-gray-400 rounded-md bg-gray-100 hover:bg-gray-200 text-black font-semibold transition-colors"
              >
                Manage Users
              </button>
              <button
                onClick={() => router.push('/admin/bans')}
                className="px-4 py-2 border-2 border-gray-400 rounded-md bg-gray-100 hover:bg-gray-200 text-black font-semibold transition-colors"
              >
                Banned Users
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold shadow-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex gap-2">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md capitalize font-semibold border-2 transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                    : 'bg-white border-gray-400 text-black hover:bg-gray-100'
                }`}
              >
                {status} {status !== 'all' && `(${wifis.filter((w) => w.status === status).length})`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-gray-200">
            <div className="text-lg font-semibold text-black">Loading submissions...</div>
          </div>
        ) : wifis.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border-2 border-gray-200">
            <p className="text-black font-semibold">No submissions found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider border-b-2 border-gray-300">
                      Network Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider border-b-2 border-gray-300">
                      Password
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider border-b-2 border-gray-300">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider border-b-2 border-gray-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider border-b-2 border-gray-300">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider border-b-2 border-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y-2 divide-gray-200">
                  {wifis.map((wifi) => (
                    <tr key={wifi.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-black">{wifi.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black font-mono font-semibold">{wifi.password}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black font-medium">
                          {wifi.latitude.toFixed(6)}, {wifi.longitude.toFixed(6)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border-2 ${getStatusColor(
                            wifi.status
                          )}`}
                        >
                          {wifi.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-medium">
                        {new Date(wifi.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        {wifi.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusChange(wifi.id, 'approved')}
                              disabled={processing === wifi.id}
                              className="px-3 py-1 bg-green-200 hover:bg-green-300 text-black rounded border-2 border-green-400 disabled:opacity-50 transition-colors"
                            >
                              {processing === wifi.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleStatusChange(wifi.id, 'rejected')}
                              disabled={processing === wifi.id}
                              className="px-3 py-1 bg-red-200 hover:bg-red-300 text-black rounded border-2 border-red-400 disabled:opacity-50 transition-colors"
                            >
                              {processing === wifi.id ? 'Processing...' : 'Reject'}
                            </button>
                          </div>
                        )}
                        {wifi.status === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(wifi.id, 'rejected')}
                            disabled={processing === wifi.id}
                            className="px-3 py-1 bg-red-200 hover:bg-red-300 text-black rounded border-2 border-red-400 disabled:opacity-50 transition-colors"
                          >
                            {processing === wifi.id ? 'Processing...' : 'Reject'}
                          </button>
                        )}
                        {wifi.status === 'rejected' && (
                          <button
                            onClick={() => handleStatusChange(wifi.id, 'approved')}
                            disabled={processing === wifi.id}
                            className="px-3 py-1 bg-green-200 hover:bg-green-300 text-black rounded border-2 border-green-400 disabled:opacity-50 transition-colors"
                          >
                            {processing === wifi.id ? 'Processing...' : 'Approve'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

