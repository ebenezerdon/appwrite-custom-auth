# Building custom authentication flows with Appwrite

While Appwrite provides built-in authentication methods like email/password, OAuth, and Magic URL, there are scenarios where you need more flexibility. You might have an existing user database, a legacy authentication system that needs to be maintained, or specific security requirements that demand custom implementation.

Appwrite's custom authentication solves these challenges by allowing you to integrate your existing authentication system or third-party identity providers. You can validate users through your system while still taking advantage of Appwrite's session management and user features.

In this guide, you'll learn how to implement custom authentication flows using Appwrite's custom tokens. We'll cover validating users through an external system, generating custom tokens, creating secure sessions, and managing the complete authentication lifecycle.

## What we'll build

A simple authentication demo that:

1. Uses a simulated third-party authentication system
2. Integrates with Appwrite's custom token authentication
3. Provides a login/logout flow with session management

## Prerequisites

- Node.js installed on your machine
- An Appwrite account and project
- Basic understanding of JavaScript and web development

### Prerequisites check

Before starting, verify your setup:

1. Check Node.js installation:

   ```bash
   node --version
   ```

2. Create an Appwrite project:

   - Sign in to your [Appwrite Console](https://cloud.appwrite.io)
   - Create a new project or open an existing one
   - Note down your Project ID when creating a project. You can also find it in the Settings page.

3. Create an API key:

   - In your project's overview page, scroll down to "Integrations"
   - Click on "API Keys"
   - Click "Create API Key"
   - Enter a name for your key (e.g., "Custom Auth")
   - Set an expiry date (optional)
   - Click "Next"
   - Under "Scopes", select "Auth"
   - Click "Create"
   - Copy and save your API key securely. You'll need it in the next step.

## Project setup

1. Create a new Vite project. We'll use vanilla JavaScript for this tutorial:

```bash
npm create vite@latest . -- --template vanilla
```

2. Next, install the required dependencies. For this project, we need `appwrite`, `cors`, `dotenv`, and `express`:

```bash
npm install appwrite cors dotenv express node-appwrite
```

3. Create a `.env` file in the project root. This file will contain the Appwrite API key and other environment variables:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_BACKEND_URL=http://localhost:3000

# Server-only variables
APPWRITE_API_KEY=your_api_key
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
```

4. Update `package.json` to add the server script and set module type:

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "server": "node server.js",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## Backend implementation

First, let's create the authentication server that will validate users and generate Appwrite custom tokens. Create `server.js` in the project root and let's build it step by step.

1. First, import the required dependencies and load environment variables:

```javascript
import express from 'express'
import cors from 'cors'
import { Client, Users } from 'node-appwrite'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()
```

2. Add validation for required environment variables:

```javascript
// Validate required environment variables
const requiredEnvVars = [
  'APPWRITE_ENDPOINT',
  'APPWRITE_PROJECT_ID',
  'APPWRITE_API_KEY',
]
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}
```

This ensures that all necessary configuration is available before starting the server.

3. Set up the Express server with middleware:

```javascript
const app = express()
app.use(cors())
app.use(express.json())
```

4. Initialize the Appwrite client:

```javascript
// Initialize Appwrite
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const users = new Users(client)
```

5. Create a simulated user database (in a real app, this would be your actual database):

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

Note that while this simulation stores passwords as plain text for demonstration, real authentication systems use secure password hashing for security.
In a real-world scenario, you would integrate with an existing authentication system, a database, or another identity provider.

1. Implement the login endpoint that handles authentication:

```javascript
// Simulate third-party login
app.post('/auth/external/login', async (req, res) => {
  const { email, password } = req.body

  // Simulate external auth validation
  const user = thirdPartyUsers[email]
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  try {
    // Check if user exists in Appwrite
    try {
      await users.get(user.id)
    } catch {
      // User doesn't exist, create them
      await users.create(
        user.id,
        email,
        undefined, // phone
        undefined, // password can be undefined for custom auth
        user.name,
      )
    }

    // After validating with external system, create Appwrite token
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

- Validates user credentials against our simulated database
- Creates the user in Appwrite if they don't exist
- Generates a custom token for the user
- Returns the token and user information

7. Finally, start the server:

```javascript
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
```

8. Start the backend server:

```bash
npm run server
```

The server should now be running and ready to handle authentication requests.

## Frontend implementation

Now that our authentication server is running, let's create the user interface that will interact with it.

### HTML structure

First, let's set up the basic HTML structure and add some styles:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Appwrite Custom Auth Demo</title>
  </head>
  <body>
    <div class="container">
      <!-- Content will go here -->
    </div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

Next, add the CSS styles in the `<head>` section:

```html
<style>
  .container {
    max-width: 400px;
    margin: 50px auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
  }
  .form-group {
    margin-bottom: 15px;
  }
  input {
    width: 100%;
    padding: 8px;
    margin-top: 5px;
  }
  button {
    width: 100%;
    padding: 10px;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 10px;
  }
  .info {
    background: #f0f0f0;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 20px;
  }
  .hidden {
    display: none;
  }
</style>
```

These styles create a clean, centered layout with consistent form elements and a nice info box.

Now, let's add the info section that explains what the demo does:

```html
<div class="info">
  <h3>Custom Token Auth Demo</h3>
  <p>
    This demonstrates using Appwrite's custom token authentication with a
    simulated third-party auth system.
  </p>
  <p>Try: demo@example.com / demo1234</p>
</div>
```

Next, add the login form that will collect user credentials:

```html
<!-- External Login Form -->
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
  <button id="loginButton">Login with External System</button>
</div>
```

Finally, add the logged-in view that will be shown after successful authentication:

```html
<!-- Logged In View -->
<div id="loggedInView" class="hidden">
  <h2>Welcome!</h2>
  <p id="userInfo"></p>
  <button id="logoutButton">Logout</button>
</div>
```

### Frontend logic

Create `src/main.js` to handle the authentication logic. Let's break it down into parts:

1. First, initialize the Appwrite client:

```javascript
import { Client, Account } from 'appwrite'

// Initialize Appwrite
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)

const account = new Account(client)
```

2. Get references to DOM elements we'll need:

```javascript
// DOM Elements
const loginForm = document.getElementById('loginForm')
const loggedInView = document.getElementById('loggedInView')
const userInfo = document.getElementById('userInfo')
```

3. Create the main authentication function that handles the login flow:

```javascript
// Handle external auth and Appwrite session creation
async function handleExternalAuth(email, password) {
  try {
    // First, authenticate with external system
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/external/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      },
    )

    const data = await response.json()
    if (!response.ok) throw new Error(data.message)

    // Then create Appwrite session using the custom token
    const session = await account.createSession(data.userId, data.secret)

    // Show logged in state
    loginForm.classList.add('hidden')
    loggedInView.classList.remove('hidden')
    userInfo.textContent = `Logged in as: ${data.name}`

    return session
  } catch (error) {
    throw new Error('Authentication failed: ' + error.message)
  }
}
```

4. Add event listeners for login and logout:

```javascript
// Handle login button click
document.getElementById('loginButton').addEventListener('click', async () => {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  try {
    await handleExternalAuth(email, password)
  } catch (error) {
    alert(error.message)
  }
})

// Handle logout
document.getElementById('logoutButton').addEventListener('click', async () => {
  try {
    await account.deleteSession('current')
    loginForm.classList.remove('hidden')
    loggedInView.classList.add('hidden')
  } catch (error) {
    alert('Logout failed: ' + error.message)
  }
})
```

5. Finally, add session checking on page load:

```javascript
// Check auth status on load
async function checkAuth() {
  try {
    const session = await account.get()
    loginForm.classList.add('hidden')
    loggedInView.classList.remove('hidden')
    userInfo.textContent = `Logged in as: ${session.name}`
  } catch {
    loginForm.classList.remove('hidden')
    loggedInView.classList.add('hidden')
  }
}

checkAuth()
```

This function runs when the page loads and checks if there's an existing session. If there is, it shows the logged-in view; otherwise, it shows the login form.

## Running the application

1. Make sure the backend server is running:

```bash
npm run server
```

2. In a new terminal, start the frontend development server:

```bash
npm run dev
```

3. Open your browser and navigate to the URL shown by Vite (usually http://localhost:5173)

4. Try logging in with:
   - Email: demo@example.com
   - Password: demo1234

Note: The backend server will run on port 3000 by default, but you can change this by setting the PORT environment variable.

## How it works

1. When a user submits the login form, the frontend sends credentials to our backend server
2. The backend validates the credentials against its user database
3. If valid, the backend uses Appwrite's SDK to create a custom token for the user
4. The backend returns the token secret and user info to the frontend
5. The frontend uses the token to create an Appwrite session
6. The user is now authenticated and can access protected resources

## Next steps

1. Replace the simulated user database with your actual authentication system
2. Add proper error handling and validation
3. Add user registration functionality
4. Enhance the UI with loading states and better error messages

## Troubleshooting

Here are some common issues you might encounter and how to resolve them:

### Backend issues

- **Environment variables not found**: Make sure your `.env` file is in the project root and contains all required variables
- **Port already in use**: Either stop the process using port 3000 or change the port using the PORT environment variable
- **Appwrite API errors**: Verify your API key has the necessary permissions in the Appwrite console

### Frontend issues

- **CORS errors**: Ensure your backend's CORS configuration matches your frontend's domain
- **Session not persisting**: Check that cookies are enabled in your browser
- **Invalid credentials**: Use the demo account (demo@example.com / demo1234) or check your user database

## Conclusion

In this tutorial, you've learned how to:

- Set up a custom authentication server that integrates with Appwrite
- Generate and manage Appwrite custom tokens
- Create a frontend that handles the authentication flow
- Implement secure session management

This implementation provides a foundation for building more complex authentication systems. While we've used a simple in-memory user database for demonstration, the concepts apply to any external authentication provider, whether it's your own user database or third-party identity providers.

Remember that authentication is a critical security component. Before deploying to production, ensure you've implemented proper security measures, error handling, and user management features.

## Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [Custom Authentication Guide](https://appwrite.io/docs/authentication)
- [Express.js Documentation](https://expressjs.com/)
- [Web Security Best Practices](https://owasp.org/www-project-top-ten/)

## Getting help

If you encounter issues or have questions:

- Join the [Appwrite Discord community](https://appwrite.io/discord)
- Check the [Appwrite GitHub repository](https://github.com/appwrite/appwrite)
- Review the [Appwrite FAQ](https://appwrite.io/docs/faq)

## License

This tutorial and its code are available under the MIT License. Feel free to use, modify, and distribute them as needed.
