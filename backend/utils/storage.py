import os
import uuid
from abc import ABC, abstractmethod


class StorageBackend(ABC):
    @abstractmethod
    def save(self, file_data, filename):
        """Save file and return URL."""
        pass

    @abstractmethod
    def delete(self, url):
        """Delete file by URL."""
        pass


class LocalStorage(StorageBackend):
    def __init__(self, upload_dir='uploads'):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)

    def save(self, file_data, filename):
        filepath = os.path.join(self.upload_dir, filename)
        if hasattr(file_data, 'save'):
            file_data.save(filepath)
        else:
            with open(filepath, 'wb') as f:
                f.write(file_data)
        return f'/uploads/{filename}'

    def delete(self, url):
        filename = url.split('/')[-1]
        filepath = os.path.join(self.upload_dir, filename)
        if os.path.exists(filepath):
            os.remove(filepath)


def get_storage():
    backend = os.environ.get('STORAGE_BACKEND', 'local')
    if backend == 'local':
        upload_dir = os.environ.get('UPLOAD_DIR', 'uploads')
        return LocalStorage(upload_dir)
    raise ValueError(f'Unknown storage backend: {backend}')
