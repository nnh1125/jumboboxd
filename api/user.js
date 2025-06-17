// api/users.js
import { createClerkClient } from '@clerk/backend'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Initialize Clerk client with your secret key
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
})

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { userId } = req.body
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' })
      }
      
      console.log('Syncing user:', userId)
      
      // Verify the user with Clerk
      const user = await clerkClient.users.getUser(userId)
      
      if (!user) {
        return res.status(404).json({ error: 'User not found in Clerk' })
      }
      
      // Create or update user in database
      const dbUser = await prisma.user.upsert({
        where: { clerkId: userId },
        update: { 
          email: user.emailAddresses[0]?.emailAddress,
          username: user.username || null,
        },
        create: {
          clerkId: userId,
          email: user.emailAddresses[0]?.emailAddress || '',
          username: user.username || null,
        },
      })
      
      console.log('User synced:', dbUser)
      res.status(200).json(dbUser)
    } catch (error) {
      console.error('Error syncing user:', error)
      res.status(500).json({ 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}