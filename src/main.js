import { Client, Account } from 'appwrite'

// Initialize Appwrite
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)

const account = new Account(client)

// DOM Elements
const loginForm = document.getElementById('loginForm')
const signupForm = document.getElementById('signupForm')
const loggedInView = document.getElementById('loggedInView')
const userInfo = document.getElementById('userInfo')
const loginButton = document.getElementById('loginButton')
const signupButton = document.getElementById('signupButton')
const logoutButton = document.getElementById('logoutButton')
const showSignupLink = document.getElementById('showSignup')
const showLoginLink = document.getElementById('showLogin')

// Toggle between login and signup forms
showSignupLink.addEventListener('click', () => {
  loginForm.classList.add('hidden')
  signupForm.classList.remove('hidden')
})

showLoginLink.addEventListener('click', () => {
  signupForm.classList.add('hidden')
  loginForm.classList.remove('hidden')
})

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
  signupForm.classList.add('hidden')
  loggedInView.classList.remove('hidden')
  userInfo.textContent = `Logged in as: ${user.name}`
}

// Show login view
const showLoginView = () => {
  loginForm.classList.remove('hidden')
  signupForm.classList.add('hidden')
  loggedInView.classList.add('hidden')
}

// Handle signup
signupButton.addEventListener('click', async () => {
  const email = document.getElementById('signupEmail').value
  const password = document.getElementById('signupPassword').value
  const name = document.getElementById('signupName').value

  try {
    // First create user through our backend
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      },
    )

    const data = await response.json()
    if (!response.ok) throw new Error(data.message)

    // Then create session directly with Appwrite
    const session = await account.createEmailSession(email, password)
    showLoggedInView(session)
  } catch (error) {
    alert('Signup failed: ' + error.message)
  }
})

// Handle login
loginButton.addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value
  const password = document.getElementById('loginPassword').value

  try {
    // Create session directly with Appwrite
    const session = await account.createEmailSession(email, password)
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
