// src/pages/MovieDetail.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Eye, CheckCircle, PlusCircle, Loader2 } from 'lucide-react';
import ReviewModal from '../components/ReviewModal';

function MovieDetail() {
  const { id } = useParams(); // This is the Id from external API
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWatched, setIsWatched] = useState(false);
  const [watchedLoading, setWatchedLoading] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [allReviews, setAllReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('No movie ID provided');
      setLoading(false);
      return;
    }

    fetchMovieDetails();
    fetchReviews();
    if (user && isLoaded) {
      checkWatchedStatus();
      checkWatchlistStatus();
      fetchUserReview();
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

  const checkWatchlistStatus = async () => {
    try {
      const token = await getToken();

      console.log
      
      // Check if movie is in user's watchlist
      const response = await fetch('/api/movies/watchlist', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const inWatchlist = data.movies.some(m => m.id === parseInt(id));
        setIsInWatchlist(inWatchlist);
      }
    } catch (err) {
      console.error('Error checking watchlist status:', err);
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
          // If marking as watched, remove from watchlist
          if (isInWatchlist) {
            await toggleWatchlist(true);
          }
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

  const toggleWatchlist = async (skipStateUpdate = false) => {
    if (!user) {
      navigate('/sign-in');
      return;
    }
    
    if (!skipStateUpdate) setWatchlistLoading(true);
    try {
      const token = await getToken();
      
      const response = await fetch('/api/movies/watchlist', {
        method: isInWatchlist ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          movieId: id
        })
      });

      if (response.ok) {
        if (!skipStateUpdate) setIsInWatchlist(!isInWatchlist);
      } else {
        const errorData = await response.json();
        console.error('Failed to update watchlist:', errorData);
      }
    } catch (err) {
      console.error('Error updating watchlist:', err);
    } finally {
      if (!skipStateUpdate) setWatchlistLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const token = await getToken();
      const response = await fetch(`/api/movies/reviews?movieId=${id}&limit=5`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllReviews(data.reviews);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchUserReview = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/movies/reviews?movieId=${id}&userId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.reviews.length > 0) {
          setUserReview(data.reviews[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching user review:', err);
    }
  };

  const handleReviewSubmit = async (review) => {
    setUserReview(review);
    fetchReviews(); // Refresh all reviews
    if (!isWatched && movie && user) {
      try {
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
          if (isInWatchlist) {
            await toggleWatchlist(true); // Remove from watchlist if needed
          }
        } else {
          console.error('Failed to mark as watched when submitting review');
        }
      } catch (err) {
        console.error('Error marking as watched after review:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/4 mx-auto"></div>
          </div>
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
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white">{movie.title}</h1>
                {movie.year && (
                  <p className="text-xl text-gray-300">({movie.year})</p>
                )}
              </div>
              
              {/* Status Badges */}
              {user && (
                <div className="flex items-center gap-2 ml-4">
                  {isWatched && (
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Watched
                    </span>
                  )}
                  {isInWatchlist && !isWatched && (
                    <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      ✓ In Watchlist
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
            {user ? (
  <div className="flex gap-3 flex-wrap">
    {/* Watched Button */}
    <button 
      onClick={toggleWatched}
      disabled={watchedLoading}
      className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
        isWatched 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      } ${watchedLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {watchedLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Updating...</span>
        </>
      ) : (
        <>
          {isWatched ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Watched</span>
            </>
          ) : (
            <>
              <Eye className="w-5 h-5" />
              <span>Mark as Watched</span>
            </>
          )}
        </>
      )}
    </button>

    {/* Watchlist Button - Only show if not watched */}
    {!isWatched && (
      <button 
        onClick={() => toggleWatchlist()}
        disabled={watchlistLoading}
        className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
          isInWatchlist 
            ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
            : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
        } ${watchlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {watchlistLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Updating...</span>
          </>
        ) : (
          <>
            <PlusCircle className="w-5 h-5" />
            <span>{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
          </>
        )}
      </button>
    )}
  </div>
) : (
  <div className="bg-gray-700 rounded-lg p-4">
    <p className="text-gray-300 mb-3">Sign in to track this movie</p>
    <button
      onClick={() => navigate('/sign-in')}
      className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition"
    >
      Sign In
    </button>
  </div>
)}
          </div>
        </div>
      </div>
      {/* Reviews Section */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-white mb-6">Reviews</h3>
          
          {/* User's Review */}
          {userReview && (
            <div className="mb-6 p-4 bg-gray-700 rounded-lg border-2 border-yellow-600">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">Your Review</span>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < userReview.score ? '' : 'opacity-30'}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {new Date(userReview.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="text-yellow-400 hover:text-yellow-300 text-sm"
                >
                  Edit
                </button>
              </div>
              {userReview.review && (
                <p className="text-gray-300 mt-2">{userReview.review}</p>
              )}
            </div>
          )}
          {/* All Reviews */}
          {reviewsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading reviews...</p>
            </div>
          ) : allReviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No reviews yet. Be the first to review!</p>
              {user && !userReview && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Write a Review
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {allReviews.filter(r => r.user.id !== user?.id).map((review) => (
                <div key={review.id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {review.user.username || review.user.email.split('@')[0]}
                        </span>
                        <div className="flex text-yellow-400 text-sm">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < review.score ? '' : 'opacity-30'}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {new Date(review.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {review.review && (
                    <p className="text-gray-300 mt-2">{review.review}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Review Modal */}
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          movie={movie}
          existingReview={userReview}
          onReviewSubmit={handleReviewSubmit}
        />
    </div>
  );
}

export default MovieDetail;