// src/App.jsx
import { SignIn, SignUp, SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import MovieDetail from './pages/MovieDetail'
import Profile from './pages/Profile'
import Watchlist from './pages/WatchList'  // Fixed: lowercase 'list'

function App() {
  const { user } = useUser()
  
  // Sync user with database when they sign in
  useEffect(() => {
    if (user) {
      // Create/update user in database
      console.log('User signed in:', user)
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      }).catch(error => {
        console.error('User sync failed:', error)
      })
    }
  }, [user])

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        {/* Navigation Header */}
        <header className="bg-gray-800 shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🎬</span>
                <span className="text-xl font-bold text-yellow-400">JumboBoxd</span>
              </Link>
              
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center space-x-6">
                <SignedIn>
                  <Link to="/" className="text-gray-300 hover:text-white transition">
                    Browse
                  </Link>
                  <Link to="/watchlist" className="text-gray-300 hover:text-white transition">
                    Watchlist
                  </Link>
                  <Link to="/profile" className="text-gray-300 hover:text-white transition">
                    Profile
                  </Link>
                </SignedIn>
              </nav>
              
              {/* User Menu */}
              <div className="flex items-center space-x-4">
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
                <SignedOut>
                  <Link 
                    to="/sign-up" 
                    className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition"
                  >
                    Sign Up
                  </Link>
                  <Link 
                    to="/sign-in" 
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition"
                  >
                    Sign In
                  </Link>
                </SignedOut>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Public Routes */}
            <Route path="/sign-in/*" element={
              <div className="flex justify-center items-center min-h-[60vh]">
                <SignIn afterSignInUrl="/" signUpUrl="/sign-up" />
              </div>
            } />
            
            <Route path="/sign-up/*" element={
              <div className="flex justify-center items-center min-h-[60vh]">
                <SignUp afterSignUpUrl="/" signInUrl="/sign-in" />
              </div>
            } />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <>
                <SignedOut>
                  <div className="text-center py-20">
                    <h1 className="text-5xl font-bold text-white mb-4">
                      Welcome to JumboBoxd
                    </h1>
                    <p className="text-xl text-gray-400 mb-8">
                      Track movies you've watched. Save those you want to see.
                    </p>
                    <div className="space-x-4">
                      <Link 
                        to="/sign-up"
                        className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-yellow-300 transition inline-block"
                      >
                        Get Started
                      </Link>
                      <Link 
                        to="/sign-in"
                        className="bg-gray-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition inline-block"
                      >
                        Sign In
                      </Link>
                    </div>
                  </div>
                </SignedOut>
                <SignedIn>
                  <Home />
                </SignedIn>
              </>
            } />
            
            <Route path="/movie/:id" element={
              <SignedIn>
                <MovieDetail />
              </SignedIn>
            } />
            
            <Route path="/profile" element={
              <SignedIn>
                <Profile />
              </SignedIn>
            } />
            
            <Route path="/watchlist" element={
              <SignedIn>
                <Watchlist />
              </SignedIn>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App