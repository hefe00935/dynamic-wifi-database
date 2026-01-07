# Quick Setup Guide

This guide will help you get the WiFi Map application up and running quickly.

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned (takes a few minutes)
3. Go to **SQL Editor** in the Supabase dashboard
4. Copy and paste the entire contents of `supabase/schema.sql`
5. Click **Run** to execute the SQL

### 3. Get Supabase Credentials

1. In Supabase dashboard, go to **Project Settings** > **API**
2. Copy the following:
   - **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key** (this is your `SUPABASE_SERVICE_ROLE_KEY`) - Keep this secret!

### 4. Get Mapbox Token

1. Go to [mapbox.com](https://mapbox.com) and sign up/login
2. Go to **Account** > **Access Tokens**
3. Create a new token or use the default one
4. Make sure it has `styles:read` and `fonts:read` scopes
5. Copy the token

### 5. (Optional) Set Up hCaptcha

1. Go to [hcaptcha.com](https://www.hcaptcha.com/) and create an account
2. Create a new site
3. Copy the **Site Key** and **Secret Key**

### 6. Create Environment File

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Optional - hCaptcha
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-site-key
HCAPTCHA_SECRET_KEY=your-secret-key
```

### 7. Create Your First Admin User

1. Start the development server: `npm run dev`
2. Go to `http://localhost:3000/auth` and sign up with email/password
3. In Supabase dashboard, go to **Authentication** > **Users**
4. Find your user and copy the **User ID** (UUID)
5. Go to **SQL Editor** and run:

```sql
INSERT INTO admin_users (user_id) VALUES ('YOUR_USER_ID_HERE');
```

Replace `YOUR_USER_ID_HERE` with the actual UUID.

### 8. Test the Application

1. Visit `http://localhost:3000` - you should see the map
2. Sign in at `http://localhost:3000/auth`
3. Click the "+" button to add a WiFi hotspot
4. Go to `http://localhost:3000/admin` to approve submissions

## Troubleshooting

### Map not loading?
- Check that `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set correctly
- Check browser console for errors

### Can't sign in?
- Verify Supabase credentials are correct
- Check that email confirmation is disabled in Supabase (for development) or confirm your email

### Admin page shows "Access Denied"?
- Make sure you've added your user ID to the `admin_users` table
- Verify the user ID is correct (it's a UUID, not an email)

### Submissions not appearing?
- Check that you're viewing "approved" status in the admin dashboard
- Make sure you've approved the submission in the admin panel

## Next Steps

- Configure Google OAuth in Supabase for easier sign-in
- Set up hCaptcha for production spam protection
- Deploy to Vercel or your preferred hosting platform

