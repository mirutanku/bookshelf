import { useState, useEffect } from 'react'
import LoginForm from './components/LoginForm'
import BookList from './components/BookList'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
    }
  }, [])

  function handleLogin() {
    setIsLoggedIn(true)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
  }

  return (
    <div className="app">
      <h1>📚 Bookshelf</h1>
      {isLoggedIn ? (
        <BookList onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App