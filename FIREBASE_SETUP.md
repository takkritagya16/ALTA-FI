# Firebase Setup Guide for Phone OTP Authentication

This project uses Firebase for Phone Number Authentication. Since this involves security configurations in the Firebase Console, you need to perform the following steps manually.

## 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**.
3. Name your project (e.g., `alta-fi-app`).
4. Disable Google Analytics (optional, for simplicity) or keep it enabled.
5. Click **Create project**.

## 2. Register Your App
1. In the project overview page, click the **Web** icon (</>) to add a web app.
2. App nickname: `AltaAdmin`.
3. Uncheck "Also set up Firebase Hosting" (you can do this later).
4. Click **Register app**.
5. **Copy the `firebaseConfig` object keys**. You will need these for your environment variables.

## 3. Enable Phone Authentication
1. Go to **Build** > **Authentication** in the left sidebar.
2. Click **Get started**.
3. Select the **Sign-in method** tab.
4. Click **Phone**.
5. Toggle **Enable** to ON.
6. **IMPORTANT**: For testing, add a **Test phone number** in the "Phone numbers for testing" section.
   - Phone number: `+1 1234567890` (or usage your own dummy number)
   - Verification code: `123456`
   - *This allows you to test without using real SMS quota.*
7. **Real SMS & Billing (CRITICAL)**: 
   - To send SMS to **real** numbers (not test numbers), your Firebase project MUST be on the **Blaze Plan** (Pay as you go). 
   - The Spark Plan (Free) has extremely low or zero daily limits for SMS to prevent abuse.
   - If you see `auth/billing-not-enabled` or `auth/quota-exceeded`, this is why.
8. Click **Save**.

## 4. Configure Environment Variables
1. Rename `.env.example` to `.env` in the root of your project:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in the values from step 2.5:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## 5. Enable Firestore Database
1. Go to **Build** > **Firestore Database**.
2. Click **Create database**.
3. Select a location suitable for you.
4. Start in **Test mode** (for development) or **Production mode** (if you know how to configure rules).
5. Click **Create**.

## 6. Run the Application
1. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173`.
4. Navigate to Login and use your **Test Phone Number** and **Test Verification Code** to sign in.
