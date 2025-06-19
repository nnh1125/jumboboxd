// api/movies/watched.js
import prisma from '../../lib/prisma.js' // Adjust path as needed
import { verifyToken }from '@clerk/backend'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  
    try {
        const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
        req.cookies?.__session || 
        req.headers['x-clerk-auth-token']

        if (!sessionToken) {
        return res.status(401).json({ error: 'No authentication token provided' })
        }

        // Verify the token and get user info
        const payload = await verifyToken(sessionToken, {
        secretKey: process.env.CLERK_SECRET_KEY
        })

const userId = payload.sub
      const { id } = req.query
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
  
      if (!id) {
        return res.status(400).json({ error: 'Movie id is required' })
      }
  
      // Find the user
      const user = await prisma.user.findUnique({
        where: { clerkId: userId }
      })
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
  
      // Find the movie
      const movie = await prisma.movie.findUnique({
        where: { movieId: id.toString() }
      })
  
      if (!movie) {
        return res.status(200).json({ isWatched: false })
      }
  
      // Check if user has watched this movie
      const watchedMovie = await prisma.watchedMovie.findUnique({
        where: {
          userId_movieId: {
            userId: user.id,
            movieId: movie.id
          }
        }
      })
  
      return res.status(200).json({ 
        isWatched: !!watchedMovie,
        watchedAt: watchedMovie?.watchedAt || null
      })
  
    } catch (error) {
      console.error('Error checking watched status:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }