import os
import httpx
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import engine, get_db, Base
from models import User, Book, UserBook
from schemas import (
    UserCreate, UserResponse, TokenResponse,
    UserBookCreate, UserBookUpdate, UserBookResponse,
)
from auth import hash_password, verify_password, create_access_token, decode_access_token

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://bookshelf-two-tau.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Auth dependency ---

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ")[1]
    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# --- Auth routes ---

@app.post("/api/register", response_model=UserResponse, status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    db_user = User(
        username=user.username,
        password_hash=hash_password(user.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/login", response_model=TokenResponse)
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(db_user.id)
    return {"access_token": token, "token_type": "bearer"}


# --- Open Library search (proxied through our backend) ---

@app.get("/api/search")
async def search_books(q: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://openlibrary.org/search.json",
            params={"q": q, "limit": 8, "fields": "key,title,author_name,first_publish_year,cover_i"},
        )
        data = response.json()

    results = []
    for doc in data.get("docs", []):
        olid = doc.get("key", "").replace("/works/", "")
        cover_i = doc.get("cover_i")
        results.append({
            "olid": olid,
            "title": doc.get("title", "Unknown Title"),
            "author": doc.get("author_name", ["Unknown Author"])[0],
            "first_publish_year": doc.get("first_publish_year"),
            "cover_url": f"https://covers.openlibrary.org/b/id/{cover_i}-M.jpg" if cover_i else None,
        })

    return results


# --- User's bookshelf ---

@app.get("/api/shelf", response_model=list[UserBookResponse])
def get_shelf(
    status: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(UserBook).filter(UserBook.user_id == current_user.id)
    if status:
        query = query.filter(UserBook.status == status)
    return query.order_by(UserBook.created_at.desc()).all()

@app.post("/api/shelf", response_model=UserBookResponse, status_code=201)
def add_to_shelf(
    user_book: UserBookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find or create the canonical book by Open Library ID
    book = db.query(Book).filter(Book.olid == user_book.olid).first()
    if not book:
        book = Book(
            title=user_book.title,
            author=user_book.author,
            olid=user_book.olid,
            cover_url=user_book.cover_url,
            first_publish_year=user_book.first_publish_year,
        )
        db.add(book)
        db.flush()

    # Check if already on shelf
    existing = (
        db.query(UserBook)
        .filter(UserBook.user_id == current_user.id, UserBook.book_id == book.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Book already on your shelf")

    db_user_book = UserBook(
        user_id=current_user.id,
        book_id=book.id,
        status=user_book.status,
        rating=user_book.rating,
        notes=user_book.notes,
    )
    db.add(db_user_book)
    db.commit()
    db.refresh(db_user_book)
    return db_user_book

@app.patch("/api/shelf/{user_book_id}", response_model=UserBookResponse)
def update_shelf_entry(
    user_book_id: int,
    updates: UserBookUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_user_book = (
        db.query(UserBook)
        .filter(UserBook.id == user_book_id, UserBook.user_id == current_user.id)
        .first()
    )
    if not db_user_book:
        raise HTTPException(status_code=404, detail="Not found")
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(db_user_book, key, value)
    db.commit()
    db.refresh(db_user_book)
    return db_user_book

@app.delete("/api/shelf/{user_book_id}", status_code=204)
def remove_from_shelf(
    user_book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_user_book = (
        db.query(UserBook)
        .filter(UserBook.id == user_book_id, UserBook.user_id == current_user.id)
        .first()
    )
    if not db_user_book:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(db_user_book)
    db.commit()