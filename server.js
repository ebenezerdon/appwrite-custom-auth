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
app.use(express.json())

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
  const { email, password, name } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  try {
    const userId = generateId()
    const user = await users.create(userId, email, undefined, password, name)
    res.json({ userId: user.$id })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const session = await account.createEmailSession(email, password)
    res.json({ userId: session.userId })
  } catch (error) {
    res.status(401).json({ message: 'Invalid credentials' })
  }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
