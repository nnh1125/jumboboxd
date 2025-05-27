// api/movies/list.js
export default async function handler(req, res) {
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' })
        }
      
        const { page = 1 } = req.query
        const pageNum = parseInt(page)
        
        // Validate page number
        if (pageNum < 1 || pageNum > 10) {
          return res.status(400).json({ error: 'Page must be between 1 and 10' })
        }
      
        try {
          // Call the external movie API
          const response = await fetch(`https://jumboboxd.soylemez.net/api/list?page=${pageNum}`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch from movie API')
          }
          
          const movies = await response.json()
          
          res.status(200).json(movies)
        } catch (error) {
          console.error('Error fetching movies:', error)
          res.status(500).json({ error: 'Failed to fetch movies' })
        }
      }
      
      