// src/pages/Browse.jsx
import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Search from '../components/Search'

function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [movies, setMovies] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const totalPages = 10 // Based on API constraint

  // Check for search params on mount
  useEffect(() => {
    const searchQuery = searchParams.get('search')
    if (searchQuery) {
      performSearch(searchQuery)
    }
  }, [searchParams])

  useEffect(() => {
    if (!isSearching) {
      fetchMovies(currentPage)
    }
  }, [currentPage, isSearching])

  const performSearch = async (query) => {
    setIsSearching(true)
    setLoading(true)
    try {
      const allMovies = []
      const searchLower = query.toLowerCase()
      
      // Search through all pages
      for (let page = 1; page <= 10; page++) {
        const response = await fetch(`/api/movies/list?page=${page}`)
        if (response.ok) {
          const movies = await response.json()
          const filtered = movies.filter(movie => 
            movie.title.toLowerCase().includes(searchLower)
          )
          allMovies.push(...filtered)
        }
      }
      
      setSearchResults(allMovies)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchResults = (results, query) => {
    setSearchResults(results)
    setIsSearching(results.length > 0)
    setSearchParams(query ? { search: query } : {})
  }

  const fetchMovies = async (page) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/movies/list?page=${page}`)
      if (!response.ok) {
        throw new Error('Failed to fetch movies')
      }
      
      const data = await response.json()
      setMovies(data)
    } catch (err) {
      console.error('Error fetching movies:', err)
      setError('Failed to load movies. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      window.scrollTo(0, 0)
    }
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    return pages
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-xl mb-4">{error}</p>
        <button 
          onClick={() => fetchMovies(currentPage)}
          className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-300 transition"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Movies</h1>
        <p className="text-gray-400 mb-6">Explore the top 250 movies of all time</p>
        
        {/* Search Bar */}
        <Search 
          onResults={handleSearchResults}
          className="max-w-xl"
        />
        
        {isSearching && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-gray-300">
              Found {searchResults.length} movie{searchResults.length !== 1 ? 's' : ''} matching your search
            </p>
            <button
              onClick={() => {
                setIsSearching(false)
                setSearchResults([])
                setSearchParams({})
              }}
              className="text-yellow-400 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {(isSearching ? searchResults : movies).map((movie, index) => (
              <Link
                key={movie.id}
                to={`/movie/${movie.id}`}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-lg bg-gray-800 transition-transform duration-200 group-hover:scale-105">
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  ) : (
                    <div className="aspect-[2/3] bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-500 text-sm text-center px-4">
                        {movie.title}
                      </span>
                    </div>
                  )}
                  
                  {/* Overlay with movie info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white font-semibold text-sm line-clamp-2">
                        {movie.title}
                      </h3>
                      {movie.year && (
                        <p className="text-gray-300 text-xs mt-1">{movie.year}</p>
                      )}
                      <p className="text-gray-400 text-xs mt-1">
                        #{isSearching ? index + 1 : (currentPage - 1) * 25 + movies.indexOf(movie) + 1}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination - only show when not searching */}
          {!isSearching && (
            <>
              <div className="mt-12 flex justify-center items-center space-x-2">
            {/* Previous button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Previous page"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* First page */}
            {currentPage > 3 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className="px-3 py-1 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition"
                >
                  1
                </button>
                {currentPage > 4 && <span className="text-gray-500">...</span>}
              </>
            )}

            {/* Page numbers */}
            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-lg transition ${
                  page === currentPage
                    ? 'bg-yellow-400 text-gray-900 font-semibold'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            ))}

            {/* Last page */}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && <span className="text-gray-500">...</span>}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="px-3 py-1 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition"
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* Next button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              aria-label="Next page"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

              {/* Page info */}
              <div className="mt-4 text-center text-gray-400 text-sm">
                Page {currentPage} of {totalPages} • Movies {((currentPage - 1) * 25) + 1}-{Math.min(currentPage * 25, 250)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Browse