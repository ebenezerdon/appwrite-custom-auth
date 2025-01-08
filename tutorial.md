# Building custom authentication flows with Appwrite

This tutorial will teach you how to implement custom authentication flows using Appwrite's custom tokens. You'll learn how to integrate external authentication systems with Appwrite's session management.

## What we'll build

We'll create a demo application that:

1. Simulates a third-party authentication system
2. Uses Appwrite's custom tokens for session management
3. Demonstrates a complete authentication flow

## Prerequisites

- Node.js installed on your machine
- Basic understanding of JavaScript/Node.js
- An Appwrite account and project set up

## Understanding custom tokens in Appwrite

### What are custom tokens?

Custom tokens in Appwrite are short-lived secrets that can be exchanged for sessions. They're useful when you want to:

- Integrate external authentication systems
- Implement custom authentication methods
- Skip Appwrite's built-in authentication

### Why use custom tokens?

1. **Integration with external systems**: You might have an existing auth system or want to use services like Auth0
2. **Custom authentication methods**: Implement unique auth flows like biometrics or hardware tokens
3. **Flexibility**: Complete control over the authentication process while using Appwrite's session management

## Project setup

1. First, create a new Vite project:

   ```bash
   npm create vite@latest appwrite-custom-auth -- --template vanilla
   cd appwrite-custom-auth
   ```

2. Install the required dependencies:

   ```bash
   npm install express cors dotenv appwrite node-appwrite
   ```

3. Create a `.env` file for configuration:

   ```env
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_BACKEND_URL=http://localhost:3002

   # Server-only variables
   APPWRITE_API_KEY=your_api_key
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your_project_id
   ```

## Building the backend

Let's build our backend step by step:

1. **Basic server setup**
   Create `server.js` and set up the basic Express server:

   ```javascript
   import express from 'express'
   import cors from 'cors'
   import dotenv from 'dotenv'

   // Load environment variables
   dotenv.config()

   const app = express()
   app.use(cors())
   app.use(express.json())

   const PORT = process.env.PORT || 3000

   app.listen(PORT, () => {
     console.log(`Server running on http://localhost:${PORT}`)
   })
   ```

   This sets up a basic Express server with CORS and JSON parsing.

2. **Appwrite integration**
   Add Appwrite client setup:

   ```javascript
   import { Client, Users } from 'node-appwrite'

   // Initialize Appwrite
   const client = new Client()
     .setEndpoint(process.env.APPWRITE_ENDPOINT)
     .setProject(process.env.APPWRITE_PROJECT_ID)
     .setKey(process.env.APPWRITE_API_KEY)

   const users = new Users(client)
   ```

   This initializes the Appwrite client with our configuration.

3. **Simulated user database**
   Add a simple in-memory user database for demonstration:

   ```javascript
   // Simulate a third-party auth database
   const thirdPartyUsers = {
     'demo@example.com': {
       password: 'demo1234',
       name: 'Demo User',
       id: 'external_123',
     },
   }
   ```

   In a real application, this would be your actual user database.

4. **Login endpoint**
   Create the login endpoint that generates custom tokens:

   ```javascript
   app.post('/auth/external/login', async (req, res) => {
     const { email, password } = req.body

     // Validate credentials
     const user = thirdPartyUsers[email]
     if (!user || user.password !== password) {
       return res.status(401).json({ message: 'Invalid credentials' })
     }

     try {
       // Create Appwrite token
       const token = await users.createToken(user.id)
       res.json({
         userId: user.id,
         secret: token.secret,
         name: user.name,
       })
     } catch (error) {
       res.status(500).json({ message: error.message })
     }
   })
   ```

   This endpoint:

   - Validates user credentials against our system
   - Creates an Appwrite token for the user
   - Returns the token secret and user info

## Building the frontend

Let's build the frontend piece by piece:

1. **Basic HTML structure**
   Create a simple login form in `index.html`:

   ```html
   <div class="container">
     <div id="loginForm">
       <h2>External Auth System</h2>
       <div class="form-group">
         <label for="email">Email:</label>
         <input type="email" id="email" required />
       </div>
       <div class="form-group">
         <label for="password">Password:</label>
         <input type="password" id="password" required />
       </div>
       <button id="loginButton">Login</button>
     </div>

     <div id="loggedInView" class="hidden">
       <h2>Welcome!</h2>
       <p id="userInfo"></p>
       <button id="logoutButton">Logout</button>
     </div>
   </div>
   ```

2. **Appwrite client setup**
   In `src/main.js`, initialize Appwrite:

   ```javascript
   import { Client, Account } from 'appwrite'

   const client = new Client()
     .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
     .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)

   const account = new Account(client)
   ```

3. **Authentication handler**
   Add the function to handle authentication:

   ```javascript
   async function handleExternalAuth(email, password) {
     try {
       // First, authenticate with external system
       const response = await fetch(
         `${import.meta.env.VITE_BACKEND_URL}/auth/external/login`,
         {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email, password }),
         },
       )

       const data = await response.json()
       if (!response.ok) throw new Error(data.message)

       // Create Appwrite session with custom token
       const session = await account.createSession(data.userId, data.secret)
       return session
     } catch (error) {
       throw new Error('Authentication failed: ' + error.message)
     }
   }
   ```

4. **Event handlers**
   Add click handlers for login and logout:

   ```javascript
   // Login handler
   document
     .getElementById('loginButton')
     .addEventListener('click', async () => {
       const email = document.getElementById('email').value
       const password = document.getElementById('password').value

       try {
         await handleExternalAuth(email, password)
         showLoggedInView()
       } catch (error) {
         alert(error.message)
       }
     })

   // Logout handler
   document
     .getElementById('logoutButton')
     .addEventListener('click', async () => {
       try {
         await account.deleteSession('current')
         showLoginView()
       } catch (error) {
         alert('Logout failed: ' + error.message)
       }
     })
   ```

5. **UI state management**
   Add functions to manage the UI state:

   ```javascript
   function showLoggedInView(user) {
     document.getElementById('loginForm').classList.add('hidden')
     document.getElementById('loggedInView').classList.remove('hidden')
     document.getElementById(
       'userInfo',
     ).textContent = `Logged in as: ${user.name}`
   }

   function showLoginView() {
     document.getElementById('loginForm').classList.remove('hidden')
     document.getElementById('loggedInView').classList.add('hidden')
   }
   ```

## Testing the flow

1. Start the backend:

   ```bash
   npm run server
   ```

2. Start the frontend:

   ```bash
   npm run dev
   ```

3. Test the login flow:
   - Email: `demo@example.com`
   - Password: `demo1234`

## Security considerations

1. **Token security**:

   - Tokens are short-lived by design
   - Never store tokens in localStorage
   - Use HTTPS for all communications

2. **Validation**:
   - Always validate users before creating tokens
   - Implement rate limiting
   - Log authentication attempts

## Next steps

1. Replace the simulated database with your actual auth system
2. Add proper error handling and logging
3. Implement rate limiting and security measures
4. Add user management features

## Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [Custom Authentication Guide](https://appwrite.io/docs/authentication)
- [Security Best Practices](https://appwrite.io/docs/security)
