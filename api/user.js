import { clerkClient } from '@clerk/backend'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { userId } = req.body
      
      // Verify the user with Clerk
      const user = await clerkClient.users.getUser(userId)
      
      // Create or update user in database
      const dbUser = await prisma.user.upsert({
        where: { clerkId: userId },
        update: { email: user.emailAddresses[0]?.emailAddress },
        create: {
          clerkId: userId,
          email: user.emailAddresses[0]?.emailAddress,
          username: user.username,
        },
      })
      
      res.status(200).json(dbUser)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}