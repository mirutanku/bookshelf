import { useState, useEffect } from 'react'
import api from '../api'
import BookForm from './BookForm'
import BookItem from './BookItem'

function BookList({ onLogout }) {
  const [books, setBooks] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchBooks() {
    try {
      const response = await api.get('/api/shelf')
      setBooks(response.data)
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout()
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  async function handleDelete(userBookId) {
    try {
      await api.delete(`/api/shelf/${userBookId}`)
      setBooks(books.filter((b) => b.id !== userBookId))
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  function handleSaved() {
    setShowForm(false)
    setEditingEntry(null)
    fetchBooks()
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="book-list">
      <div className="header">
        <h2>My Bookshelf</h2>
        <div>
          <button onClick={() => { setEditingEntry(null); setShowForm(true) }}>
            Add Book
          </button>
          <button className="logout-button" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </div>

      {showForm && (
        <BookForm
          entry={editingEntry}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditingEntry(null) }}
        />
      )}

      {books.length === 0 ? (
        <p>No books yet. Add your first one!</p>
      ) : (
        books.map((entry) => (
          <BookItem
            key={entry.id}
            entry={entry}
            onEdit={() => { setEditingEntry(entry); setShowForm(true) }}
            onDelete={() => handleDelete(entry.id)}
          />
        ))
      )}
    </div>
  )
}

export default BookList