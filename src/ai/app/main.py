from fastapi import FastAPI

app = FastAPI(
    title="Masar AI Service",
    description="AI service for the Masar career guidance system.",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {"status": "ok"}
