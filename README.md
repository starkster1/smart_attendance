# 🎓 Smart Attendance App  

A modern, secure, and efficient attendance tracking system built with React Native and Expo. This app leverages QR code scanning, GPS location verification, and Firebase Cloud Firestore to streamline student attendance management for academic institutions.

![App Banner](screenshots/banner.png)

## 📱 App Overview

The Smart Attendance App is designed to revolutionize how educational institutions manage student attendance. By combining QR code technology with location-based verification, it ensures accurate and secure attendance tracking while providing an intuitive experience for both lecturers and students.

### 🌟 Key Features

- **QR Code Scanning**: Quick and secure attendance marking
- **GPS Location Verification**: Ensures students are physically present
- **Real-time Data Sync**: Powered by Firebase Firestore
- **Role-based Access**: Separate interfaces for lecturers and students
- **Beautiful UI/UX**: Modern, intuitive design with smooth animations
- **Cross-platform**: Works on iOS, Android, and Web

## 🎯 How It Works

### For Lecturers 👨‍🏫

1. **Create Sessions**: Set up lecture sessions with course details, location, and timing
2. **Generate QR Codes**: Automatic QR code and PIN generation for each session
3. **Monitor Attendance**: Real-time tracking of student check-ins
4. **Manage Records**: View and export attendance history

![Lecturer Dashboard](screenshots/lecturer-dashboard.png)
*Lecturer dashboard showing active sessions*

![Create Session](screenshots/create-session.png)
*Session creation flow with step-by-step guidance*

![QR Code Display](screenshots/qr-display.png)
*QR code and PIN display for student check-ins*

### For Students 👨‍🎓

1. **Scan QR Code**: Use the built-in camera to scan lecturer's QR code
2. **Location Verification**: App verifies you're within the classroom radius
3. **Instant Check-in**: Attendance is recorded automatically
4. **View History**: Track your attendance records across all courses

![Student Home](screenshots/student-home.png)
*Student home screen with scan functionality*

![QR Scanner](screenshots/qr-scanner.png)
*QR code scanning interface*

![Attendance History](screenshots/attendance-history.png)
*Student attendance history view*

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smart-attendance-app.git
   cd smart-attendance-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase** (See [Firebase Setup](#firebase-setup) section below)

4. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   Fill in your Firebase configuration values in the `.env` file.

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on your preferred platform**
   - **Web**: Press `w` in the terminal or run `npm run web`
   - **iOS**: Press `i` in the terminal or run `npm run ios` (requires Xcode)
   - **Android**: Press `a` in the terminal or run `npm run android` (requires Android Studio)

## 🔥 Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `smart-attendance-app`
4. Enable Google Analytics (recommended)
5. Click "Create project"

### Step 2: Add Web App

1. In your Firebase project dashboard, click the Web icon (`</>`)
2. Register app with nickname: `Smart Attendance Web App`
3. Copy the configuration object

### Step 3: Enable Authentication

1. Go to Authentication → Sign-in method
2. Enable **Email/Password** authentication
3. Save the changes

### Step 4: Set up Firestore Database

1. Go to Firestore Database
2. Click "Create database"
3. Start in **test mode** (we'll secure it later)
4. Choose your preferred location

### Step 5: Configure Security Rules

Replace the default Firestore rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Only lecturers can create sessions
    match /sessions/{sessionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        resource.data.lecturerId == request.auth.uid;
      allow update: if request.auth != null && 
        resource.data.lecturerId == request.auth.uid;
    }
    
    // Attendance records
    match /attendance/{attendanceId} {
      allow read: if request.auth != null && 
        (resource.data.studentId == request.auth.uid || 
         resource.data.lecturerId == request.auth.uid);
      allow create: if request.auth != null && 
        resource.data.studentId == request.auth.uid;
    }
  }
}
```

### Step 6: Environment Configuration

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Replace the placeholder values with your actual Firebase configuration.

## 📱 App Screenshots

### Authentication Flow
![Splash Screen](screenshots/splash-screen.png)
*Beautiful animated splash screen*

![Login Screen](screenshots/login-screen.png)
*Elegant login interface with role selection*

![Signup Screen](screenshots/signup-screen.png)
*Comprehensive signup form with validation*

### Lecturer Features
![Lecturer Home](screenshots/lecturer-home.png)
*Lecturer dashboard with session management*

![Session Details](screenshots/session-details.png)
*Detailed session view with attendance tracking*

![Attendance List](screenshots/attendance-list.png)
*Real-time attendance monitoring*

### Student Features
![Student Dashboard](screenshots/student-dashboard.png)
*Student home with quick scan access*

![Camera Scanner](screenshots/camera-scanner.png)
*Professional QR code scanning interface*

![Check-in Success](screenshots/checkin-success.png)
*Successful attendance confirmation*

### Profile & Settings
![Profile Screen](screenshots/profile-screen.png)
*User profile with account information*

![Settings](screenshots/settings-screen.png)
*App settings and preferences*

## 🏗️ Project Structure

```
smart-attendance-app/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Home screen (role-based)
│   │   ├── history.tsx          # Attendance history
│   │   └── profile.tsx          # User profile
│   ├── auth/                    # Authentication screens
│   │   └── index.tsx            # Login/Signup
│   ├── lecturer/                # Lecturer-specific screens
│   │   ├── create-session.tsx   # Session creation
│   │   └── session/[id].tsx     # Session details
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Splash screen
├── components/                   # Reusable components
│   ├── LecturerHomeScreen.tsx   # Lecturer dashboard
│   ├── StudentHomeScreen.tsx    # Student dashboard
│   ├── QRCodeGenerator.tsx      # QR code display
│   ├── SessionCard.tsx          # Session list item
│   └── LoadingSpinner.tsx       # Loading indicator
├── services/                    # API services
│   ├── auth.ts                  # Authentication service
│   ├── attendance.ts            # Attendance management
│   └── location.ts              # Location services
├── contexts/                    # React contexts
│   └── AuthContext.tsx          # Authentication context
├── utils/                       # Utility functions
│   └── qr.ts                    # QR code utilities
├── types/                       # TypeScript definitions
│   └── index.ts                 # Type definitions
└── config/                      # Configuration files
    └── firebase.ts              # Firebase configuration
```

## 🔧 Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
- `npm run build:web` - Build for web deployment
- `npm run lint` - Run ESLint

## 🛡️ Security Features

- **Location Verification**: GPS-based proximity checking (100m radius)
- **Time-based Validation**: QR codes expire after session time
- **Firebase Security Rules**: Strict data access controls
- **Authentication Required**: All features require user authentication
- **Mock Location Detection**: Basic protection against location spoofing

## 🎨 Design Features

- **Modern UI/UX**: Clean, intuitive interface design
- **Smooth Animations**: React Native Reanimated for fluid interactions
- **Responsive Design**: Works across different screen sizes
- **Dark/Light Theme**: Automatic theme adaptation
- **Accessibility**: Screen reader and keyboard navigation support

## 🚀 Deployment

### Web Deployment

1. Build the web version:
   ```bash
   npm run build:web
   ```

2. Deploy the `dist` folder to your preferred hosting service (Netlify, Vercel, etc.)

### Mobile App Deployment

1. **Build for Production**:
   ```bash
   expo build:android
   expo build:ios
   ```

2. **Submit to App Stores**:
   - Follow [Expo's deployment guide](https://docs.expo.dev/distribution/introduction/)
   - Use EAS Build for modern deployment workflow

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/smart-attendance-app/issues) page
2. Create a new issue with detailed information
3. Join our [Discord community](https://discord.gg/your-invite) for real-time help

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [Firebase](https://firebase.google.com/) for backend services
- [Lucide](https://lucide.dev/) for beautiful icons
- [React Native](https://reactnative.dev/) for cross-platform development

## 📊 Project Status

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey)

---

**Made with ❤️ for the education community**

*Star ⭐ this repository if you found it helpful!*
