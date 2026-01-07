'use client'

import { useEffect, useState } from 'react'
import { getUserId, checkAdmin } from '@/lib/api'
import { useRouter } from 'next/navigation'
import AdminDashboard from '@/components/AdminDashboard'

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const userId = getUserId()

        if (!userId) {
          router.push('/auth')
          return
        }

        // Check if user is admin
        const admin = await checkAdmin(userId)
        setIsAdmin(admin)
      } catch (error) {
        console.error('Error:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return <AdminDashboard />
}

