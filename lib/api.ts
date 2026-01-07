// API client for local database operations

export interface WiFi {
  id: string
  created_at: string
  name: string
  password: string
  latitude: number
  longitude: number
  status: 'pending' | 'approved' | 'rejected'
  user_id: string | null
  reported_count?: number
  last_reported_at?: string | null
  updated_at?: string
}

// Get user ID from localStorage
export function getUserId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem('userId')
}

// Set user ID in localStorage
export function setUserId(userId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userId', userId)
  }
}

// Clear user ID from localStorage
export function clearUserId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userId')
  }
}

export async function fetchWifis(status?: string, filter?: string): Promise<WiFi[]> {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (filter) params.set('filter', filter)
  
  const response = await fetch(`/api/wifis?${params.toString()}`)
  const result = await response.json()
  
  if (result.error) {
    throw new Error(result.error)
  }
  
  return result.data || []
}

export async function createWiFi(data: {
  name: string
  password: string
  latitude: number
  longitude: number
  user_id?: string | null
}): Promise<{ id: string }> {
  const response = await fetch('/api/wifis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (result.error) {
    throw new Error(result.error)
  }
  
  return result.data
}

export async function updateWiFiStatus(id: string, status: 'approved' | 'rejected'): Promise<WiFi> {
  const userId = getUserId()
  const response = await fetch(`/api/wifis/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, user_id: userId }),
  })
  
  const result = await response.json()
  
  if (result.error) {
    throw new Error(result.error)
  }
  
  return result.data
}

export async function reportWiFi(id: string, currentCount: number): Promise<void> {
  const userId = getUserId()
  try {
    const response = await fetch(`/api/wifis/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reported_count: currentCount + 1, reason: 'User report', user_id: userId }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    if (result.error) {
      throw new Error(result.error)
    }
  } catch (error: any) {
    console.error('Report error:', error)
    throw error
  }
}

export async function checkAdmin(userId: string): Promise<boolean> {
  const response = await fetch(`/api/admin/check?user_id=${userId}`)
  const result = await response.json()
  return result.isAdmin || false
}

export async function checkRateLimit(userId: string): Promise<{ canSubmit: boolean; count: number; max: number }> {
  const response = await fetch(`/api/rate-limit?user_id=${userId}`)
  const result = await response.json()
  return result
}

// Authentication functions
export async function signup(username: string, password: string): Promise<{ userId: string }> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  
  const result = await response.json()
  
  if (result.error) {
    throw new Error(result.error)
  }
  
  if (result.data?.userId) {
    setUserId(result.data.userId)
  }
  
  return result.data
}

export async function login(username: string, password: string): Promise<{ userId: string }> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  
  const result = await response.json()
  
  if (result.error) {
    throw new Error(result.error)
  }
  
  if (result.data?.userId) {
    setUserId(result.data.userId)
  }
  
  return result.data
}

export async function logout(): Promise<void> {
  clearUserId()
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}



