// src/pages/Home.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Search from '../components/Search'

// Movie card component
function MovieCard({ movie }) {
  return (
    <Link 
      to={`/movie/${movie.id}`}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-lg bg-gray-800 transition-transform duration-200 group-hover:scale-105">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-auto"
          />
        ) : (
          <div className="aspect-[2/3] bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 text-sm text-center px-4">{movie.title}</span>
          </div>
        )}
        
        {/* Overlay with year */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white font-semibold text-sm line-clamp-2">{movie.title}</h3>
            {movie.year && (
              <p className="text-gray-300 text-xs mt-1">{movie.year}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// Section component for movie lists
function MovieSection({ title, movies, loading }) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
      
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {movies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </section>
  )
}

// Main Home component
function Home() {
  const [popularMovies, setPopularMovies] = useState([])
  const [topRatedMovies, setTopRatedMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch movies from your API
  useEffect(() => {
    fetchMovies()
  }, [])

  const fetchMovies = async () => {
    try {
      setLoading(true)
      
      // Fetch different pages of movies from the list endpoint
      const [page1, page2, page3] = await Promise.all([
        fetch('/api/movies/list?page=1').then(res => res.json()),
        fetch('/api/movies/list?page=2').then(res => res.json()),
        fetch('/api/movies/list?page=3').then(res => res.json())
      ])
      
      // Use different pages for different sections
      setPopularMovies(page1.slice(0, 8))
      setTopRatedMovies(page2.slice(0, 8))
    } catch (error) {
      console.error('Error fetching movies:', error)
      // For now, set some mock data so you can see the UI
      const mockMovie = {
        id: 1,
        title: "Sample Movie",
        poster: null,
        year: 2024
      }
      setPopularMovies(Array(8).fill(mockMovie).map((m, i) => ({ ...m, id: i })))
    } finally {
      setLoading(false)
    }
  }

  // Handle search results
  const handleSearchResults = (results, query) => {
    setSearchResults(results)
    setSearchQuery(query)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section with Search */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Track films you've watched.
          <br />
          Save those you want to see.
        </h1>
        <p className="text-gray-400 text-lg mb-6">
          Your personal movie database and social film diary.
        </p>
        
        {/* Search Bar */}
        <Search 
          onResults={handleSearchResults}
          className="max-w-2xl"
        />
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <MovieSection
          title={`Search Results for "${searchQuery}"`}
          movies={searchResults}
          loading={false}
        />
      )}

      {/* Movie Sections */}
      {!searchResults.length && (
        <>
          <MovieSection
            title="Popular Now"
            movies={popularMovies}
            loading={loading}
          />
          
          <MovieSection
            title="Top Rated"
            movies={topRatedMovies}
            loading={loading}
          />
        </>
      )}
    </div>
  )
}

export default Home