'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserId, checkAdmin } from '@/lib/api'
import NavigationBar from '@/components/NavigationBar'

interface BannedUser {
  id: string
  username: string
  reason: string
  banned_at: string
  banned_by: string | null
}

export default function BansPage() {
  const [banned, setBanned] = useState<BannedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [unbanning, setUnbanning] = useState<string | null>(null)
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
    async function fetchBanned() {
      if (!isAdmin) return

      try {
        setLoading(true)
        const response = await fetch('/api/admin/ban')
        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        setBanned(data.data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchBanned()
  }, [isAdmin])

  async function handleUnban(id: string) {
    setUnbanning(id)
    try {
      const response = await fetch('/api/admin/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: id, action: 'unban' }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      alert('User unbanned!')
      setBanned(banned.filter(b => b.id !== id))
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setUnbanning(null)
    }
  }

  return (
    <div className="relative min-h-screen bg-white">
      <NavigationBar />
      <div className="container mx-auto p-4 mt-24">
        <h1 className="text-2xl font-bold mb-6">Banned Users</h1>
        {loading && <p className="text-black">Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        
        {banned.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banned.map(user => (
              <div key={user.id} className="p-4 border-2 border-red-300 rounded bg-red-50">
                <p className="font-bold text-black">{user.username}</p>
                <p className="text-xs text-gray-600">ID: {user.id.substring(0, 12)}...</p>
                <p className="text-sm text-gray-700 mt-2">Reason: {user.reason}</p>
                <p className="text-xs text-gray-600 mt-1">Banned: {new Date(user.banned_at).toLocaleString()}</p>
                {user.banned_by && (
                  <p className="text-xs text-gray-600">By: {user.banned_by.substring(0, 8)}...</p>
                )}
                <div className="mt-4">
                  <button
                    onClick={() => handleUnban(user.id)}
                    disabled={unbanning === user.id}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-semibold transition-colors"
                  >
                    {unbanning === user.id ? 'Unbanning...' : 'Unban User'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-8">No banned users. All users are in good standing!</p>
        )}
      </div>
    </div>
  )
}
