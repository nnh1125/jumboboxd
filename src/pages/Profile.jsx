// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

function Profile() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('watched'); // 'watched' or 'watchlist' or 'reviews'
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalWatched: 0,
    totalWatchlist: 0,
    totalReviews: 0,
    totalPages: 0
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Load stats first, then load tab content
  useEffect(() => {
    if (isLoaded && user) {
      fetchStats();
    }
  }, [user, isLoaded]);

  // Load tab content after stats are loaded
  useEffect(() => {
    if (!statsLoading && user) {
      if (activeTab === 'watched') {
        fetchWatchedMovies();
      } else if (activeTab === 'watchlist') {
        fetchWatchlistMovies();
      } else if (activeTab === 'reviews') {
        fetchUserReviews();
      }
    }
  }, [statsLoading, currentPage, activeTab, user]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const token = await getToken();
      
      // Fetch all stats in parallel
      const [watchedResponse, watchlistResponse, reviewsResponse] = await Promise.all([
        // Get watched count
        fetch('/api/movies/watched?page=1&limit=1', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        
        // Get watchlist count
        fetch('/api/movies/watchlist?page=1&limit=1', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        
        // Get reviews count
        fetch('/api/movies/reviews?page=1&limit=1', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      // Process responses
      if (watchedResponse.ok) {
        const watchedData = await watchedResponse.json();
        setStats(prev => ({ ...prev, totalWatched: watchedData.pagination.total }));
      }

      if (watchlistResponse.ok) {
        const watchlistData = await watchlistResponse.json();
        setStats(prev => ({ ...prev, totalWatchlist: watchlistData.pagination.total }));
      }

      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setStats(prev => ({ ...prev, totalReviews: reviewsData.pagination.total }));
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load profile statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchWatchedMovies = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`/api/movies/watched?page=${currentPage}&limit=12`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWatchedMovies(data.watchedMovies);
        setStats(prev => ({
          ...prev,
          totalWatched: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
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

  const fetchWatchlistMovies = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`/api/movies/watchlist?page=${currentPage}&limit=12`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWatchlistMovies(data.movies);
        setStats(prev => ({
          ...prev,
          totalWatchlist: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      } else {
        throw new Error('Failed to fetch watchlist');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`/api/movies/reviews?page=${currentPage}&limit=12`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setStats(prev => ({
          ...prev,
          totalReviews: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      } else {
        throw new Error('Failed to fetch reviews');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatched = async (movieId) => {
    try {
      const token = await getToken();
      const response = await fetch('/api/movies/watched', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          id: movieId 
        })
      });

      if (response.ok) {
        fetchWatchedMovies();
        fetchStats();
      } else {
        console.error('Failed to remove movie from watched list');
      }
    } catch (err) {
      console.error('Error removing movie:', err);
    }
  };

  const removeFromWatchlist = async (movieId) => {
    try {
      const token = await getToken();
      const response = await fetch('/api/movies/watchlist', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          movieId: movieId 
        })
      });

      if (response.ok) {
        fetchWatchlistMovies();
        fetchStats();
      } else {
        console.error('Failed to remove movie from watchlist');
      }
    } catch (err) {
      console.error('Error removing movie:', err);
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/movies/reviews?reviewId=${reviewId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchUserReviews();
        fetchStats();
      } else {
        console.error('Failed to delete review');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to page 1 when switching tabs
  };

  // Show loading state while user is loading or stats are loading
  if (!isLoaded || statsLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="animate-pulse">
            {/* Profile header skeleton */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
              <div>
                <div className="h-8 bg-gray-700 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-64"></div>
              </div>
            </div>
            
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-700 rounded-lg p-4">
                  <div className="h-8 bg-gray-600 rounded mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
            
            <p className="text-center text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchStats();
            }}
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
              {user?.username || user?.firstName || 'Your Profile'}
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
            <div className="text-2xl font-bold text-white">{stats.totalWatchlist}</div>
            <div className="text-gray-400 text-sm">Watchlist Items</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.totalReviews}</div>
            <div className="text-gray-400 text-sm">Reviews Written</div>
          </div>
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => handleTabChange('watched')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'watched'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Watched ({stats.totalWatched})
          </button>
          <button
            onClick={() => handleTabChange('watchlist')}
            className={`px-4 py-2 font-medium transition-colors ml-6 ${
              activeTab === 'watchlist'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Watchlist ({stats.totalWatchlist})
          </button>
          <button
            onClick={() => handleTabChange('reviews')}
            className={`px-4 py-2 font-medium transition-colors ml-6 ${
              activeTab === 'reviews'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Reviews ({stats.totalReviews})
          </button>
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">
          {activeTab === 'watched'
            ? 'Recently Watched'
            : activeTab === 'watchlist'
            ? 'My Watchlist'
            : 'My Reviews'}
        </h2>

        {/* Loading state for tab content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              reviews.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">You haven't written any reviews yet!</p>
                  <Link 
                    to="/browse" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-block"
                  >
                    Browse Movies
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {review.movie.poster && (
                              <img 
                                src={review.movie.poster} 
                                alt={review.movie.title}
                                className="w-16 h-24 object-cover rounded"
                              />
                            )}
                            <div>
                              <Link to={`/movie/${review.movie.id}`} className="text-white font-semibold hover:text-yellow-400 transition">
                                {review.movie.title}
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex text-yellow-400">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < review.score ? '' : 'opacity-30'}>★</span>
                                  ))}
                                </div>
                                <span className="text-gray-400 text-sm">
                                  {new Date(review.updatedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          {review.review && (
                            <p className="text-gray-300 mt-2">{review.review}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="ml-4 text-red-400 hover:text-red-300 transition"
                          title="Delete review"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Movies Grid for Watched and Watchlist */}
            {activeTab !== 'reviews' && (
              (activeTab === 'watched' ? watchedMovies : watchlistMovies).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">
                    {activeTab === 'watched' 
                      ? "You haven't watched any movies yet!"
                      : "Your watchlist is empty!"}
                  </p>
                  <Link 
                    to="/browse" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-block"
                  >
                    Browse Movies
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                  {(activeTab === 'watched' ? watchedMovies : watchlistMovies).map((item) => {
                    const movie = activeTab === 'watched' ? item.movie : item;
                    const movieId = activeTab === 'watched' ? item.movie.movieId : item.id;
                    const posterPath = activeTab === 'watched' ? item.movie.posterPath : movie.poster;
                    const title = activeTab === 'watched' ? item.movie.title : movie.title;
                    
                    return (
                      <div key={item.id} className="group relative">
                        <Link to={`/movie/${movieId}`}>
                          <div className="relative overflow-hidden rounded-lg bg-gray-700 transition-transform duration-200 group-hover:scale-105">
                            {posterPath ? (
                              <img
                                src={posterPath}
                                alt={title}
                                className="w-full h-auto"
                              />
                            ) : (
                              <div className="aspect-[2/3] bg-gray-600 flex items-center justify-center">
                                <span className="text-gray-400 text-xs text-center px-2">
                                  {title}
                                </span>
                              </div>
                            )}
                            
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <div className="text-center">
                                <p className="text-white text-sm font-medium mb-2">
                                  {title}
                                </p>
                                {activeTab === 'watched' && item.watchedAt && (
                                  <p className="text-gray-300 text-xs">
                                    Watched {new Date(item.watchedAt).toLocaleDateString()}
                                  </p>
                                )}
                                {activeTab === 'watchlist' && movie.year && (
                                  <p className="text-gray-300 text-xs">
                                    {movie.year}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                        
                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            if (activeTab === 'watched') {
                              removeFromWatched(movieId);
                            } else {
                              removeFromWatchlist(movieId);
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title={`Remove from ${activeTab === 'watched' ? 'watched' : 'watchlist'}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Pagination */}
            {stats.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
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