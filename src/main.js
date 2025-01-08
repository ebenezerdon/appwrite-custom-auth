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
