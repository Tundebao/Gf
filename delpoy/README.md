# Trading Platform cPanel Deployment Package

This package contains files to deploy the Trading Platform to a cPanel hosting environment.

## Package Contents

- `frontend/` - Frontend placeholder (needs to be replaced with a full build)
- `backend/` - Backend Node.js application files
- `mysql-schema.sql` - MySQL database schema

## Security Features

This deployment package includes the following security enhancements:

- **JWT Authentication**: Uses JSON Web Tokens for secure API and WebSocket authentication
- **Secure WebSocket Communication**: WebSocket connections require valid JWT tokens
- **Session Management**: Implements secure session handling for administrative access
- **Database Security**: Includes parameterized queries to prevent SQL injection

## Deployment Instructions

### 1. Set up MySQL Database

1. Log in to cPanel
2. Go to "MySQL Databases"
3. Create a new database (e.g. `trading_platform`)
4. Create a database user and assign a secure password
5. Add the user to the database with "ALL PRIVILEGES"
6. Go to phpMyAdmin, select your database
7. Click on the "Import" tab
8. Upload the `mysql-schema.sql` file and click "Go"

### 2. Deploy Backend

1. In cPanel, go to "Setup Node.js App"
2. Create a new application (e.g. `trading_platform`)
3. Set the application path (e.g. `/backend`)
4. Set Node.js version to at least 14.x
5. Upload all files from the `backend` folder to this directory
6. Create a `.env` file with the following content (adjust as needed):
   
   ```
   DB_HOST=localhost
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   SESSION_SECRET=random_secret_string
   JWT_SECRET=another_random_string
   ```

7. In the Node.js app section, set:
   - Application startup file: `server.js`
   - Application URL: your domain or subdomain
   - Application environment: production

8. Install dependencies:
   - SSH into your server or use the Terminal in cPanel
   - Navigate to your application directory
   - Run `npm install`

9. Start the application

### 3. Deploy Frontend

For the frontend, you need to run the full build process locally:

1. Clone the repository
2. Run `npm run build`
3. Upload all files from the `dist` or `build` directory to your `public_html` folder
4. Create or modify the `.htaccess` file in your `public_html` directory:

   ```
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     
     # Proxy API requests to Node.js
     RewriteRule ^api/(.*)$ http://localhost:YOUR_NODE_PORT/api/$1 [P,L]
     
     # Serve static assets
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule ^ index.html [L]
   </IfModule>
   ```
   
   Replace `YOUR_NODE_PORT` with the port assigned to your Node.js application

### Troubleshooting

- If you encounter database connection issues, verify your .env file settings
- Make sure your Node.js application has the correct permissions
- Check the Node.js application logs in cPanel
- For WebSocket connections, ensure your hosting supports WebSocket proxying

## WebSocket Integration

The platform includes real-time communication via WebSockets. To connect from the frontend:

1. After user login, obtain the JWT token from the login response
2. Connect to the WebSocket server with the token:
   
   ```javascript
   const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
   const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
   const socket = new WebSocket(wsUrl);
   ```

3. Send messages with proper type and payload:
   
   ```javascript
   socket.send(JSON.stringify({
     type: 'some_action',
     payload: { /* your data */ }
   }));
   ```

4. Handle incoming messages by type:
   
   ```javascript
   socket.onmessage = (event) => {
     const data = JSON.parse(event.data);
     switch(data.type) {
       case 'trade_update':
         // Handle trade update
         break;
       // Handle other message types
     }
   };
   ```

## Security Considerations

- Always use HTTPS for your production site
- Use strong, unique passwords for your database
- Regularly update dependencies for security patches
- Consider setting up a firewall and rate limiting
- Store JWT_SECRET as an environment variable, never hardcode it