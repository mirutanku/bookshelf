import { useState, useEffect } from 'react'
import api from '../api'

function BookForm({ entry, onSaved, onCancel }) {
  const [title, setTitle] = useState(entry?.book?.title || '')
  const [author, setAuthor] = useState(entry?.book?.author || '')
  const [status, setStatus] = useState(entry?.status || 'want_to_read')
  const [rating, setRating] = useState(entry?.rating || '')
  const [notes, setNotes] = useState(entry?.notes || '')
  const [error, setError] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const isEditing = !!entry

  useEffect(() => {
    if (isEditing || title.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const response = await api.get('/api/books/search', {
          params: { q: title },
        })
        setSearchResults(response.data)
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [title, isEditing])

  function selectBook(book) {
    setTitle(book.title)
    setAuthor(book.author)
    setSearchResults([])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      if (isEditing) {
        await api.patch(`/api/shelf/${entry.id}`, {
          status,
          rating: rating === '' ? null : parseInt(rating),
          notes: notes || null,
        })
      } else {
        await api.post('/api/shelf', {
          title,
          author,
          status,
          rating: rating === '' ? null : parseInt(rating),
          notes: notes || null,
        })
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    }
  }

  return (
    <div className="book-form">
      <h3>{isEditing ? 'Edit Entry' : 'Add a Book'}</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isEditing}
            required
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((book) => (
                <div
                  key={book.id}
                  className="search-result-item"
                  onClick={() => selectBook(book)}
                >
                  <strong>{book.title}</strong> by {book.author}
                  <span className="reader-count">
                    {book.reader_count} {book.reader_count === 1 ? 'reader' : 'readers'}
                  </span>
                </div>
              ))}
            </div>
          )}
          {searching && <p className="searching">Searching...</p>}
        </div>
        <div>
          <label>Author</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            disabled={isEditing}
            required
          />
        </div>
        <div>
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="want_to_read">Want to Read</option>
            <option value="reading">Reading</option>
            <option value="read">Read</option>
          </select>
        </div>
        <div>
          <label>Rating (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          />
        </div>
        <div>
          <label>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <div className="form-buttons">
          <button type="submit">{isEditing ? 'Save Changes' : 'Add Book'}</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default BookForm