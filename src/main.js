import { Client, Account } from 'appwrite'

// Initialize Appwrite
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)

const account = new Account(client)

// DOM Elements
const loginForm = document.getElementById('loginForm')
const loggedInView = document.getElementById('loggedInView')
const userInfo = document.getElementById('userInfo')
const loginButton = document.getElementById('loginButton')
const logoutButton = document.getElementById('logoutButton')

// Check if user is already logged in
const checkAuth = async () => {
  try {
    const session = await account.get()
    showLoggedInView(session)
  } catch (error) {
    showLoginView()
  }
}

// Show logged in view
const showLoggedInView = (user) => {
  loginForm.classList.add('hidden')
  loggedInView.classList.remove('hidden')
  userInfo.textContent = `Logged in as: ${user.name}`
}

// Show login view
const showLoginView = () => {
  loginForm.classList.remove('hidden')
  loggedInView.classList.add('hidden')
}

// Handle login
loginButton.addEventListener('click', async () => {
  const username = document.getElementById('username').value
  const password = document.getElementById('password').value

  try {
    // First, call your backend to validate credentials and get token
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      },
    )

    const data = await response.json()

    if (!response.ok) throw new Error(data.message)

    // Create Appwrite session using the token
    const session = await account.createSession(data.userId, data.secret)
    showLoggedInView(session)
  } catch (error) {
    alert('Login failed: ' + error.message)
  }
})

// Handle logout
logoutButton.addEventListener('click', async () => {
  try {
    await account.deleteSession('current')
    showLoginView()
  } catch (error) {
    alert('Logout failed: ' + error.message)
  }
})

// Check auth status on page load
checkAuth()
