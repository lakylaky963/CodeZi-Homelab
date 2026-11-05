# CodeZi

## Introduction

CodeZi is a full-stack application using MongoDB, Express.js, React.js, Node.js, and JavaScript.

The `main` branch contains a React project initialized with [Vite](https://vite.dev/) using [MUI](https://mui.com) and [TailwindCSS](https://tailwindcss.com/) for styling, plus an Express server connected to MongoDB.


<!-- Description about the app -->

## Requirements

- Node.js ([Installation](https://nodejs.org/en))
- MongoDB ([Community edition](https://www.mongodb.com/docs/manual/installation/))



## Setup

Install all dependencies for `client/` and `server/`.

In two separate terminals:

```
cd client
npm install
```

```
cd server
npm install
```

Create `.env` files in both `client/` and `server/`

```
root/
  client/
    .env
  server/
    .env
```

In `client/.env`, put:

```
NODE_ENV=development
REACT_APP_SERVER_URL=http://localhost:8080
```

In `server/.env`, put:

```
NODE_ENV=development
PORT=8080
MONGO_URI=mongodb:<link to your mongo database>
CLIENT_URL=http://localhost:5173
```

### Running client and server

In two separate terminals:

```
cd client
npm run dev
```

```
cd server
npm start
```

## Technologies

### Frontend

- [React.js](https://reactjs.org/)
  - [Vite](https://vite.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [MUI](https://mui.com)
- [Axios](https://axios-http.com/)

### Backend

- [MongoDB](https://www.mongodb.com/)
  - [Mongoose](https://mongoosejs.com/)
- [Express.js](https://expressjs.com/)

### Others

- [Babel](https://babeljs.io/) (Transpiler)
- [Eslint](https://eslint.org/) (Linter)

## Deploying (homelab)

Runs as two Docker containers on `webapp-server` (CT 100): `web` (Nginx serving the built client on port 80, proxying `/api` and `/socket.io` to the backend) and `backend` (Node 22).
Every push to `main` triggers `.github/workflows/deploy.yml` on the self-hosted runner, which syncs the code to `/var/www/html` and runs `docker compose up -d --build`.
Secrets live only in `/var/www/html/server/.env` on the server (see `server/.env.example`); the deploy never overwrites it.
The database is the shared MongoDB on `central-db-server` (10.0.0.230).
