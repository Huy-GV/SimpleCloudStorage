# SIMPLE CLOUD STORAGE

## Overview

## Build and Run Locally
### Pre-requisites
- Install Node.js
- Install dependencies of the frontend and backend:
    ```bash
    cd /dir/containing/backend/or/frontend/apps
    npm install
    ```

### Frontend
- Set up environment file `.env` in `/frontend/:
    ```env
    REACT_APP_SERVER_URL=http://localhost:3000/
    ```
- Start the frontend:
    ```bash
    cd /dir/containing/frontend
    npm run dev
    ```

### Backend
- Set up environment file `dev.env` in `/backend/src`:
    ```env
    JWT_SECRET=YOUR_32_CHARACTER_SECRET
    ```
- Set up environment file `.env` for Prisma in `/backend/src/data/models/`
    ```env
    DATABASE_URL="file:./dev.db"
    ```

- Start the backend:
    ```bash
    cd /dir/containing/frontend
    # development
    npm run start

    # watch mode
    npm run start:dev

    # production mode
    npm run start:prod
    ```
