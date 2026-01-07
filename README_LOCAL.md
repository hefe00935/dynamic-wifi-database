# WiFi Map - Local Setup Guide

This version runs completely locally using SQLite - no Supabase or external database needed!

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database (Python Required)

Run the Python setup script:

```bash
python setup.py
```

This creates a local SQLite database in the `data/` folder.

### 3. Get Mapbox Token (Free)

1. Go to [mapbox.com](https://mapbox.com) and sign up (free)
2. Go to **Account** > **Access Tokens**
3. Copy your default public token

### 4. Create Environment File

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

That's it! No Supabase, no service keys, just one public API key.

### 5. Run the App

```bash
npm run dev
```

Visit **http://localhost:3000**

## Making Yourself Admin

After signing in with your email:

1. Get your user ID from browser localStorage (or check the database)
2. Run:

```bash
python setup.py add-admin YOUR_USER_ID
```

Or manually add to the database using any SQLite tool.

## Features

- ✅ **100% Local** - SQLite database, no external services
- ✅ **Simple Auth** - Just enter email, no passwords
- ✅ **Public API Only** - Only needs Mapbox token (free)
- ✅ **Easy Setup** - One Python script to initialize

## Database Location

The database is stored at: `data/wifi.db`

You can:
- View it with any SQLite browser
- Backup by copying the file
- Reset by deleting it and running `python setup.py` again

## Troubleshooting

**"Module not found: better-sqlite3"**
- Run `npm install` again

**"Database locked"**
- Make sure only one instance of the app is running
- Close any SQLite browsers viewing the database

**Map not loading**
- Check that `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set in `.env.local`
- Restart the dev server after creating `.env.local`

