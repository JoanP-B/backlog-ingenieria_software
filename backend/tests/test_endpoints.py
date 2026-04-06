import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Job Matcher API is running"}

def test_login_for_access_token():
    response = client.post(
        "/token",
        data={"username": "testuser", "password": "testpassword"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_calculate_score_unauthorized():
    response = client.post(
        "/score",
        json={
            "candidate": {
                "id": "c1",
                "name": "Alice",
                "skills": ["Python", "SQL"],
                "experience_years": 3
            },
            "job": {
                "id": "j1",
                "title": "Backend Dev",
                "required_skills": ["Python", "Docker"],
                "min_experience_years": 2
            }
        }
    )
    assert response.status_code == 401
