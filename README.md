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

- **Frontend**: React, Tailwind CSS
- **State Management**: Local state + Supabase (post-auth)
- **Authentication**: Supabase with Google OAuth
- **Video Source**: YouTube Data API v3
- **Hosting**: Vercel

---

## 🚀 Deployment

The app is fully deployable on [Vercel](https://vercel.com), with environment variables for:
- `YOUTUBE_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

---

## 📂 Structure

```

/pages
└── index.tsx         // Home page
└── dashboard.tsx     // User dashboard
└── courses.tsx       // All imported playlists
└── study/\[pid]/\[vid] // Study interface
└── bookmarks.tsx     // Bookmarked videos
└── notes.tsx         // Saved notes

/components
└── Sidebar.tsx
└── VideoPlayer.tsx
└── StatsCard.tsx
└── PlaylistImporter.tsx
└── StreakCalendar.tsx

```

---

## 👤 Author

Made by **Alok Tripathi**  
[GitHub Profile](https://github.com/aloktripathi1)

---

## 📄 License

MIT License
```
