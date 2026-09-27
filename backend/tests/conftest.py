import os

# Ensure a safe, self-contained environment for tests before the app imports.
# The async engine is created lazily, so a dummy URL is fine for unit-level tests
# that never open a real DB connection.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://test:test@localhost:5432/test_db",
)
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production")
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("GEMINI_API_KEY", "")
