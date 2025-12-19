from typing import Dict, Any, List
from sentence_transformers import SentenceTransformer
import mysql.connector
from mysql.connector import Error
import numpy as np
import faiss
import json
import os

MYSQL_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "1234",
    "database": "comic_app",
    "port": 3306,
}

EMBEDDING_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"

FAISS_INDEX_PATH = "storage/comic_faiss.index"
METADATA_PATH = "storage/comic_faiss_metadata.json"

BATCH_SIZE = 128


def build_comic_profile(row: Dict[str, Any]) -> str:
    title = row.get("title") or ""
    slug = row.get("slug") or ""
    description = row.get("description") or ""
    status = row.get("status") or ""
    genre = row.get("genre") or ""
    alt_names = row.get("alternateNames") or ""
    chapter_count = row.get("chapterCount") or 0

    if chapter_count < 30:
        length_category = "short"
    elif chapter_count < 100:
        length_category = "medium"
    else:
        length_category = "long"

    profile = f"""
Title: {title}
Slug: {slug}
Alternate Names: {alt_names}
Genre: {genre}
Status: {status}
Chapters: {chapter_count} ({length_category} series)
Summary: {description}
""".strip()

    return profile


def fetch_comics_from_mysql(mysql_config: Dict[str, Any]) -> List[Dict[str, Any]]:
    conn = mysql.connector.connect(**mysql_config)
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT
            c.comicId,
            c.slug,
            c.title,
            c.description,
            c.status,

            COUNT(DISTINCT ch.chapterId) AS chapterCount,

            GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', ') AS genre,

            GROUP_CONCAT(DISTINCT an.name ORDER BY an.name SEPARATOR '; ') AS alternateNames

        FROM Comic c

        LEFT JOIN Chapters ch 
            ON ch.comicId = c.comicId

        LEFT JOIN GenreComic gc 
            ON gc.comicId = c.comicId
        LEFT JOIN Genre g 
            ON g.genreId = gc.genreId

        LEFT JOIN AlternateNames an 
            ON an.comicId = c.comicId

        WHERE c.comicId BETWEEN 3 AND 1131

        GROUP BY
            c.comicId,
            c.slug,
            c.title,
            c.description,
            c.status

        ORDER BY c.comicId;
    """

    cursor.execute(query)
    comics = cursor.fetchall()

    cursor.close()
    conn.close()
    return comics


def train_and_save_faiss():
    try:
        os.makedirs("storage", exist_ok=True)

        print(f"[INFO] Loading embedding model: {EMBEDDING_MODEL_NAME}")
        model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        embedding_dim = model.get_sentence_embedding_dimension()
        print(f"[INFO] Embedding dimension: {embedding_dim}")

        print("[INFO] Fetching comics from MySQL...")
        comics = fetch_comics_from_mysql(MYSQL_CONFIG)
        print(f"[INFO] Fetched {len(comics)} comics")

        if not comics:
            print("[WARN] No comics found. Abort.")
            return

        profiles: List[str] = []
        metadata_list: List[Dict[str, Any]] = []

        for row in comics:
            profiles.append(build_comic_profile(row))
            metadata_list.append(
                {
                    "comicId": int(row.get("comicId")),
                    "title": row.get("title"),
                    "slug": row.get("slug"),
                    "genre": row.get("genre") or "",
                    "alternateNames": row.get("alternateNames") or "",
                    "status": row.get("status"),
                    "chapterCount": int(row.get("chapterCount") or 0),
                    "description": row.get("description") or "",
                }
            )

        print("[INFO] Encoding embeddings...")
        all_embeddings = []
        total = len(profiles)

        for start in range(0, total, BATCH_SIZE):
            end = min(start + BATCH_SIZE, total)
            batch_profiles = profiles[start:end]
            batch_emb = model.encode(batch_profiles, convert_to_numpy=True)
            all_embeddings.append(batch_emb)
            print(f"[INFO] Encoded {end}/{total} profiles")

        embeddings = np.vstack(all_embeddings).astype("float32")
        print(f"[INFO] Final embeddings shape: {embeddings.shape}")

        faiss.normalize_L2(embeddings)

        print("[INFO] Building FAISS index...")
        index = faiss.IndexFlatIP(embedding_dim)
        index.add(embeddings)
        print(f"[INFO] Indexed {index.ntotal} vectors")

        print(f"[INFO] Saving FAISS index to '{FAISS_INDEX_PATH}'...")
        faiss.write_index(index, FAISS_INDEX_PATH)

        print(f"[INFO] Saving metadata to '{METADATA_PATH}'...")
        with open(METADATA_PATH, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "embedding_model": EMBEDDING_MODEL_NAME,
                    "count": len(metadata_list),
                    "items": metadata_list,
                },
                f,
                ensure_ascii=False,
                indent=2,
            )

        print("[DONE] Training/indexing finished.")
        print(f"[DONE] Saved FAISS index + metadata for {len(metadata_list)} comics.")

    except Error as e:
        print("[MYSQL ERROR]", e)
    except Exception as e:
        print("[ERROR]", e)


if __name__ == "__main__":
    train_and_save_faiss()
