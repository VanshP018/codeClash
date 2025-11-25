# Authentication App - Full Stack

A complete authentication application with Node.js/Express backend and React frontend.

## Project Structure

```
codeClash/
├── server/          # Node.js Express backend
│   ├── models/      # MongoDB schemas (User)
│   ├── routes/      # API routes (auth)
│   ├── middleware/  # Authentication middleware
│   ├── index.js     # Server entry point
│   ├── package.json
│   └── .env         # Environment variables
└── client/          # React frontend
    ├── src/
    │   ├── components/  # Login, SignUp components
    │   ├── pages/       # Dashboard page
    │   ├── services/    # API service
    │   ├── App.js
    │   └── index.js
    ├── public/
    └── package.json
```

## Features

✅ User Registration (Sign Up)
✅ User Authentication (Login)
✅ JWT Token-based Authentication
✅ MongoDB Database Integration
✅ Password Hashing with bcryptjs
✅ Protected Routes
✅ User Dashboard
✅ Responsive UI

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (database URL already configured)

## Installation & Setup

### 1. Server Setup

```bash
cd server
npm install
```

The `.env` file is already configured with your MongoDB URL. You can optionally change `JWT_SECRET` for production.

### 2. Client Setup

```bash
cd client
npm install
```

## Running the Application

### Start the Server

```bash
cd server
npm run dev
```

The server will run on `http://localhost:5000`

### Start the Client (in a new terminal)

```bash
cd client
npm start
```

The client will run on `http://localhost:3000`

## API Endpoints

### Authentication Routes

- **POST** `/api/auth/signup` - Register a new user
  - Body: `{ username, email, password }`
  - Returns: `{ success, token, user }`

- **POST** `/api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ success, token, user }`

- **GET** `/api/auth/me` - Get current user (requires JWT token)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success, user }`

## How It Works

1. **Sign Up**: User enters username, email, and password. Password is hashed using bcryptjs before storing in MongoDB.

2. **Login**: User enters email and password. Password is verified against the hashed password in the database. If valid, a JWT token is issued.

3. **Token Storage**: JWT token is stored in browser's localStorage for future authenticated requests.

4. **Protected Routes**: The `/api/auth/me` endpoint requires a valid JWT token in the Authorization header.

5. **Dashboard**: After login, user sees their profile information on the dashboard.

6. **Logout**: Clears the token from localStorage.

## Technologies Used

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **React** - UI library
- **Axios** - HTTP client
- **CSS** - Styling

## Error Handling

- Invalid credentials return 401 Unauthorized
- Missing required fields return 400 Bad Request
- Duplicate username/email return 400 Bad Request
- Server errors return 500 Internal Server Error

## Security Notes

⚠️ **For Production:**
1. Change the `JWT_SECRET` in `.env` to a strong random string
2. Use HTTPS instead of HTTP
3. Add rate limiting to prevent brute force attacks
4. Implement refresh tokens for better security
5. Add email verification for signup
6. Use environment-specific configurations

## Troubleshooting

**Connection Error**: Make sure both server and client are running and MongoDB connection is active.

**CORS Error**: Server has CORS enabled. If issues persist, check that proxy in `package.json` is set correctly.

**Port Already in Use**: Change PORT in server `.env` file or stop the process using the port.

## Future Enhancements

- Email verification
- Password reset functionality
- OAuth integration (Google, GitHub)
- Refresh tokens
- Role-based access control
- Profile update functionality
