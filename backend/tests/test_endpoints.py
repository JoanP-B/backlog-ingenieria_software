from fastapi.testclient import TestClient

from app.main import app
from app.domain.scoring_engine import ScoringEngine

client = TestClient(app)


# --- Root endpoint ---
def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"mensaje": "API de Vacantes activa."}


# --- Auth guard: /score requires a valid token ---
def test_calculate_score_unauthorized():
    response = client.post(
        "/score",
        json={
            "candidate": {
                "id": 1,
                "user_id": 1,
                "name": "Alice",
                "skills": ["Python", "SQL"],
                "experience_years": 3,
            },
            "job": {
                "id": "j1",
                "title": "Backend Dev",
                "company": "ACME",
                "required_skills": ["Python", "Docker"],
                "min_experience_years": 2,
            },
        },
    )
    assert response.status_code == 401


def test_login_requires_credentials():
    # Empty credentials should be rejected with 400 before touching the DB.
    response = client.post("/token", data={"username": "", "password": ""})
    assert response.status_code == 400


def test_score_preview_no_auth_no_db():
    # /score/preview no requiere autenticación ni DB: usa solo el ScoringEngine.
    response = client.post(
        "/score/preview",
        json={
            "candidate": {"skills": ["Python", "SQL"], "experience_years": 2},
            "jobs": [
                {
                    "id": "j1",
                    "title": "Backend Dev",
                    "company": "ACME",
                    "min_experience_years": 4,
                    "required_skills": ["Python", "SQL"],
                }
            ],
        },
    )
    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 1
    # skills 100 * 0.7 + experiencia 50 * 0.3 = 85.0
    assert results[0]["job_id"] == "j1"
    assert results[0]["score"] == 85.0
    assert results[0]["skill_match_count"] == 2
