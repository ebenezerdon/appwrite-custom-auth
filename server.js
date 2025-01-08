import express from 'express'
import cors from 'cors'
import { Client, Users, Account } from 'node-appwrite'
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

// Add error handling for JSON parsing
app.use(
  express.json({
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf)
      } catch (e) {
        console.error('JSON parsing failed:', e)
        res.status(400).json({ message: 'Invalid JSON' })
        throw new Error('Invalid JSON')
      }
    },
  }),
)

// Log all requests
app.use((req, res, next) => {
  console.log('Request body:', req.body)
  console.log('Content-Type:', req.headers['content-type'])
  next()
})

// Initialize Appwrite
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const users = new Users(client)
const account = new Account(client)

// Generate a simple unique ID
const generateId = () => Math.random().toString(36).substring(2, 15)

app.post('/auth/signup', async (req, res) => {
  console.log('Received signup data:', req.body)
  const { email, password, name } = req.body

  const missingFields = []
  if (!email) missingFields.push('email')
  if (!password) missingFields.push('password')
  if (!name) missingFields.push('name')

  if (missingFields.length > 0) {
    const message = `Missing required fields: ${missingFields.join(', ')}`
    console.log(message)
    return res.status(400).json({ message })
  }

  try {
    const userId = generateId()
    // Create user in Appwrite
    const user = await users.create(userId, email, undefined, password, name)
    res.json({ userId: user.$id })
  } catch (error) {
    console.error('Operation failed:', error)
    res.status(500).json({ message: error.message })
  }
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body

  try {
    // Let Appwrite handle the authentication
    const session = await account.createEmailSession(email, password)
    res.json({ userId: session.userId })
  } catch (error) {
    console.error('Authentication failed:', error)
    res.status(401).json({ message: 'Invalid credentials' })
  }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
