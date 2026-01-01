# CareSync - Healthcare Appointment Management System

A full-stack healthcare appointment management application built with React and Node.js, featuring a 3-session treatment plan booking system.

##  Features

- **User Authentication**: Secure registration and login with Firebase Authentication
- **3-Session Treatment Plan**: Book appointments with automatic scheduling of 3 sessions (14 days apart)
- **Smart Date Selection**: Only allows booking on Tuesday, Wednesday, or Friday
- **Visual Calendar Indicators**: 
  - Red dates indicate all time slots are booked
  - Cascading dates (14 & 28 days later) are automatically marked unavailable
- **Appointment Management**:
  - View all appointments in dashboard
  - Reschedule individual sessions
  - Cancel individual sessions or entire treatment plan
  - Progress tracking (X/3 Completed)
- **Password Recovery**: OTP-based password reset via email
- **Duplicate Prevention**: Users cannot book multiple appointments simultaneously

##  Tech Stack

### Frontend
- **React** - UI library
- **Ant Design** - Component library
- **Firebase** - Authentication and Firestore database
- **React Router** - Navigation
- **Day.js** - Date manipulation

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Firebase Admin SDK** - Server-side Firebase operations
- **Nodemailer** - Email service for OTP
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project with Authentication and Firestore enabled
- Gmail account with App Password for email service

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/WorkforAdiii/healthcare-special-appointment.git
   cd healthcare-special-appointment
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Download service account key and save as `server/serviceAccountKey.json`
   - Copy Firebase config to `client/src/firebase/firebaseConfig.js`

4. **Environment Variables**
   
   Create `server/.env` file:
   ```env
   PORT=8080
   FIREBASE_SERVICE_ACCOUNT_BASE64=<base64_encoded_service_account_json>
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```
   
   To encode service account:
   ```bash
   # On Windows PowerShell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("serviceAccountKey.json"))
   ```

   Create `client/.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:8080
   ```

5. **Gmail App Password**
   - Go to Google Account settings
   - Enable 2-Step Verification
   - Generate App Password
   - Use this password in `EMAIL_PASS`

## 🚀 Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm start
   ```
   Server runs on `http://localhost:8080`

2. **Start the frontend**
   ```bash
   cd client
   npm start
   ```
   Frontend runs on `http://localhost:3000`

## 📁 Project Structure

```
healthcare-special-appointment/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── firebase/     # Firebase configuration
│   │   └── styles/        # CSS files
│   └── public/           # Static files
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── controllers/      # Business logic
│   ├── middlewares/       # Middleware functions
│   └── utils/            # Utility functions
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/send-otp` - Send OTP for password reset
- `POST /api/verify-otp` - Verify OTP
- `POST /api/update-password` - Update password after OTP verification

### Appointments
- `POST /api/book-appointment` - Book a 3-session treatment plan
- `GET /api/my-appointments` - Get user's appointments
- `DELETE /api/cancel-appointments` - Cancel all appointments
- `DELETE /api/cancel-appointment/:id` - Cancel a single appointment
- `POST /api/reschedule` - Reschedule appointments

## 🎯 Key Features Explained

### 3-Session Treatment Plan
When a user books an appointment:
- Session 1: Selected date
- Session 2: 14 days later (next allowed day)
- Session 3: 28 days later (next allowed day)

### Smart Date Availability
- Dates are marked red when all 3 time slots (09:00-10:00, 10:00-11:00, 11:00-12:00) are booked
- Cascading dates (14 & 28 days later) are automatically marked unavailable
- Only Tuesday, Wednesday, and Friday are available for booking

### Duplicate Prevention
- Users cannot book multiple appointments
- System checks for existing appointments before allowing new bookings
- Clear error messages guide users to cancel existing appointments first

## 🔒 Security Features

- Firebase Authentication for secure user management
- JWT token-based API authentication
- Environment variables for sensitive data
- Input validation on both client and server
- CORS configuration for secure API access

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**WorkforAdiii**
- GitHub: [@WorkforAdiii](https://github.com/WorkforAdiii)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## ⚠️ Important Notes

- Never commit `serviceAccountKey.json` or `.env` files
- Use App Passwords for Gmail, not regular passwords
- Ensure Firebase security rules are properly configured
- The OTP store is in-memory and will reset on server restart

## 🐛 Troubleshooting

**Email not sending?**
- Verify EMAIL_USER and EMAIL_PASS in .env
- Ensure Gmail App Password is used, not regular password
- Check server logs for transporter errors

**Firebase connection issues?**
- Verify serviceAccountKey.json is correctly placed
- Check FIREBASE_SERVICE_ACCOUNT_BASE64 encoding
- Ensure Firestore is enabled in Firebase Console

**CORS errors?**
- Verify REACT_APP_API_URL matches backend URL
- Check server CORS configuration

