// api/users.js
import { createClerkClient } from '@clerk/backend'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Initialize Clerk client with your secret key
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
})

export default async function handler(req, res) {
  console.log('Users API called:', req.method, req.body)
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body
    
    if (!userId) {
      console.error('No userId provided')
      return res.status(400).json({ error: 'userId is required' })
    }
    
    console.log('Syncing user:', userId)
    
    // Verify the user with Clerk
    let user
    try {
      user = await clerkClient.users.getUser(userId)
    } catch (clerkError) {
      console.error('Clerk error:', clerkError)
      return res.status(404).json({ error: 'User not found in Clerk' })
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found in Clerk' })
    }
    
    // Get email - handle Google OAuth users
    const primaryEmail = user.emailAddresses?.find(email => email.id === user.primaryEmailAddressId)
    const email = primaryEmail?.emailAddress || user.emailAddresses?.[0]?.emailAddress || ''
    
    console.log('Creating/updating user in database:', {
      clerkId: userId,
      email,
      username: user.username
    })
    
    // Create or update user in database
    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: { 
        email,
        username: user.username || null,
      },
      create: {
        clerkId: userId,
        email,
        username: user.username || null,
      },
    })
    
    console.log('User synced successfully:', dbUser.id)
    res.status(200).json(dbUser)
  } catch (error) {
    console.error('Error syncing user:', error)
    res.status(500).json({ 
      error: 'Failed to sync user',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}