import { useState, useEffect } from 'react'
import api from '../api'

function BookForm({ entry, onSaved, onCancel }) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedBook, setSelectedBook] = useState(null)
  const [searching, setSearching] = useState(false)
  const [status, setStatus] = useState(entry?.status || 'want_to_read')
  const [rating, setRating] = useState(entry?.rating || '')
  const [notes, setNotes] = useState(entry?.notes || '')
  const [error, setError] = useState('')

  const isEditing = !!entry

  useEffect(() => {
    if (isEditing || query.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const response = await api.get('/api/search', {
          params: { q: query },
        })
        setSearchResults(response.data)
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query, isEditing])

  function selectBook(book) {
    setSelectedBook(book)
    setQuery('')
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
        if (!selectedBook) {
          setError('Please search for and select a book')
          return
        }
        await api.post('/api/shelf', {
          olid: selectedBook.olid,
          title: selectedBook.title,
          author: selectedBook.author,
          cover_url: selectedBook.cover_url,
          first_publish_year: selectedBook.first_publish_year,
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

        {!isEditing && !selectedBook && (
          <div>
            <label>Search for a book</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a title or author..."
            />
            {searching && <p className="searching">Searching Open Library...</p>}
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((book) => (
                  <div
                    key={book.olid}
                    className="search-result-item"
                    onClick={() => selectBook(book)}
                  >
                    {book.cover_url && (
                      <img
                        src={book.cover_url}
                        alt=""
                        className="search-result-cover"
                      />
                    )}
                    <div>
                      <strong>{book.title}</strong>
                      <br />
                      <span className="search-result-author">
                        {book.author}
                        {book.first_publish_year && ` (${book.first_publish_year})`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isEditing && selectedBook && (
          <div className="selected-book">
            <div className="selected-book-info">
              {selectedBook.cover_url && (
                <img
                  src={selectedBook.cover_url}
                  alt=""
                  className="selected-book-cover"
                />
              )}
              <div>
                <strong>{selectedBook.title}</strong>
                <br />
                <span>{selectedBook.author}</span>
                {selectedBook.first_publish_year && (
                  <span> ({selectedBook.first_publish_year})</span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="change-book-button"
              onClick={() => setSelectedBook(null)}
            >
              Change
            </button>
          </div>
        )}

        {isEditing && (
          <div className="selected-book">
            <div className="selected-book-info">
              {entry.book.cover_url && (
                <img
                  src={entry.book.cover_url}
                  alt=""
                  className="selected-book-cover"
                />
              )}
              <div>
                <strong>{entry.book.title}</strong>
                <br />
                <span>{entry.book.author}</span>
              </div>
            </div>
          </div>
        )}

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