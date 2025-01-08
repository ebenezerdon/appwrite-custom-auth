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

// Simulate a third-party auth database
const thirdPartyUsers = {
  'demo@example.com': {
    password: 'demo1234',
    name: 'Demo User',
    id: 'external_123',
  },
}

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
        password,
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

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
