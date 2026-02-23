function BookItem({ entry, onEdit, onDelete }) {
  const statusLabels = {
    want_to_read: 'Want to Read',
    reading: 'Reading',
    read: 'Read',
  }

  return (
    <div className="book-item">
      {entry.book.cover_url && (
        <img
          src={entry.book.cover_url}
          alt=""
          className="book-cover"
        />
      )}
      <div className="book-info">
        <h3>{entry.book.title}</h3>
        <p className="book-author">by {entry.book.author}</p>
        {entry.book.first_publish_year && (
          <p className="book-year">{entry.book.first_publish_year}</p>
        )}
        <p className="book-status">{statusLabels[entry.status] || entry.status}</p>
        {entry.rating && (
          <p className="book-rating">{'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}</p>
        )}
        {entry.notes && <p className="book-notes">{entry.notes}</p>}
      </div>
      <div className="book-actions">
        <button onClick={onEdit}>Edit</button>
        <button className="delete-button" onClick={onDelete}>Delete</button>
      </div>
    </div>
  )
}

export default BookItem