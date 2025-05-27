import { SignIn, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 shadow-lg">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-yellow-400">JumboBoxd</h1>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <SignedOut>
            <div className="flex justify-center items-center min-h-[60vh]">
              <SignIn />
            </div>
          </SignedOut>
          
          <SignedIn>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </SignedIn>
        </main>
      </div>
    </Router>
  )
}

// Placeholder components with Tailwind styling
function Home() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Popular Movies</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Movie cards will go here */}
        <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
          <div className="bg-gray-600 h-64 rounded mb-2"></div>
          <h3 className="font-medium">Movie Title</h3>
        </div>
      </div>
    </div>
  )
}

function MovieDetail() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-3xl font-bold mb-4">Movie Title</h2>
        <p className="text-gray-300">Movie details will appear here</p>
      </div>
    </div>
  )
}

function Profile() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">My Profile</h2>
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-300">Your watched movies and ratings will appear here</p>
      </div>
    </div>
  )
}

export default App