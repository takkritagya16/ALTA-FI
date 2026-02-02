# ALTA-FI

A modern React + Vite application with Firebase Phone OTP Authentication, protected routes, and session persistence.

## Features

- ⚛️ **React 18** with **Vite** for blazing fast development
- 🔥 **Firebase Integration**
  - **Authentication**: Phone Number with OTP + reCAPTCHA (Invisible)
  - **Firestore**: Database service scaffolding
  - **Session Persistence**: User stays logged in across browser restarts (Local Persistence)
- 🎨 **Tailwind CSS v3** for styling
- 🛣️ **React Router v6**
  - Protected Routes (redirects unauthenticated users)
  - Auth-aware public routes (redirects logged-in users away from login)
- 📱 **Responsive Design**

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- A Firebase Project (see setup below)

### Installation

1. Clone the repository (if applicable) or navigate to the directory:
   ```bash
   cd alta-fi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup Firebase Configuration:
   - Follow the instructions in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
   - Create a `.env` file based on `.env.example`

4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/
│   ├── auth/           # ProtectedRoute.jsx
│   ├── layout/         # Header.jsx, Layout.jsx
│   └── ui/             # Reusable UI components
├── config/
│   └── firebase.js     # Firebase initialization & persistence config
├── contexts/
│   └── AuthContext.jsx # Global auth state management
├── hooks/
│   └── useAuth.js      # Hook to consume auth context
├── pages/
│   ├── Dashboard.jsx   # Protected page example
│   ├── Home.jsx        # Landing page
│   ├── Login.jsx       # Phone login & OTP verification
│   └── NotFound.jsx    # 404 page
├── services/
│   ├── auth.js         # Auth wrappers (sendOTP, verifyOTP, logout)
│   └── firestore.js    # Firestore CRUD helpers
├── App.jsx             # Routing configuration
└── main.jsx            # Entry point with Providers
```

## Authentication Flow

1. **User enters Phone Number**: The app uses `signInWithPhoneNumber` with an invisible reCAPTCHA.
2. **OTP Sent**: Firebase sends an SMS code (or use test numbers for dev).
3. **User enters OTP**: The app confirms the code using the `confirmationResult`.
4. **Session**: Upon success, Firebase sets a persistent LOCAL session.
5. **Access**: The user can now access routes wrapped in `<ProtectedRoute>`.

## License

MIT
