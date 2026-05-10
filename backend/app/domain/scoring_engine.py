class ScoringEngine:
    @staticmethod
    def calculate_skill_score(candidate_skills: list[str], required_skills: list[str]) -> tuple[float, int, int]:
        """
        Calculates the skill match percentage.
        Returns a tuple: (score_percentage, matched_count, total_required)
        """
        if not required_skills:
            return 0.0, 0, 0
            
        # Standardize for case-insensitive matching
        c_skills = {s.lower().strip() for s in candidate_skills}
        r_skills = {s.lower().strip() for s in required_skills}
        
        matched_skills = c_skills.intersection(r_skills)
        match_count = len(matched_skills)
        total_required = len(r_skills)
        
        score = (match_count / total_required * 100) if total_required > 0 else 0.0
        return round(score, 2), match_count, total_required

    @staticmethod
    def calculate_experience_score(candidate_experience: int, required_experience: int) -> float:
        """
        Calculates the experience match percentage.
        """
        if required_experience <= 0:
            return 100.0 if candidate_experience >= 0 else 0.0
            
        if candidate_experience >= required_experience:
            return 100.0
            
        score = (candidate_experience / required_experience) * 100
        return round(score, 2)

    @classmethod
    def compute_final_match(cls, candidate_skills: list[str], candidate_experience: int, 
                            required_skills: list[str], required_experience: int) -> dict:
        """
        Computes the final weighted score for a candidate against a job.
        Weights: 70% Skills, 30% Experience.
        Returns a dictionary with full scoring details.
        """
        skill_score, matched_count, total_required = cls.calculate_skill_score(candidate_skills, required_skills)
        experience_score = cls.calculate_experience_score(candidate_experience, required_experience)
        
        # Weights
        final_score = (skill_score * 0.7) + (experience_score * 0.3)
        final_score = round(final_score, 2)
        
        # Determine explicitly which skills matched
        c_skills = {s.lower().strip() for s in candidate_skills}
        matched_skill_names = [s for s in required_skills if s.lower().strip() in c_skills]

        return {
            "final_score": final_score,
            "skill_score": skill_score,
            "experience_score": experience_score,
            "skill_match_count": matched_count,
            "total_required": total_required,
            "matched_skills": matched_skill_names
        }
