import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

function MovieDetail() {
  const { id } = useParams(); // This is the Id from external API
  const { user, isLoaded } = useUser();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWatched, setIsWatched] = useState(false);
  const [watchedLoading, setWatchedLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('No movie ID provided');
      setLoading(false);
      return;
    }

    fetchMovieDetails();
    if (user && isLoaded) {
      checkWatchedStatus();
    }
  }, [id, user, isLoaded]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/movies/detail?id=${id}`);
      
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Invalid movie ID');
        } else if (response.status === 404) {
          throw new Error('Movie not found');
        } else {
          throw new Error('Failed to fetch movie details');
        }
      }
      
      const data = await response.json();
      setMovie(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching movie details:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkWatchedStatus = async () => {
    try {
      const response = await fetch(`/api/movies/check-watched?userId=${user.id}&id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setIsWatched(data.isWatched);
      } else {
        console.error('Failed to check watched status:', response.status);
      }
    } catch (err) {
      console.error('Error checking watched status:', err);
    }
  };

  const toggleWatched = async () => {
    if (!user || !movie) return;
    
    setWatchedLoading(true);
    try {
      if (isWatched) {
        // Remove from watched
        const response = await fetch('/api/movies/watched', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id,
            id: id 
          })
        });

        if (response.ok) {
          setIsWatched(false);
        } else {
          const errorData = await response.json();
          console.error('Failed to remove from watched:', errorData);
        }
      } else {
        // Mark as watched
        const response = await fetch('/api/movies/watched', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            id: id,
            title: movie.title,
            overview: movie.description || movie.overview,
            posterPath: movie.poster,
            releaseDate: movie.releaseDate || movie.release_date
          })
        });

        if (response.ok) {
          setIsWatched(true);
        } else {
          const errorData = await response.json();
          console.error('Failed to mark as watched:', errorData);
        }
      }
    } catch (err) {
      console.error('Error updating watched status:', err);
    } finally {
      setWatchedLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-300">Loading movie details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-300">No movie details found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Movie Poster */}
          <div className="lg:w-1/3 xl:w-1/4">
            {movie.poster ? (
              <img 
                src={movie.poster} 
                alt={movie.title}
                className="w-full h-auto object-cover"
              />
            ) : (
              <div className="aspect-[2/3] bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500 text-center px-4">No poster available</span>
              </div>
            )}
          </div>
          
          {/* Movie Details */}
          <div className="lg:w-2/3 xl:w-3/4 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-white">{movie.title}</h1>
                {movie.year && (
                  <p className="text-xl text-gray-300">({movie.year})</p>
                )}
              </div>
              
              {/* Watched Status Badge */}
              {user && (
                <div className="flex items-center gap-2">
                  {isWatched && (
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Watched
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {movie.tagline && (
              <p className="text-lg italic text-gray-400 mb-4">"{movie.tagline}"</p>
            )}
            
            {movie.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
                <p className="text-gray-300 leading-relaxed">{movie.description}</p>
              </div>
            )}
            
            {/* Movie Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {movie.releaseDate && (
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">Release Date</p>
                  <p className="text-white font-semibold">{movie.releaseDate}</p>
                </div>
              )}
              
              {movie.rating && (
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">Rating</p>
                  <p className="text-white font-semibold">{movie.rating}</p>
                </div>
              )}
              
              {movie.genre && (
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">Genre</p>
                  <p className="text-white font-semibold">{movie.genre}</p>
                </div>
              )}
              
              {movie.duration && (
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">Duration</p>
                  <p className="text-white font-semibold">{movie.duration}</p>
                </div>
              )}
              
              {movie.director && (
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">Director</p>
                  <p className="text-white font-semibold">{movie.director}</p>
                </div>
              )}
              
              {movie.imdbRating && (
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">IMDb Rating</p>
                  <p className="text-white font-semibold">⭐ {movie.imdbRating}/10</p>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            {user && (
              <div className="flex gap-3 flex-wrap">
                <button 
                  onClick={toggleWatched}
                  disabled={watchedLoading}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    isWatched 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } ${watchedLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {watchedLoading ? '...' : (isWatched ? 'Remove from Watched' : 'Mark as Watched')}
                </button>
                
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">
                  Add to Watchlist
                </button>
                
                <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition">
                  Rate Movie
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieDetail;