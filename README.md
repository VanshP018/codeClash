⚔️ CodeClash — Real-Time 1v1 Coding Battle Platform

CodeClash is a real-time competitive coding platform where two players go head-to-head to solve coding problems faster than each other. Built for coders who love speed, logic, and competition.

🚀 Features

⚡ Real-Time Battles: Compete 1v1 in live coding duels.

🧩 Dynamic Problem Generation: Randomized questions by difficulty (Easy, Medium, Hard).

🧠 Code Execution Sandbox: Run and test solutions instantly in multiple languages.

💬 Live Match Updates: See your opponent’s progress in real time (without code leaking).

🏆 Scoring System: Points based on accuracy, efficiency, and speed.

👥 Matchmaking System: Automatically pairs players of similar skill levels.

🔒 Secure Backend: Safe user authentication and protected code execution environment.

🎨 Modern UI: Smooth and responsive frontend with a focus on user experience.

🧱 Tech Stack
Frontend

React.js

Tailwind CSS 

Socket.IO 

Backend

Node.js + Express

Socket.IO

MongoDB 

Code Execution



Hosting

Frontend: Vercel 

Backend: Render 

Database: MongoDB Atlas 

⚙️ Installation & Setup
# Clone the repository
git clone https://github.com/<your-username>/codeclash.git
cd codeclash

# Install dependencies
npm install

# For development mode
npm run dev

# For backend (if separate)
cd server
npm install
npm run dev


Make sure to configure environment variables before running the app.

🔐 Environment Variables

Create a .env file in your project root and add the following variables:

PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000

🧩 How It Works

Join a Battle Lobby → Players can create or join an available room.

Match Starts → A coding problem is displayed to both participants.

Code & Submit → Players write and submit their solutions in real time.

Judge & Score → Code is compiled, tested, and scored instantly.

Winner Declared → First to pass all test cases (or highest score) wins!

🧠 Future Enhancements

👑 Global leaderboard

🧾 Profile stats & history tracking

🤝 Team vs Team battles

💻 Integrated code editor themes

🌍 Multi-language support

🧩 AI-based problem difficulty adjustment

🧑‍💻 Contributing

Contributions are welcome!
If you’d like to improve CodeClash, feel free to:

Fork this repository

Create a feature branch (git checkout -b feature-name)

Commit your changes (git commit -m "Add feature")

Push and open a Pull Request
