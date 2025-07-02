import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

function Profile() {
  const { user, isLoaded } = useUser();
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalWatched: 0,
    totalPages: 0
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isLoaded && user) {
      fetchWatchedMovies();
    }
  }, [user, isLoaded, currentPage]);

  const fetchWatchedMovies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/movies/watched?userId=${user.id}&page=${currentPage}&limit=12`);
      
      if (response.ok) {
        const data = await response.json();
        setWatchedMovies(data.watchedMovies);
        setStats({
          totalWatched: data.pagination.total,
          totalPages: data.pagination.totalPages
        });
      } else {
        throw new Error('Failed to fetch watched movies');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching watched movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatched = async (movieId) => {
    try {
      const response = await fetch('/api/movies/watched', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id,
          id: movieId 
        })
      });

      if (response.ok) {
        // Refresh the watched movies list
        fetchWatchedMovies();
      } else {
        console.error('Failed to remove movie from watched list');
      }
    } catch (err) {
      console.error('Error removing movie:', err);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button 
            onClick={fetchWatchedMovies}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          {user?.imageUrl && (
            <img 
              src={user.imageUrl} 
              alt={user?.firstName || 'User'} 
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">
              {user?.username ? `${user.username} ` : 'Your Profile'}
            </h1>
            <p className="text-gray-400">{user?.emailAddresses?.[0]?.emailAddress}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.totalWatched}</div>
            <div className="text-gray-400 text-sm">Movies Watched</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-gray-400 text-sm">Reviews Written</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-gray-400 text-sm">Watchlist Items</div>
          </div>
        </div>
      </div>

      {/* Watched Movies Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Recently Watched</h2>
        
        {watchedMovies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">You haven't watched any movies yet!</p>
            <Link 
              to="/" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-block"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <>
            {/* Movies Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              {watchedMovies.map((watchedMovie) => (
                <div key={watchedMovie.id} className="group relative">
                  <Link to={`/movie/${watchedMovie.movie.movieId}`}>
                    <div className="relative overflow-hidden rounded-lg bg-gray-700 transition-transform duration-200 group-hover:scale-105">
                      {watchedMovie.movie.posterPath ? (
                        <img
                          src={watchedMovie.movie.posterPath}
                          alt={watchedMovie.movie.title}
                          className="w-full h-auto"
                        />
                      ) : (
                        <div className="aspect-[2/3] bg-gray-600 flex items-center justify-center">
                          <span className="text-gray-400 text-xs text-center px-2">
                            {watchedMovie.movie.title}
                          </span>
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-white text-sm font-medium mb-2">
                            {watchedMovie.movie.title}
                          </p>
                          <p className="text-gray-300 text-xs">
                            Watched {new Date(watchedMovie.watchedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWatched(watchedMovie.movie.movieId);
                    }}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    title="Remove from watched"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {stats.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-gray-300">
                  Page {currentPage} of {stats.totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, stats.totalPages))}
                  disabled={currentPage === stats.totalPages}
                  className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;