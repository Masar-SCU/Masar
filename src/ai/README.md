# Masar AI Service

The AI service for Masar, an intelligent career guidance and skill-gap analysis system for Computer Science students.

This initial scaffold provides a minimal FastAPI application to support local development and Docker Compose integration.

## Requirements

* Python 3.12 or later
* Docker Desktop (for containerized execution)

## Project Structure

```text
src/ai/
├── app/
│   ├── __init__.py
│   └── main.py
├── requirements.txt
├── Dockerfile
├── .dockerignore
└── README.md
```

## Local Development

Run the following commands from the `src/ai` directory.

### 1. Create a virtual environment

```bash
python -m venv .venv
```

### 2. Activate the virtual environment

Windows Command Prompt:

```cmd
.venv\Scripts\activate
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Start the development server

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 5. Verify the service

Health check endpoint:

`http://127.0.0.1:8000/health`

Expected response:

```json
{"status": "ok"}
```

Interactive API documentation:

`http://127.0.0.1:8000/docs`

## Docker

Run the following commands from the repository root.

### 1. Build the image

```bash
docker build -t masar-ai:latest ./src/ai
```

### 2. Start the container

```bash
docker run -d --name masar-ai-container -p 8000:8000 masar-ai:latest
```

### 3. Verify the container

```bash
docker ps
docker logs masar-ai-container
```

Check the health endpoint:

`http://127.0.0.1:8000/health`

### 4. Stop and remove the container

```bash
docker stop masar-ai-container
docker rm masar-ai-container
```

## Scope

This scaffold provides the initial HTTP service and container setup. Career matching, skill extraction, recommendation models, roadmap generation, and AI mentoring will be implemented in later development stages.
