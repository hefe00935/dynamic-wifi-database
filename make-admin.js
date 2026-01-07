#!/usr/bin/env node

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(process.cwd(), 'data', 'wifi.db')

const db = new Database(dbPath)

try {
  // Add user to admin_users table
  const username = 'hefe0935'
  
  console.log('Checking user:', username)
  
  // Check if user exists
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (!user) {
    console.error('User not found:', username)
    process.exit(1)
  }
  
  const userId = user.id
  console.log('Found user:', userId)
  
  // Check if already admin
  const admin = db.prepare('SELECT user_id FROM admin_users WHERE user_id = ?').get(userId)
  if (admin) {
    console.log('User is already admin')
    process.exit(0)
  }
  
  console.log('Making user admin...')
  
  // Make user admin
  db.prepare('INSERT INTO admin_users (user_id) VALUES (?)').run(userId)
  console.log('User made admin successfully:', userId)
  process.exit(0)
} catch (error) {
  console.error('Error:', error.message)
  process.exit(1)
} finally {
  db.close()
}
