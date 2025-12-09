import os

def safe_remove(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass
