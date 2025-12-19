import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

STORAGE_DIR = Path(os.getenv("STORAGE_DIR", str(BASE_DIR / "storage")))
DATA_DIR = Path(os.getenv("DATA_DIR", str(BASE_DIR / "data")))

FAISS_INDEX_PATH = Path(os.getenv("FAISS_INDEX_PATH", str(STORAGE_DIR / "comic_faiss.index")))
METADATA_PATH = Path(os.getenv("METADATA_PATH", str(STORAGE_DIR / "comic_faiss_metadata.json")))

FAQ_JSON_PATH = Path(os.getenv("FAQ_JSON_PATH", str(DATA_DIR / "faq.json")))

EMBEDDING_MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL_NAME",
    "sentence-transformers/paraphrase-multilingual-mpnet-base-v2",
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL_NAME = os.getenv("GROQ_MODEL_NAME", "llama-3.1-8b-instant")

TOP_K_CANDIDATES = int(os.getenv("TOP_K_CANDIDATES", "10"))
TOP_N_FINAL = int(os.getenv("TOP_N_FINAL", "3"))

FAQ_TOP_K = int(os.getenv("FAQ_TOP_K", "1"))
FAQ_MIN_SCORE = float(os.getenv("FAQ_MIN_SCORE", "2.0"))

SOCIAL_SKIP_GEMINI = os.getenv("SOCIAL_SKIP_GEMINI", "1") == "1"
