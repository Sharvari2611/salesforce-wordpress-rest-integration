// dotenv reads your .env file and loads all values into process.env
// This MUST be the very first line — before anything else tries to use process.env
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const app     = express();

// ── What is middleware in Express? ───────────────────────────────────────────
// app.use() registers middleware — code that runs on EVERY request before
// it reaches your route handler. Think of it as a security checkpoint
// at the entrance — every request passes through it first.

// cors() solves the browser's Same-Origin Policy problem
// Your HTML form runs on port 5500, Node runs on port 3000
// The browser treats these as DIFFERENT origins and blocks the request by default
// cors() tells Express to add headers that say "yes, I accept requests from these origins"
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3000'
    ]
}));

// express.json() reads the raw request body and parses it as JSON
// Without this, req.body in your route would be undefined
// Your HTML form sends data as JSON — this middleware unwraps it
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
// Instead of putting all logic in server.js, we split it into route files
// This keeps the code clean and organised — server.js just connects the pieces
// Any request to /submit gets handed off to routes/submit.js
const submitRoute = require('./routes/submit');
app.use('/submit', submitRoute);

// ── Health check ──────────────────────────────────────────────────────────────
// A simple GET route to confirm the server is running
// Open http://localhost:3000 in your browser to test this
app.get('/', (req, res) => {
    res.json({
        status:  'running',
        message: 'Community Connect Foundation — Middleware is live ✅',
        endpoint: 'POST http://localhost:3000/submit'
    });
});

// ── Start server ──────────────────────────────────────────────────────────────
// process.env.PORT reads from your .env file
// || 3000 is a fallback — if PORT is not set in .env, default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Middleware running on http://localhost:${PORT}`);
    console.log(`📋 Submit endpoint ready: POST http://localhost:${PORT}/submit`);
    console.log(`🔑 Using Salesforce login: ${process.env.SF_LOGIN_URL}`);
});