// api/movies/watched.js
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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (req.method === 'POST') {
      // Mark movie as watched
      const { id, title, overview, posterPath, releaseDate } = req.body
      
      if (!id) {
        return res.status(400).json({ error: 'Movie ID is required' })
      }

      // Find or create the movie using the external API id as our primary key
      const movie = await prisma.movie.upsert({
        where: { movieId: id.toString() },
        update: {},
        create: {
          movieId: id.toString(),
          title: title || 'Unknown Title',
          overview,
          posterPath,
          releaseDate
        }
      })

      // Create or update watched entry
      const watchedMovie = await prisma.watchedMovie.upsert({
        where: {
          userId_movieId: {
            userId: user.id,
            movieId: movie.id
          }
        },
        update: {
          watchedAt: new Date()
        },
        create: {
          userId: user.id,
          movieId: movie.id
        },
        include: {
          movie: true
        }
      })

      return res.status(200).json({ 
        message: 'Movie marked as watched',
        watchedMovie 
      })

    } else if (req.method === 'DELETE') {
      // Remove movie from watched list
      const { id } = req.body
      
      if (!id) {
        return res.status(400).json({ error: 'Movie ID is required' })
      }

      // Find the movie
      const movie = await prisma.movie.findUnique({
        where: { movieId: id.toString() }
      })

      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' })
      }

      // Remove from watched
      await prisma.watchedMovie.delete({
        where: {
          userId_movieId: {
            userId: user.id,
            movieId: movie.id
          }
        }
      })

      return res.status(200).json({ message: 'Movie removed from watched list' })

    } else if (req.method === 'GET') {
      // Get user's watched movies
      const { page = 1, limit = 20 } = req.query

      const watchedMovies = await prisma.watchedMovie.findMany({
        where: { userId: user.id },
        include: {
          movie: true
        },
        orderBy: {
          watchedAt: 'desc'
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      })

      const total = await prisma.watchedMovie.count({
        where: { userId: user.id }
      })

      return res.status(200).json({
        watchedMovies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      })

    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }

  } catch (error) {
    console.error('Error in watched movies API:', error)
    return res.status(500).json({ error: 'Internal server error' })
  } 
}