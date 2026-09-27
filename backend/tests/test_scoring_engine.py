from app.domain.scoring_engine import ScoringEngine


# --- Skill scoring ---
def test_skill_score_full_match():
    score, matched, total = ScoringEngine.calculate_skill_score(
        ["Python", "SQL"], ["python", "sql"]
    )
    assert score == 100.0
    assert matched == 2
    assert total == 2


def test_skill_score_partial_match_is_case_insensitive():
    score, matched, total = ScoringEngine.calculate_skill_score(
        ["Python", "Java"], ["PYTHON", "Docker"]
    )
    assert matched == 1
    assert total == 2
    assert score == 50.0


def test_skill_score_no_required_skills():
    score, matched, total = ScoringEngine.calculate_skill_score(["Python"], [])
    assert score == 0.0
    assert matched == 0
    assert total == 0


# --- Experience scoring ---
def test_experience_meets_requirement():
    assert ScoringEngine.calculate_experience_score(5, 3) == 100.0


def test_experience_below_requirement():
    assert ScoringEngine.calculate_experience_score(1, 4) == 25.0


def test_experience_no_requirement():
    assert ScoringEngine.calculate_experience_score(0, 0) == 100.0


# --- Final weighted match (70% skills, 30% experience) ---
def test_final_match_weights():
    result = ScoringEngine.compute_final_match(
        candidate_skills=["Python", "SQL"],
        candidate_experience=2,
        required_skills=["Python", "SQL"],
        required_experience=4,
    )
    # skills 100 * 0.7 + experience 50 * 0.3 = 85.0
    assert result["final_score"] == 85.0
    assert result["skill_score"] == 100.0
    assert result["experience_score"] == 50.0
    assert result["matched_skills"] == ["Python", "SQL"]
