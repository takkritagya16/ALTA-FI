# Firebase Setup Guide

## Is it Free?
**YES.** You can use the **Spark Plan (Free Tier)** for almost everything we are building.
- **Authentication**: Free (Email/Pass unlimited, Phone 10k/month on Blaze but restricted on Spark).
- **Firestore Database**: Free up to:
  - 1 GiB total storage
  - 50,000 reads per day
  - 20,000 writes per day
  - 20,000 deletes per day
  *This is more than enough for personal use or a small startup.*

---

## 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**.
3. Name your project (e.g., `alta-fi-app`).
4. Disable Google Analytics (optional, for simplicity).
5. Click **Create project**.

## 2. Register Your App
1. In the project overview page, click the **Web** icon (</>) to add a web app.
2. App nickname: `AltaAdmin`.
3. Uncheck "Also set up Firebase Hosting".
4. Click **Register app**.
5. **Copy the `firebaseConfig` object keys**. You will need these for your environment variables.

## 3. Enable Authentication
1. Go to **Build** > **Authentication** > **Get Started**.
2. Select the **Sign-in method** tab.
3. **Email/Password**:
   - Click "Email/Password".
   - Toggle **Enable** to ON.
   - Click **Save**.
4. **Phone** (Optional/Deprecated for this build):
   - Only enable if you plan to upgrade to Blaze plan for real SMS.

## 4. Enable Firestore Database (Crucial Step)
1. Go to **Build** > **Firestore Database** in the left sidebar.
2. Click **Create database**.
3. **Location**: Select a location close to you (e.g., `nam5 (us-central)`).
4. **Security Rules**:
   - Select **Start in Test mode**.
   - *This allows read/write access for 30 days, which is perfect for development.*
   - *We will secure this later before "Production".*
5. Click **Create**.

## 5. Configure Environment Variables
1. Rename `.env.example` to `.env` in the root of your project (if not done):
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in the values from Step 2:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## 6. Create Composite Indexes (Required for Finance Feature)

The finance feature uses queries that require composite indexes. **You MUST create these indexes for the app to work properly.**

### Method 1: Use the Console Link (Recommended)
1. Run the application and try to load the Finance page.
2. Open your **browser's Developer Console** (F12 → Console tab).
3. If you see an error like `The query requires an index`, there will be a **clickable link** in the error message.
4. Click the link to be taken directly to the Firebase Console to create the index.
5. Click **Create index** and wait for it to build (usually 1-5 minutes).

### Method 2: Manual Creation
1. Go to **Firebase Console** → **Firestore Database** → **Indexes** tab.
2. Click **Add index** (under "Composite" tab).
3. Create the following indexes:

**Transactions Index:**
- Collection ID: `transactions`
- Fields:
  - `userId` (Ascending)
  - `date` (Descending)
- Query scope: Collection

**Rules Index (if needed):**
- Collection ID: `rules`
- Fields:
  - `userId` (Ascending)
  - `createdAt` (Descending)
- Query scope: Collection

4. Wait for the indexes to finish building (status changes from "Building" to "Enabled").

## 7. Run the Application
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm run dev
   ```

## 8. Troubleshooting

### Common Issues:

**1. "The query requires an index" Error**
- This means a composite index is missing. Follow the link in the error message to create it.
- Or manually create the indexes as described in Step 6.

**2. Transactions not loading**
- Check the browser console for errors.
- Verify that Firestore is properly enabled in your Firebase project.
- Make sure the composite indexes have finished building.

**3. Authentication Issues**
- Ensure Email/Password authentication is enabled in Firebase Console.
- Check that your `.env` file has the correct values.

**4. Environment Variables Not Working**
- Restart the dev server after changing `.env` file.
- Make sure all variables start with `VITE_` prefix.

