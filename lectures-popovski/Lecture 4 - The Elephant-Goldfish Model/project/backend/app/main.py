from fastapi import FastAPI

from app.routers import books

app = FastAPI(title="Book Review API", version="0.1.0")

app.include_router(books.router)


@app.get("/health")
def health():
    return {"status": "ok"}
