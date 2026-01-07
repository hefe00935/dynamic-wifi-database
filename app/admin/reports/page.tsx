'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserId, checkAdmin } from '@/lib/api'
import NavigationBar from '@/components/NavigationBar'

interface Report {
  id: string
  wifi_id: string
  user_id: string | null
  reason: string
  resolved: number
  created_at: string
}

interface WiFi {
  id: string
  name: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [wifis, setWifis] = useState<Map<string, WiFi>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkPermissions() {
      const userId = getUserId()
      if (!userId) {
        router.push('/auth')
        return
      }

      const admin = await checkAdmin(userId)
      if (!admin) {
        router.push('/')
        return
      }
      setIsAdmin(true)
    }

    checkPermissions()
  }, [router])

  useEffect(() => {
    async function fetchReports() {
      if (!isAdmin) return

      try {
        setLoading(true)
        const response = await fetch('/api/admin/reports')
        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        const reportList = data.data || []
        setReports(reportList)
        
        // Fetch WiFi details for all reported IDs
        const wifiIds = Array.from(new Set(reportList.map((r: Report) => r.wifi_id)))
        const wifiMap = new Map<string, WiFi>()
        
        for (const id of wifiIds) {
          try {
            const wifiRes = await fetch(`/api/wifis?id=${id}`)
            const wifiData = await wifiRes.json()
            if (wifiData.data && wifiData.data.length > 0) {
              wifiMap.set(id as string, wifiData.data[0])
            }
          } catch (e) {
            console.error(`Error fetching WiFi ${id}:`, e)
          }
        }
        
        setWifis(wifiMap)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [isAdmin])

  async function handleResolve(id: string) {
    setResolving(id)
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: id, resolved: true }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setReports(reports.map(r => r.id === id ? { ...r, resolved: 1 } : r))
      alert('Report resolved!')
    } catch (err: any) {
      alert('Error resolving report: ' + err.message)
    } finally {
      setResolving(null)
    }
  }
  
  const unresolvedReports = reports.filter(r => !r.resolved)
  const resolvedReports = reports.filter(r => r.resolved)

  return (
    <div className="relative min-h-screen bg-white">
      <NavigationBar />
      <div className="container mx-auto p-4 mt-24">
        <h1 className="text-2xl font-bold mb-6">Reported WiFi Hotspots</h1>
        {loading && <p className="text-black">Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        
        {unresolvedReports.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-black">Unresolved Reports ({unresolvedReports.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unresolvedReports.map(report => {
                const wifi = wifis.get(report.wifi_id)
                return (
                  <div key={report.id} className="p-4 border-2 border-red-300 rounded bg-red-50">
                    <p className="font-bold text-black">{wifi?.name || 'Unknown WiFi'}</p>
                    <p className="text-xs text-gray-600">ID: {report.wifi_id.substring(0, 8)}...</p>
                    <p className="text-sm text-gray-700 mt-2">Reason: {report.reason}</p>
                    <p className="text-xs text-gray-600 mt-1">Reported: {new Date(report.created_at).toLocaleString()}</p>
                    <div className="mt-4">
                      <button
                        onClick={() => handleResolve(report.id)}
                        disabled={resolving === report.id}
                        className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-semibold transition-colors"
                      >
                        {resolving === report.id ? 'Resolving...' : 'Mark Resolved'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {resolvedReports.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4 text-gray-700">Resolved Reports ({resolvedReports.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resolvedReports.map(report => {
                const wifi = wifis.get(report.wifi_id)
                return (
                  <div key={report.id} className="p-4 border-2 border-gray-300 rounded bg-gray-50 opacity-75">
                    <p className="font-bold text-gray-600">{wifi?.name || 'Unknown WiFi'}</p>
                    <p className="text-xs text-gray-500">ID: {report.wifi_id.substring(0, 8)}...</p>
                    <p className="text-sm text-gray-700 mt-2">Reason: {report.reason}</p>
                    <p className="text-xs text-gray-600 mt-1">Resolved</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {reports.length === 0 && !loading && (
          <p className="text-center text-gray-600 py-8">No reports yet. Everything looks good!</p>
        )}
      </div>
    </div>
  )
}
