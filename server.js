import express from 'express'
import cors from 'cors'
import { Client, Users } from 'node-appwrite'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

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

const app = express()
app.use(cors())
app.use(express.json())

// Initialize Appwrite
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const users = new Users(client)

// Simulated user database (replace with your actual user storage)
const USERS = {
  demo: {
    id: 'unique-user-id',
    password: 'demo123',
    name: 'Demo User',
  },
}

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body

  // Validate user credentials (replace with your actual validation logic)
  const user = USERS[username]
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  try {
    // Create Appwrite token
    const token = await users.createToken(user.id)

    // Return token secret and user ID to client
    res.json({
      userId: user.id,
      secret: token.secret,
    })
  } catch (error) {
    console.error('Token creation failed:', error)
    res.status(500).json({ message: 'Authentication failed' })
  }
})

const PORT = 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
