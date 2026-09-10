# AnoSay

AnoSay is an anonymous campus sharing API where students can submit thoughts, experiences, or stories without publicly showing their identity.

## Tech Stack

- **Backend-only** REST API
- **FastAPI**
- PostgreSQL and MongoDB will be added in later phases

## Project Setup

### 1. Create a virtual environment

```bash
python -m venv .venv
```

### 2. Activate the virtual environment

```bash
# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the server

```bash
uvicorn app.main:app --reload
```

### 5. Open the docs

Visit [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) in your browser.
