import { useState, useEffect } from 'react'
import api from '../api'
import BookForm from './BookForm'
import BookItem from './BookItem'

function BookList({ onLogout }) {
  const [books, setBooks] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  async function fetchBooks() {
    try {
      const params = {}
      if (statusFilter) {
        params.status = statusFilter
      }
      const response = await api.get('/api/shelf', { params })
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
  }, [statusFilter])

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

      <div className="filters">
        {['', 'want_to_read', 'reading', 'read'].map((status) => (
          <button
            key={status}
            className={statusFilter === status ? 'filter-active' : 'filter-button'}
            onClick={() => setStatusFilter(status)}
          >
            {status === '' ? 'All' : status === 'want_to_read' ? 'Want to Read' : status === 'reading' ? 'Reading' : 'Read'}
          </button>
        ))}
      </div>

      {showForm && (
        <BookForm
          entry={editingEntry}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditingEntry(null) }}
        />
      )}

      {books.length === 0 ? (
        <p>No books match this filter.</p>
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