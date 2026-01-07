'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserId, checkAdmin } from '@/lib/api'
import NavigationBar from '@/components/NavigationBar'

interface User {
  id: string
  username: string
  is_admin?: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [making, setMaking] = useState<string | null>(null)
  const [banning, setBanning] = useState<string | null>(null)
  const [banReason, setBanReason] = useState<string>('')
  const [showBanModal, setShowBanModal] = useState<string | null>(null)
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
    async function fetchUsers() {
      if (!isAdmin) return

      try {
        setLoading(true)
        const response = await fetch('/api/admin/users')
        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        setUsers(data.data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [isAdmin])

  async function handleMakeAdmin(id: string) {
    setMaking(id)
    try {
      const userId = getUserId()
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: id, action: 'make_admin' }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      alert('User made admin successfully!')
      // Reload users to refresh the list
      const usersResponse = await fetch('/api/admin/users')
      const usersData = await usersResponse.json()
      if (!usersData.error) {
        setUsers(usersData.data || [])
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
      setError(err.message)
    } finally {
      setMaking(null)
    }
  }

  async function handleBanUser(id: string) {
    setBanning(id)
    try {
      const userId = getUserId()
      const response = await fetch('/api/admin/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: id, action: 'ban', reason: banReason, admin_id: userId }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      alert('User banned successfully!')
      setBanReason('')
      setShowBanModal(null)
      // Reload users to refresh the list
      const usersResponse = await fetch('/api/admin/users')
      const usersData = await usersResponse.json()
      if (!usersData.error) {
        setUsers(usersData.data || [])
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setBanning(null)
    }
  }

  return (
    <div className="relative min-h-screen bg-white">
      <NavigationBar />
      <div className="container mx-auto p-4 mt-24">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider border-b-2 border-gray-300">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider border-b-2 border-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider border-b-2 border-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y-2 divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-black">{user.username}</div>
                      <div className="text-xs text-gray-500">{user.id.substring(0, 12)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_admin ? (
                        <span className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded-full">
                          Admin
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-bold text-gray-700 bg-gray-300 rounded-full">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {!user.is_admin && (
                          <button
                            onClick={() => handleMakeAdmin(user.id)}
                            disabled={making === user.id}
                            className="text-sm font-medium text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {making === user.id ? 'Making Admin...' : 'Make Admin'}
                          </button>
                        )}
                        <button
                          onClick={() => setShowBanModal(user.id)}
                          disabled={banning === user.id}
                          className="text-sm font-medium text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {banning === user.id ? 'Banning...' : 'Ban'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {showBanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4" onClick={() => setShowBanModal(null)}>
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative border-2 border-gray-200" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowBanModal(null)}
                className="absolute top-4 right-4 text-black hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-xl font-bold mb-4 text-black">Ban User</h3>
              <p className="text-sm text-gray-700 mb-4">
                Are you sure you want to ban this user? They will not be able to submit or report hotspots.
              </p>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for ban (optional)"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md bg-white text-black mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBanModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded-md font-semibold border border-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showBanModal) {
                      handleBanUser(showBanModal)
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition-colors"
                >
                  Confirm Ban
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
