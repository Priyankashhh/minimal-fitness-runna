# Minimal Fitness Tracker

A distraction-free, strictly black-and-white minimalist fitness tracking application built with **React Native (Expo)** and **Firebase**.

## 🚀 Features

* **Strictly Monochrome UI:** Designed to be sleek, beautiful, and completely distraction-free so you can focus purely on your workout.
* **Live GPS Tracking:** Uses actual foreground location tracking and Google Maps integration to physically draw your running/walking/cycling routes as a live polyline.
* **Real User Authentication:** Built-in Firebase Identity Platform with fully functional Email/Password signups.
* **Global Activity State:** Instantly calculates your active streaks and logs your workout history directly into your Profile as soon as you hit save.
* **Community & Clubs:** Dedicated segments for browsing preset Challenges and creating/joining customizable user Clubs.

## 🛠️ Tech Stack

* **Frontend:** Expo / React Native / React Navigation (`expo-router`)
* **Styling:** Custom StyleSheet objects prioritizing safe-area contexts and deep monochrome palettes.
* **Backend / Auth:** Firebase Web SDK (`firebase/auth`)

## 📱 How to Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/Priyankashhh/minimal-fitness-runna.git
   cd minimal-fitness-runna/frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the App**
   ```bash
   npx expo start
   ```

4. **Test the App**
   Scan the QR code with your phone's camera (iOS) or the Expo Go app (Android). Or press `w` in the terminal to open the web bundler preview.

## 📸 Screenshots

| Home (Map View) | Active Challenges |
| :---: | :---: |
| ![Home Screen](./screenshots/home.jpg) | ![Challenges Screen](./screenshots/challenges.jpg) |

| User Profile & History | Community Clubs |
| :---: | :---: |
| ![Profile Screen](./screenshots/profile.jpg) | ![Clubs Screen](./screenshots/clubs.jpg) |


---
*Built with simplicity in mind.*
