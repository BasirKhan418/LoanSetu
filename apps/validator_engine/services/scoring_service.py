from typing import List, Dict


def calculate_risk_score(flags: List[str], risk_weights: Dict[str, int]) -> int:
    score = 0
    for f in flags:
        score += risk_weights.get(f, 5)  # default small weight
    return min(score, 100)
