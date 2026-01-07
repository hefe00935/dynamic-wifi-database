'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, signup } from '@/lib/api'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!username.trim()) {
        setError('Please enter your username')
        setLoading(false)
        return
      }

      if (!password.trim()) {
        setError('Please enter your password')
        setLoading(false)
        return
      }

      if (isSignUp) {
        await signup(username, password)
        router.push('/')
      } else {
        await login(username, password)
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-xl border-2 border-gray-200">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-black">
            {isSignUp ? 'Create Account' : 'Sign in to WiFi Map'}
          </h2>
          <p className="mt-2 text-center text-sm font-medium text-black">
            {isSignUp
              ? 'Enter a username and password to create your account'
              : 'Enter your credentials to sign in'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-black mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border-2 border-gray-300 placeholder-gray-400 bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-black mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border-2 border-gray-300 placeholder-gray-400 bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter password"
            />
            {isSignUp && (
              <p className="mt-1 text-xs text-gray-600">
                Password must be at least 6 characters
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-black px-4 py-3 rounded-md text-sm font-semibold">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-md transition-colors"
            >
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

