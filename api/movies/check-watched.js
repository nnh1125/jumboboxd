// api/movies/watched.js
import prisma from '../../lib/prisma.js' // Adjust path as needed
import { verifyToken }from '@clerk/backend'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  
    try {
      const { userId, id } = req.query
      
      if (!userId || !id) {
        return res.status(400).json({ error: 'User ID and movie ID are required' })
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