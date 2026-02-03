# ALTA-FI

A modern React + Vite personal finance application with Firebase Authentication, Firestore database, and Firebase Hosting.

## Features

- ⚛️ **React 19** with **Vite** for blazing fast development
- 🔥 **Firebase Integration**
  - **Authentication**: Email/Password + Phone OTP with reCAPTCHA
  - **Firestore**: Real-time NoSQL database
  - **Hosting**: Production-ready deployment
  - **Session Persistence**: User stays logged in across browser restarts
- 💰 **Finance Tracking**: Income, expenses, and transaction management
- 📈 **Investment Dashboard**: Stock tracking with real-time market data
- 📰 **Market News**: Curated financial news with sentiment analysis
- 🎨 **Tailwind CSS v3** for styling
- 🛣️ **React Router v7** with protected routes

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **Firebase Project** (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/alta-fi.git
   cd alta-fi
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your Firebase credentials (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)).

4. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## 🚀 Firebase Hosting Deployment

### First-Time Setup

1. **Install Firebase CLI globally**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```
   This will open a browser window for authentication.

3. **Verify project configuration**:
   The project is already configured with:
   - `firebase.json` - Hosting configuration
   - `.firebaserc` - Project ID mapping

### Deploy to Production

1. **Build the production bundle**:
   ```bash
   npm run build
   ```
   This creates an optimized `dist/` folder.

2. **Deploy to Firebase Hosting**:
   ```bash
   firebase deploy --only hosting
   ```

3. **Access your live site**:
   After deployment, your app will be available at:
   - **Primary**: https://alta-fi.web.app
   - **Alternate**: https://alta-fi.firebaseapp.com

### Quick Deploy (One Command)

For convenience, you can run both build and deploy together:
```bash
npm run build && firebase deploy --only hosting
```

### Deploy Preview (Optional)

Test your deployment before going live:
```bash
firebase hosting:channel:deploy preview
```
This creates a temporary preview URL without affecting production.

---

## Environment Configuration

### Development (`.env`)

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Stock Data API
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
```

### Production Environment

For production builds, Vite automatically injects environment variables at **build time**. This means:

1. **No runtime secrets**: All `VITE_*` variables are embedded in the built JS files
2. **Build before deploy**: Always run `npm run build` with the correct `.env` values
3. **Security note**: Firebase API keys are safe to expose (Firebase Security Rules protect your data)

---

## Project Structure

```
alta-fi/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── auth/           # ProtectedRoute.jsx
│   │   ├── finance/        # Transaction & chart components
│   │   ├── investments/    # Stock & news components
│   │   ├── layout/         # Header, Layout, Sidebar
│   │   └── ui/             # Reusable UI components
│   ├── config/
│   │   └── firebase.js     # Firebase initialization
│   ├── contexts/
│   │   └── AuthContext.jsx # Global auth state
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Route pages
│   ├── services/           # API & Firebase services
│   ├── App.jsx             # Routing configuration
│   └── main.jsx            # Entry point
├── .env                    # Environment variables (gitignored)
├── .env.example            # Environment template
├── .firebaserc             # Firebase project config
├── firebase.json           # Firebase Hosting config
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on `http://localhost:5173` |
| `npm run build` | Create production build in `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint checks |

---

## Troubleshooting

### Deployment Issues

**"Error: No project active"**
```bash
firebase use --add
# Select your project from the list
```

**"Permission denied"**
- Ensure you're logged in: `firebase login`
- Verify you have Owner/Editor access in Firebase Console

**"Cannot find module firebase-tools"**
```bash
npm install -g firebase-tools
```

### Build Issues

**Environment variables not working**
- Ensure variables start with `VITE_` prefix
- Restart dev server after changing `.env`
- Run fresh build: `npm run build`

**Blank page after deploy**
- Check browser console for errors
- Verify `firebase.json` has correct `rewrites` for SPA

---

## Security Best Practices

1. **Never commit `.env`** - It's already in `.gitignore`
2. **Use Firebase Security Rules** - Protect Firestore data
3. **Enable App Check** (optional) - Prevents API abuse
4. **Review authorized domains** - Firebase Console > Authentication > Settings

---

## License

MIT

---

## Links

- 📖 [Firebase Setup Guide](./FIREBASE_SETUP.md)
- 🔥 [Firebase Console](https://console.firebase.google.com/)
- 📚 [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- ⚡ [Vite Documentation](https://vitejs.dev/)
