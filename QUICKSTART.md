# Quick Start - Zero Configuration

This app requires **ZERO configuration** - no API keys, no setup files, nothing!

## 3 Simple Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Database

```bash
python setup.py
```

### 3. Run the App

```bash
npm run dev
```

Visit **http://localhost:3000** - Done! 🎉

## That's It!

- ✅ No `.env.local` file needed
- ✅ No API keys required
- ✅ No external services
- ✅ Just works out of the box!

The app uses:
- **OpenStreetMap** for maps (free, no API keys)
- **SQLite** for database (local file)
- **Simple email auth** (no passwords, just localStorage)

## Making Yourself Admin

1. Sign in with your email at `/auth`
2. Open browser console (F12)
3. Run: `localStorage.getItem('wifi_user_id')`
4. Copy the user ID
5. Run: `python setup.py add-admin YOUR_USER_ID`

Now you can access `/admin` to moderate submissions!

## Troubleshooting

**"Module not found"**
- Run `npm install` again

**"Database locked"**
- Close any other instances of the app
- Close SQLite browsers viewing the database

**Map not showing**
- Check browser console for errors
- Make sure JavaScript is enabled
