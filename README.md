# Learnsy

Learnsy is a distraction-free, YouTube-powered study platform designed for deep learning, habit-building, and knowledge retention. It transforms YouTube playlists into structured, streak-based study portals with bookmarking, notes, and real-time progress tracking.

---

## 🔍 Features

- 📺 **Import YouTube Playlists**  
  Use any public YouTube playlist to create a custom study course.

- ✅ **Video Progress Tracking**  
  Mark videos as completed, auto-track watched content, and resume seamlessly.

- 🧠 **Notes & Bookmarks**  
  Save notes for specific videos and bookmark important content for later review.

- 🔥 **Streak System**  
  GitHub-style streak heatmap to track consistent study behavior.

- 👨‍🎓 **Dashboard Overview**  
  Instant overview of total progress, active streaks, and course stats.

- 🌓 **Dark Mode (Black Theme)**  
  Built-in pure black theme for eye comfort and visual clarity.

- 🔐 **Google Authentication**  
  Secure login powered by Supabase with Google OAuth.

- ☁️ **Persistent Storage via Supabase**  
  All user data synced and saved to the cloud.

- 🧭 **Fully Responsive + Sidebar Navigation**  
  Mobile-friendly layout with collapsible sidebar for focused navigation.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Authentication**: Supabase Auth with Google OAuth
- **Video Source**: YouTube Data API v3
- **Deployment**: Netlify
- **Database**: PostgreSQL with Row Level Security

---

## 🚀 Quick Setup

### 1. Clone and Install
```bash
git clone <your-repo>
cd learnsy
npm install
```

### 2. Set up Supabase

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Get your project credentials** from the project dashboard
3. **Copy environment variables**:
   ```bash
   cp .env.example .env.local
   ```
4. **Fill in your Supabase credentials** in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Set up Google OAuth

1. **Go to Google Cloud Console** → APIs & Services → Credentials
2. **Create OAuth 2.0 Client ID** for web application
3. **Add authorized redirect URIs**:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-supabase-project.supabase.co/auth/v1/callback` (production)
4. **Configure in Supabase**:
   - Go to Authentication → Providers → Google
   - Enable Google provider
   - Add your Google Client ID and Secret

### 4. Set up YouTube API

1. **Go to Google Cloud Console** → APIs & Services
2. **Enable YouTube Data API v3**
3. **Create API Key** and add to `.env.local`:
   ```env
   YOUTUBE_API_KEY=your_youtube_api_key
   ```

### 5. Run Database Migrations

The database schema will be automatically created when you first connect to Supabase. The migration file is already included in the project.

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app!

---

## 📊 Database Schema

The app uses the following main tables:

- **courses** - Imported YouTube playlists
- **videos** - Individual videos from playlists
- **user_progress** - User's progress, notes, and bookmarks
- **streak_activity** - Daily learning activity tracking
- **video_timestamps** - Resume playback functionality

All tables have Row Level Security (RLS) enabled for data protection.

---

## 🚀 Deployment

### Deploy to Netlify

1. **Connect your repository** to Netlify
2. **Set environment variables** in Netlify dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   YOUTUBE_API_KEY=your_youtube_api_key
   ```
3. **Deploy** - Netlify will automatically build and deploy your app

### Update Supabase Auth Settings

After deployment, update your Supabase project:

1. **Go to Authentication → URL Configuration**
2. **Add your production URL** to Site URL and Redirect URLs:
   - Site URL: `https://your-app.netlify.app`
   - Redirect URLs: `https://your-app.netlify.app/auth/callback`

---

## 📂 Project Structure

```
/app
├── (dashboard)/          # Protected dashboard routes
│   ├── dashboard/        # Main dashboard
│   ├── courses/          # Course management
│   ├── study/[id]/[vid]/ # Video study interface
│   ├── bookmarks/        # Saved bookmarks
│   └── notes/            # User notes
├── actions/              # Server actions
└── globals.css           # Global styles

/components
├── ui/                   # Reusable UI components
├── auth-provider.tsx     # Authentication context
├── youtube-player.tsx    # Video player component
└── ...                   # Other components

/lib
├── supabase.ts          # Supabase client
├── database.ts          # Database service layer
└── youtube-server.ts    # YouTube API functions

/supabase
└── migrations/          # Database migrations
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | ✅ |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | ✅ |

### Features Configuration

- **Playlist Limit**: Users can import up to 4 playlists (configurable in `app/actions/youtube.ts`)
- **Auto-complete**: Videos auto-complete at 90% progress
- **Resume Playback**: Videos resume from last watched position
- **Streak Tracking**: Daily activity tracking with visual calendar

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 👤 Author

Made with ❤️ by **Alok Tripathi**

- GitHub: [@aloktripathi1](https://github.com/aloktripathi1)

---

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

---

## 🎯 Roadmap

- [ ] Video speed controls
- [ ] Offline mode support
- [ ] Course sharing
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] AI-powered study recommendations