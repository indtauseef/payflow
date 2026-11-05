# PayFlow — Full-Stack Digital Wallet Demo

PayFlow is a full-stack digital wallet application built for learning and demonstrating modern web development concepts. Users can create accounts, log in, manage demo wallet balances, add simulated money, and transfer demo funds between registered users.

**Note:** PayFlow is an educational demo project. It does not process real payments or handle real money.

## Features

- User registration and login
- Secure password hashing using bcrypt
- JWT-based authentication
- Wallet balance management
- Add simulated demo money
- Transfer demo funds between users
- Transaction history
- MySQL database integration
- Responsive React frontend

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite |
| Backend | Node.js, Express.js |
| Database | MySQL 8 |
| Authentication | JWT |
| Password Security | bcryptjs |
| Database Driver | mysql2 |
| API | REST API |

## Project Structure

```text
PayFlow_Full_Stack/
├── client/
│   └── src/
├── server/
│   ├── sql/
│   │   └── schema.sql
│   └── src/
│       ├── middleware/
│       ├── routes/
│       ├── db.js
│       ├── server.js
│       └── utils.js
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the project:

- Node.js and npm
- MySQL 8
- Git
- Visual Studio Code

## Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/payflow.git
cd payflow
```

### 2. Set up the MySQL database

Open MySQL and execute:

```sql
CREATE DATABASE payflow;
```

From the project root, import the database schema:

```powershell
Get-Content .\server\sql\schema.sql | mysql -u root -p payflow
```

### 3. Configure the backend

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Open `server/.env` and configure your local database:

```env
PORT=5000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=payflow
DB_SSL=false

JWT_SECRET=YOUR_LONG_RANDOM_SECRET
CLIENT_ORIGIN=http://localhost:5173
```

Replace the placeholders with your own local values. Never upload `.env` to GitHub.

Check the database connection:

```powershell
npm run db:check
```

Start the backend:

```powershell
npm run dev
```

Backend address: `http://localhost:5000`

### 4. Configure the frontend

Open a second terminal:

```powershell
cd client
npm install
npm run dev
```

Frontend address: `http://localhost:5173`

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | API health check |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/wallet` | Get wallet and transactions |
| POST | `/api/wallet/demo-deposit` | Add simulated funds |
| POST | `/api/wallet/transfer` | Transfer demo funds |

Authenticated endpoints require a JWT bearer token.

## Database Tables

- `users` — stores user account information and password hashes.
- `wallets` — stores wallet balances in integer paise.
- `wallet_transactions` — stores demo deposit and transfer records.

## Security and Limitations

- Passwords are hashed using bcryptjs.
- Authenticated API routes use JWT.
- SQL queries use parameterized placeholders.
- Transfers use database transactions.
- Demo funds are not real currency.

This project is not a production financial application. It does not integrate with banks, payment gateways, KYC, or regulated financial services.

## Future Improvements

- Unit and integration testing
- Improved input validation
- More detailed transaction filtering
- Automated test coverage
- Additional dashboard features

## Author

**Tauseef Ahmad**

GitHub: https://github.com/YOUR_GITHUB_USERNAME

---

If you find this project useful, feel free to explore the code and learn from it.