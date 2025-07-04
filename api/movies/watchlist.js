// api/watchlist.js
import prisma from '../../lib/prisma.js' 
import { verifyToken } from '@clerk/backend'


export default async function handler(req, res) {
  try {
    // Get user from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { sub: userId } = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    })

    console.log('Watchlist API called:', req.method, userId)

    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (req.method === 'GET') {
      // Get user's watchlist
      const { page = 1, limit = 12 } = req.query
      const pageNum = parseInt(page)
      const limitNum = parseInt(limit)
      const skip = (pageNum - 1) * limitNum
      
      // Create a separate Watchlist table or use a simple approach
      // For now, let's use the Movie table with a many-to-many relation
      const watchlistMovies = await prisma.movie.findMany({
        where: {
          watchedBy: {
            some: {
              id: user.id
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      })
      
      const total = await prisma.movie.count({
        where: {
          watchedBy: {
            some: {
              id: user.id
            }
          }
        }
      })
      
      // Transform to match expected format
      const movies = watchlistMovies.map(movie => ({
        id: movie.movieId,
        title: movie.title,
        poster: movie.posterPath,
        year: movie.releaseDate ? parseInt(movie.releaseDate) : null,
        description: movie.overview
      }))
      
      return res.status(200).json({
        movies,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      })
    }
    
    if (req.method === 'POST') {
      // Add to watchlist
      const { movieId } = req.body
      
      if (!movieId) {
        return res.status(400).json({ error: 'movieId is required' })
      }
      
      // Check if movie exists in database
      let movie = await prisma.movie.findUnique({
        where: { movieId: movieId.toString() }
      })

      if (!movie) {
        // If movie doesn't exist, create a new entry
        movie = await prisma.movie.create({
          data: {
            movieId: movieId.toString(),
            title: req.body.title || 'Unknown Title',
            posterPath: req.body.posterPath || null,
            overview: req.body.overview || '',
            releaseDate: req.body.year ? new Date(req.body.year, 0, 1) : null
          }
        })
      }

      
      // Add to user's watchlist
      await prisma.user.update({
        where: { id: user.id },
        data: {
          watchlist: {
            connect: { id: movie.id }
          }
        }
      })
      
      return res.status(200).json({ success: true, movie })
    }
    
    if (req.method === 'DELETE') {
      // Remove from watchlist
      const { movieId } = req.body
      
      if (!movieId) {
        return res.status(400).json({ error: 'movieId is required' })
      }
      
      const movie = await prisma.movie.findUnique({
        where: { movieId: movieId.toString() }
      })
      
      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' })
      }
      
      // Remove from user's watchlist
      await prisma.user.update({
        where: { id: user.id },
        data: {
          watchlist: {
            disconnect: { id: movie.id }
          }
        }
      })
      
      return res.status(200).json({ success: true })
    }
    
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Watchlist error:', error)
    return res.status(500).json({ error: 'Failed to process watchlist request' })
  }
}