# SIMPLE DRIVE

## Overview
Simple file storage application allowing the user to store files in the cloud

## Features
Enables users to create folders, upload, change names of files, and download files or folders

### Technologies
- Languages: TypeScript, HTML, CSS
- Frameworks: Node.js, React, NestJS, Prisma
- Development Tools: AWS S3, SQLite

## Images


## Build and Run Locally
### Pre-requisites
- Install [Node.js](https://nodejs.org/en/download/current)
- Install dependencies by running this command in `/backend` and `/frontend`:
    ```bash
    npm install
    ```

### Frontend
- Set up environment file `.env` in `/frontend/:
    ```env
    NEXT_PUBLIC_SERVER_URL=http://localhost:5000
    ```
- Start the frontend:
    ```bash
    cd ./frontend
    npm run dev
    ```

### Backend
- Set up environment file `dev.env` in `/backend/src`:
    ```env
    JWT_SECRET=YOUR_32_CHARACTER_SECRET
    AWS_ACCESS_KEY=YOUR_AWS_ACCESS_KEY
    AWS_SECRET_KEY=YOUR_AWS_SECRET_KEY
    AWS_BUCKET=YOUR_AWS_BUCKET
    AWS_REGION=YOUR_AWS_REGION
    CLIENT_URLS=REACT_CLIENT_URL
    ```
- Set up environment file `.env` for Prisma in `/backend/src/data/models/`
    ```env
    DATABASE_URL="file:path/to/database/file.db"
    ```
- Start the backend:
    ```bash
    cd ./backend
    # development
    npm run start

    # watch mode
    npm run start:dev

    # production mode
    npm run start:prod
    ```
