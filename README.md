# WiFi Map - Zero Configuration Setup

A production-ready, full-stack WiFi hotspot map application that runs **completely locally** with **zero configuration** - no API keys, no external services, just run and go!

## Features

- 🗺️ **Interactive Map**: Full-screen OpenStreetMap (free, no API keys needed)
- 📍 **WiFi Details**: Click pins to view SSID and password
- ➕ **Submission System**: Add new WiFi hotspots with location picker
- 🔒 **Admin Moderation**: Protected admin dashboard to approve/reject submissions
- 🛡️ **Spam Prevention**: Rate limiting (10 submissions per day)
- 📱 **Mobile Friendly**: Responsive design
- 🔐 **100% Local**: SQLite database, no external services

## Quick Start (3 Steps!)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

```bash
python setup.py
```

### 3. Run the App

```bash
npm run dev
```

Visit **http://localhost:3000** - That's it! 🎉

**No API keys needed. No configuration files. Just works!**

## Making Yourself Admin

After signing in with your email:

1. Open browser console (F12)
2. Run: `localStorage.getItem('wifi_user_id')` to get your user ID
3. Run: `python setup.py add-admin YOUR_USER_ID`

Or manually add to the database using any SQLite tool.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (local file)
- **Maps**: Leaflet + OpenStreetMap (free, no API keys)
- **Deployment**: Works anywhere Node.js runs

## Project Structure

```
wifi-database/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/             # Utilities and API client
├── data/            # SQLite database (created by setup.py)
├── setup.py         # Database initialization script
└── package.json     # Dependencies
```

## Database Location

The database is stored at: `data/wifi.db`

- View with any SQLite browser
- Backup by copying the file
- Reset by deleting it and running `python setup.py` again

## Features in Detail

### Rate Limiting
- Users can submit up to 10 WiFi hotspots per 24 hours
- Automatically resets after 24 hours

### Admin Dashboard
- Accessible at `/admin`
- View pending, approved, and rejected submissions
- Approve or reject submissions
- Real-time updates via polling

### Reporting System
- Users can report incorrect WiFi information
- Tracked in database for admin review

## Troubleshooting

**"Module not found: better-sqlite3"**
- Run `npm install` again

**"Database locked"**
- Make sure only one instance is running
- Close any SQLite browsers viewing the database

**Map not loading**
- Check browser console for errors
- Make sure JavaScript is enabled

## License

MIT License - feel free to use this project for your own purposes.
