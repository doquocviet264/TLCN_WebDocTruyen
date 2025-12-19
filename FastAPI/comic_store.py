import json
import os
from typing import Any, Dict, List, Optional, Tuple

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from config import EMBEDDING_MODEL_NAME, FAISS_INDEX_PATH, METADATA_PATH, TOP_K_CANDIDATES


class ComicStore:
    def __init__(self):
        if not os.path.exists(FAISS_INDEX_PATH) or not os.path.exists(METADATA_PATH):
            raise FileNotFoundError(
                f"Missing index/metadata. Expected: {FAISS_INDEX_PATH} and {METADATA_PATH}"
            )

        self.embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)
        self.index = faiss.read_index(str(FAISS_INDEX_PATH))

        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            meta = json.load(f)

        self.items: List[Dict[str, Any]] = meta.get("items", [])
        self.count = len(self.items)

    def search(self, query: str, top_k: int = TOP_K_CANDIDATES) -> Tuple[List[Dict[str, Any]], List[float]]:
        q = (query or "").strip()
        if not q:
            return [], []

        q_vec = self.embedder.encode([q], convert_to_numpy=True).astype("float32")
        faiss.normalize_L2(q_vec)

        D, I = self.index.search(q_vec, top_k)

        candidates: List[Dict[str, Any]] = []
        scores: List[float] = []

        for score, idx in zip(D[0].tolist(), I[0].tolist()):
            if 0 <= idx < self.count:
                candidates.append(self.items[idx])
                scores.append(float(score))

        return candidates, scores
