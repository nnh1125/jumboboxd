// api/reviews.js
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

    if (req.method === 'GET') {
      const { movieId, userId: queryUserId, page = 1, limit = 10 } = req.query
      const pageNum = parseInt(page)
      const limitNum = parseInt(limit)
      const skip = (pageNum - 1) * limitNum

      let where = {}
      
      // If movieId provided, get reviews for specific movie
      if (movieId) {
        const movie = await prisma.movie.findUnique({
          where: { movieId: movieId.toString() }
        })
        if (movie) {
          where.movieId = movie.id
        } else {
          return res.status(200).json({ reviews: [], pagination: { total: 0, totalPages: 0 } })
        }
      }
      
      // If userId provided, get reviews by specific user
      if (queryUserId) {
        const reviewUser = await prisma.user.findUnique({
          where: { clerkId: queryUserId }
        })
        if (reviewUser) {
          where.userId = reviewUser.id
        }
      } else {
        // If no specific userId provided, filter by the authenticated user
        where.userId = user.id
      }

      const total = await prisma.rating.count({ where })
      
      const reviews = await prisma.rating.findMany({
        where,
        include: {
          user: true,
          movie: true
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum
      })

      const formattedReviews = reviews.map(review => ({
        id: review.id,
        score: review.score,
        review: review.review,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        user: {
          id: review.user.clerkId,
          username: review.user.username,
          email: review.user.email
        },
        movie: {
          id: review.movie.tmdbId,
          title: review.movie.title,
          poster: review.movie.posterPath
        }
      }))

      return res.status(200).json({
        reviews: formattedReviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      })
    }

    if (req.method === 'POST') {
      const { movieId, score, review } = req.body
      
      if (!movieId || !score) {
        return res.status(400).json({ error: 'movieId and score are required' })
      }
      
      if (score < 1 || score > 5) {
        return res.status(400).json({ error: 'Score must be between 1 and 5' })
      }

      // Get or create movie
      let movie = await prisma.movie.findUnique({
        where: { movieId: movieId.toString()}
      })
      
      if (!movie) {
        // Fetch movie details from your API
        const movieResponse = await fetch(`https://jumboboxd.soylemez.net/api/movie?id=${movieId}`)
        const movieData = await movieResponse.json()
        
        movie = await prisma.movie.create({
          data: {
            movieId: movieId.toString(),
            title: movieData.title,
            overview: movieData.description || null,
            posterPath: movieData.poster || null,
            releaseDate: movieData.year?.toString() || null
          }
        })
      }

      // Create or update rating/review
      const rating = await prisma.rating.upsert({
        where: {
          userId_movieId: {
            userId: user.id,
            movieId: movie.id
          }
        },
        update: {
          score: parseFloat(score),
          review: review || null
        },
        create: {
          userId: user.id,
          movieId: movie.id,
          score: parseFloat(score),
          review: review || null
        },
        include: {
          user: true,
          movie: true
        }
      })

      return res.status(200).json({
        id: rating.id,
        score: rating.score,
        review: rating.review,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
        user: {
          id: rating.user.clerkId,
          username: rating.user.username
        },
        movie: {
          id: rating.movie.tmdbId,
          title: rating.movie.title
        }
      })
    }

    if (req.method === 'DELETE') {
      const { reviewId } = req.query
      
      if (!reviewId) {
        return res.status(400).json({ error: 'reviewId is required' })
      }

      // Check if review belongs to user
      const review = await prisma.rating.findUnique({
        where: { id: reviewId }
      })

      if (!review) {
        return res.status(404).json({ error: 'Review not found' })
      }

      if (review.userId !== user.id) {
        return res.status(403).json({ error: 'Unauthorized to delete this review' })
      }

      await prisma.rating.delete({
        where: { id: reviewId }
      })

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Review API error:', error)
    return res.status(500).json({ error: 'Failed to process review request' })
  }
}