<div align="center">
  <img src="images/logo.png" alt="SciBooker Logo" height="120">
  <h1>SciBooker</h1>
  <p>A streamlined, Gantt-style scheduling app for scientific instruments and multi-channel cyclers.</p>
</div>

---

## 📌 Overview
SciBooker is a fast, responsive, and mobile-friendly web application designed to help research labs manage shared equipment. It specializes in booking multi-channel instruments (like 64-channel battery cyclers) alongside standard single-use equipment (like microscopes or flow cytometers). 

## ✨ Key Features
- **Interactive Gantt Chart**: Visually browse bookings across multiple days and seamlessly click-and-drag to reserve instrument channels.
- **Multi-Channel Support**: Easily handle complex instruments with dozens of independent channels, each color-coded for visual clarity.
- **Maintenance Mode**: Admins can temporarily disable individual channels for maintenance, preventing users from making conflicting bookings.
- **Responsive Design**: Works flawlessly on desktop and mobile. Landscape mode on mobile automatically enters a "fullscreen" view to maximize calendar space.
- **Google Authentication**: Secure login via Firebase Auth (Google Provider).
- **Role-Based Access**: Separation of standard `users` and `admins`. Admins have exclusive access to manage users, instruments, and channels.

---

## 📖 How to Use (For Lab Members)

1. **Log In**: Click "Sign in with Google" to access the dashboard.
2. **Browse Instruments**: On the Dashboard, you'll see a list of all available instruments. Click **"View Calendar"** on any instrument to see its availability.
3. **Make a Booking**: 
   - Click any empty slot on the Gantt chart to initiate a booking for that specific time and channel.
   - Alternatively, click the **"New Booking"** button in the top right to manually select an instrument, channel, and time range.
4. **Manage Bookings**: Click the **"My Bookings"** tab in the sidebar to view, edit, or delete your upcoming reservations.

---

## 🛠️ How to Use (For Admins)

The **Admin Panel** provides tools for configuring the lab environment:

1. **Manage Users**:
   - The first time a user logs in, they are assigned standard `user` privileges.
   - Admins can edit any user's profile and elevate their role to `admin`.
2. **Manage Instruments & Channels**:
   - Add new instruments by providing a name and description.
   - Click **"Edit"** on any instrument to manage its channels.
   - You can quickly generate bulk channels by typing a prefix (e.g. `ch-`) and a count (e.g. `64`).
   - You can individually rename channels, delete them, or **check the "Disabled" box** to put a specific channel into maintenance mode. Disabled channels are greyed out and cannot be booked.

---

## 🚀 How to Deploy (For Developers)

SciBooker is built on plain HTML/CSS/JS (Vanilla) and uses **Firebase** as its backend (Firestore Database + Firebase Authentication).

### 1. Set Up Firebase
1. Create a new project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** (Start in production mode).
3. Enable **Authentication** and turn on the **Google** sign-in provider.
4. Register a Web App in Firebase to get your Firebase config object.

### 2. Configure the App
1. Clone this repository.
2. In the `js/` folder, create a new file named `firebase-config.js`.
3. Add your Firebase credentials to it:
   ```javascript
   export const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT.firebaseapp.com",
       projectId: "YOUR_PROJECT",
       storageBucket: "YOUR_PROJECT.appspot.com",
       messagingSenderId: "YOUR_ID",
       appId: "YOUR_APP_ID"
   };
   ```
   *(Note: `firebase-config.js` is included in `.gitignore` so your keys are not pushed to public repositories).*

### 3. Deploy to Firebase Hosting
1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Log in to Firebase: `firebase login`
3. Initialize the project: `firebase init hosting` (Select your existing Firebase project and use the current directory as the public root).
4. Deploy the app: `firebase deploy`

### 4. Create the First Admin
Since the app requires an Admin to manage settings, you must manually elevate your own account after your first login:
1. Open your live app and log in via Google.
2. Go to the **Firebase Console** -> **Firestore Database** -> `users` collection.
3. Find the document with your email address.
4. Change the `role` field from `"user"` to `"admin"`.
5. Refresh the app, and you will now see the Admin Panel!

---

## 🧪 Demo Mode (GitHub Pages)

SciBooker features a built-in mock mode designed for showcasing the UI without needing a real database. 

**[👉 Try the Live Demo Here!](https://jurgispil.github.io/scibooker/)**

If the app is accessed via a URL containing `github.io` (e.g. GitHub Pages), it automatically bypasses Firebase. It logs you in as a Mock User and populates the UI with dummy data. A floating **"Switch to User/Admin View"** button will appear in the bottom corner so visitors can safely test out the permissions of both roles.
