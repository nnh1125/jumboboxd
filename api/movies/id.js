// api/movies/[id].js
export default async function handler(req, res) {
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' })
        }
      
        const { id } = req.query
        const movieId = parseInt(id)
        
        // Validate movie ID
        if (isNaN(movieId) || movieId < 0 || movieId > 249) {
          return res.status(400).json({ error: 'Movie ID must be between 0 and 249' })
        }
      
        try {
          // Call the external movie API
          const response = await fetch(`https://jumboboxd.soylemez.net/api/movie?id=${movieId}`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch from movie API')
          }
          
          const movie = await response.json()
          
          // Also check if this movie has been rated/watched by the user
          // This will be implemented when adding user functionality
          
          res.status(200).json(movie)
        } catch (error) {
          console.error('Error fetching movie details:', error)
          res.status(500).json({ error: 'Failed to fetch movie details' })
        }
      }