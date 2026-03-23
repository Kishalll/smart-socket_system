# Smart Socket System

A full-stack electricity monitoring and violation management system for hostels.

## Features
- **Dashboard**: High-level overview of system stats.
- **Student Management**: Add, view, and delete students.
- **Room Management**: Add rooms and update capacities.
- **Socket Tracking**: Monitor sockets and their status.
- **Power Events**: Log electricity usage and auto-detect violations.
- **Violation Cases**: Track and manage unauthorized appliance usage.
- **Fine Management**: Issue fines to students for confirmed violations.
- **Reports**: Data-driven insights on violations and hotspot rooms.

## Tech Stack
- **Frontend**: Vanilla JavaScript (SPA architecture), CSS3 (Modern UI), HTML5.
- **Backend**: Node.js, Express.js.
- **Database**: MariaDB / MySQL.

## Setup Instructions

### 1. Database Setup
1. Open your MySQL/MariaDB terminal.
2. Run the script found in `database/schema.sql`:
   ```sql
   source database/schema.sql;
   ```
3. Ensure you have a user `appuser` with password `password` (or update `backend/db.js` with your credentials).

### 2. Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
   The backend will run on `http://localhost:3000`.

### 3. Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173` (or the port specified by Vite).

## Project Structure
- `backend/`: Express server and database connection.
- `frontend/`: Dashboard UI and client-side logic.
- `database/`: SQL schema definition.
