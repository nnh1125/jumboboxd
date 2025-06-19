// api/movies/detail.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const movieId = parseInt(id)
  
  if (isNaN(movieId) || movieId < 0 || movieId > 249) {
    return res.status(400).json({ error: 'Movie ID must be between 0 and 249' })
  }

  try {
    const response = await fetch(`https://jumboboxd.soylemez.net/api/movie?id=${movieId}`)
    const movie = await response.json()
    res.status(200).json(movie)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movie details' })
  }
}