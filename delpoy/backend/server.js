/**
 * Trading Platform Backend Server
 * For cPanel deployment
 */
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

// JWT secret key (should match auth)
const JWT_SECRET = process.env.JWT_SECRET || "tradingplatformsecret";

// Database setup would normally go here
// This is a placeholder for the database connection
const db = {
  users: [],
  // Mock function to demonstrate database query
  async query(sql, params) {
    console.log('SQL Query:', sql, params);
    return { rows: [] };
  }
};

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // In a real app, this would query the database
    const user = { id, username: 'admin' };
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.get('/api/status', (req, res) => {
  res.json({ status: 'active', message: 'Trading Platform API is running' });
});

// Authentication routes
app.post('/api/login', (req, res) => {
  // This is a placeholder - real implementation would authenticate against database
  const userId = 1;
  const username = req.body.username || 'admin';
  
  // Create JWT token
  const token = jwt.sign(
    { id: userId, username },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
  
  res.json({ id: userId, username, token });
});

app.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.sendStatus(200);
  });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
const server = http.createServer(app);

// Set up WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

// Store connected clients with their authentication state
const clients = new Map();
let nextClientId = 1;

wss.on('connection', (ws, request) => {
  const clientId = `client-${nextClientId++}`;
  
  // Check for token in URL params
  let userId = null;
  let isAuthenticated = false;
  
  if (request.url) {
    const { query } = url.parse(request.url, true);
    if (query.token) {
      try {
        const decoded = jwt.verify(query.token, JWT_SECRET);
        if (decoded && decoded.id) {
          userId = decoded.id;
          isAuthenticated = true;
          console.log(`WebSocket client authenticated via URL: ${clientId}, userId: ${userId}`);
        }
      } catch (error) {
        console.error('Invalid token in WebSocket URL', error);
      }
    }
  }
  
  // Store client connection information
  clients.set(clientId, { 
    ws, 
    userId, 
    isAuthenticated 
  });
  
  console.log(`WebSocket client connected: ${clientId}`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle authentication message
      if (data.type === 'authenticate' && data.token) {
        try {
          const decoded = jwt.verify(data.token, JWT_SECRET);
          if (decoded && decoded.id) {
            const client = clients.get(clientId);
            if (client) {
              client.userId = decoded.id;
              client.isAuthenticated = true;
              console.log(`WebSocket client authenticated via message: ${clientId}, userId: ${decoded.id}`);
              
              // Send authentication confirmation
              ws.send(JSON.stringify({ 
                type: 'auth_success', 
                payload: { userId: decoded.id } 
              }));
              
              // Send initial state data after authentication
              sendInitialState(ws);
            }
          }
        } catch (error) {
          console.error('Invalid authentication token', error);
          ws.send(JSON.stringify({ 
            type: 'auth_error', 
            payload: { message: 'Invalid authentication token' } 
          }));
        }
        return;
      }
      
      // Process other message types
      console.log(`Received message from ${clientId}:`, data);
      
      // Echo the message back (for testing)
      ws.send(JSON.stringify({ 
        type: 'echo', 
        payload: data 
      }));
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log(`WebSocket client disconnected: ${clientId}`);
    clients.delete(clientId);
  });
  
  // Send welcome message
  ws.send(JSON.stringify({ 
    type: 'welcome', 
    payload: 'Connected to Trading Platform WebSocket' 
  }));
});

// Function to send initial state to a client
function sendInitialState(ws) {
  // This would normally pull data from the database
  const initialData = {
    accounts: [],
    copyRelationships: [],
    notifications: []
  };
  
  ws.send(JSON.stringify({
    type: 'initial_state',
    payload: initialData
  }));
}

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
