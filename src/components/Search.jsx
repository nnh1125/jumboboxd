// src/components/Search.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Search({ placeholder = "Search for movies...", onResults, className = "" }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const navigate = useNavigate()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      // Fetch all pages to search through all movies
      const allMovies = []
      const searchLower = searchQuery.toLowerCase()
      
      // For better performance, we could implement server-side search
      // For now, we'll search through a few pages
      for (let page = 1; page <= 3; page++) {
        const response = await fetch(`/api/movies/list?page=${page}`)
        if (response.ok) {
          const movies = await response.json()
          const filtered = movies.filter(movie => 
            movie.title.toLowerCase().includes(searchLower)
          )
          allMovies.push(...filtered)
        }
      }
      
      if (onResults) {
        // If parent component wants to handle results
        onResults(allMovies, searchQuery)
      } else {
        // Default behavior - navigate to browse with search params
        navigate(`/browse?search=${encodeURIComponent(searchQuery)}`)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  return (
    <form onSubmit={handleSearch} className={`w-full ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          disabled={searching}
          className="w-full px-4 py-3 pl-12 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {searching && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
    </form>
  )
}

export default Search