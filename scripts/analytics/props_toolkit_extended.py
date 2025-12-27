# ================================================================================
# NBA PLAYER PROPS TOOLKIT - EXPANDED SCRIPTS (10 New Scripts)
# ================================================================================
# Scripts #51 to #60 - Designed to integrate with your v3.0 toolkit
# Includes: Odds Simulator, Prop-Specific, Monte Carlo, Advanced Metrics, ML Ensemble,
#           and the 5 additional proposed expansions
# ================================================================================

import numpy as np
import pandas as pd
from scipy.stats import norm, skewnorm
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import logging
import math
from typing import Dict, List, Union, Optional

# Assume your existing utilities are available (validate_ppg, clamp_value, safe_divide, logger, etc.)
# If not, they are used as-is from your original code

logger = logging.getLogger(__name__)

# ================================================================================
# SCRIPT #51: ODDS SIMULATOR (Reverse-Engineered Sportsbook Logic)
# ================================================================================

class Script51_OddsSimulator:
    """Simulate how sportsbooks set odds with vig and public shading."""
    
    @staticmethod
    def set_odds(
        true_mean: float,
        true_std: float,
        line: float,
        vig: float = 0.0455,
        public_bias: float = 0.02
    ) -> Dict[str, Union[float, int]]:
        """Return simulated sportsbook odds and house EV."""
        try:
            true_p_over = 1 - norm.cdf(line, true_mean, true_std)
            adj_p_over = true_p_over + public_bias
            total_prob = adj_p_over + (1 - adj_p_over) + vig
            book_p_over = adj_p_over / total_prob
            book_p_under = 1 - book_p_over
            
            def american_odds(p):
                if p >= 0.5:
                    return int(-100 * p / (1 - p)) if p < 1 else -100000
                else:
                    return int(100 * (1 - p) / p)
            
            return {
                'true_p_over': round(true_p_over, 3),
                'book_p_over': round(book_p_over, 3),
                'odds_over': american_odds(book_p_over),
                'odds_under': american_odds(book_p_under),
                'house_ev_pct': round((book_p_over + (1 - book_p_over) - 1) * 100, 2)
            }
        except Exception as e:
            logger.error(f"Script51 error: {e}")
            raise

# ================================================================================
# SCRIPT #52: PROP-SPECIFIC PROJECTIONS (Assists, Rebounds, etc.)
# ================================================================================

class Script52_PropSpecific:
    @staticmethod
    def calculate(
        prop_type: str,
        player_position: str,
        team_prop_avg: float,
        pace_mult: float = 1.0,
        other_factors: float = 1.0
    ) -> float:
        pos_shares = {
            'assists': {'PG': 0.35, 'SG': 0.15, 'SF': 0.12, 'PF': 0.10, 'C': 0.08},
            'rebounds': {'PG': 0.05, 'SG': 0.08, 'SF': 0.12, 'PF': 0.20, 'C': 0.30},
            'steals': {'PG': 0.25, 'SG': 0.20, 'SF': 0.15, 'PF': 0.10, 'C': 0.05},
            'blocks': {'PG': 0.05, 'SG': 0.08, 'SF': 0.10, 'PF': 0.15, 'C': 0.30},
        }
        prop_type = prop_type.lower()
        if prop_type not in pos_shares:
            raise ValueError(f"Unsupported prop: {prop_type}")
        share = pos_shares[prop_type].get(player_position.upper(), 0.10)
        projection = team_prop_avg * share * pace_mult * other_factors
        clamps = {'assists': (0, 15), 'rebounds': (0, 20), 'steals': (0, 5), 'blocks': (0, 5)}
        min_v, max_v = clamps.get(prop_type, (0, 50))
        return clamp_value(projection, min_v, max_v)

# ================================================================================
# SCRIPT #53: MONTE CARLO SIMULATION FOR RANGES
# ================================================================================

class Script53_MonteCarloRanges:
    @staticmethod
    def simulate(
        base_proj: float,
        hist_stdev: float,
        line: float,
        n_sims: int = 10000,
        skew_factor: float = 0.0
    ) -> Dict[str, float]:
        if skew_factor == 0:
            sims = np.random.normal(base_proj, hist_stdev, n_sims)
        else:
            sims = skewnorm.rvs(skew_factor, loc=base_proj, scale=hist_stdev, size=n_sims)
        return {
            'mean': round(np.mean(sims), 2),
            'p95_low': round(np.percentile(sims, 2.5), 2),
            'p95_high': round(np.percentile(sims, 97.5), 2),
            'p_over': round(np.mean(sims > line), 3),
            'p_under': round(np.mean(sims <= line), 3)
        }

# ================================================================================
# SCRIPT #54: ADVANCED METRICS INTEGRATION (BPM, RAPM, etc.)
# ================================================================================

class Script54_AdvancedMetrics:
    @staticmethod
    def adjust(
        base_proj: float,
        metric_value: float,
        league_avg: float = 0.0,
        scale: float = 10.0
    ) -> float:
        adjustment = (metric_value - league_avg) / scale
        adjusted = base_proj * (1 + adjustment)
        return clamp_value(adjusted, 0.0, 45.0)

# ================================================================================
# SCRIPT #55: PARLAY CORRELATION OPTIMIZER
# ================================================================================

class Script55_ParlayCorrelation:
    @staticmethod
    def optimize_kelly(edges: List[float], correlations: np.ndarray, bankroll_pct: float = 0.25) -> List[float]:
        cov_matrix = np.outer(edges, edges) * correlations
        try:
            inv_cov = np.linalg.inv(cov_matrix + np.eye(len(edges)) * 1e-6)
            kelly_full = np.dot(inv_cov, edges)
            kelly_capped = np.clip(kelly_full, 0, bankroll_pct / len(edges))
            return [round(x * 100, 2) for x in kelly_capped]
        except:
            return [min(e, bankroll_pct / len(edges) * 100) for e in edges]

# ================================================================================
# SCRIPT #56: LIVE IN-GAME ADJUSTMENTS
# ================================================================================

class Script56_LiveAdjustment:
    @staticmethod
    def remaining_projection(
        full_proj: float,
        minutes_remaining: float,
        current_points: float = 0.0,
        foul_multiplier: float = 1.0
    ) -> float:
        pace_adj = minutes_remaining / 48.0
        remaining = (full_proj - current_points) * pace_adj * foul_multiplier
        return max(0.0, remaining + current_points)

# ================================================================================
# SCRIPT #57: MACHINE LEARNING ENSEMBLE (Random Forest)
# ================================================================================

class Script57_MLEnsemble:
    model = None
    
    @staticmethod
    def train(features_df: pd.DataFrame, target_series: pd.Series):
        X_train, X_test, y_train, y_test = train_test_split(features_df, target_series, test_size=0.2, random_state=42)
        Script57_MLEnsemble.model = RandomForestRegressor(n_estimators=200, random_state=42)
        Script57_MLEnsemble.model.fit(X_train, y_train)
        preds = Script57_MLEnsemble.model.predict(X_test)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        logger.info(f"ML Model trained - RMSE: {rmse:.2f}")
    
    @staticmethod
    def predict(features: Dict[str, float]) -> float:
        if Script57_MLEnsemble.model is None:
            raise ValueError("Model not trained")
        df = pd.DataFrame([features])
        pred = Script57_MLEnsemble.model.predict(df)[0]
        return clamp_value(pred, 0.0, 45.0)

# ================================================================================
# SCRIPT #58: BANKROLL MANAGEMENT SIMULATOR
# ================================================================================

class Script58_BankrollSimulator:
    @staticmethod
    def simulate(
        starting_bankroll: float,
        bets: List[Dict],  # Each bet: {'edge': float, 'kelly_pct': float, 'outcome': bool}
        n_sims: int = 1000
    ) -> Dict[str, float]:
        final_bankrolls = []
        for _ in range(n_sims):
            bank = starting_bankroll
            for bet in bets:
                wager = bank * (bet['kelly_pct'] / 100)
                if bet['outcome']:
                    bank += wager * 0.909  # -110 win
                else:
                    bank -= wager
                if bank <= 0:
                    bank = 0
                    break
            final_bankrolls.append(bank)
        return {
            'median_final': round(np.median(final_bankrolls), 2),
            'ruin_probability': round(np.mean(np.array(final_bankrolls) == 0), 3),
            'avg_final': round(np.mean(final_bankrolls), 2)
        }

# ================================================================================
# SCRIPT #59: TRAVEL/FATIGUE ADJUSTMENT
# ================================================================================

class Script59_TravelFatigue:
    @staticmethod
    def adjust(base_proj: float, time_zones_crossed: int, b2b: bool = False) -> float:
        mult = 1.0
        if b2b:
            mult *= 0.92
        if time_zones_crossed >= 3:
            mult *= 0.95
        elif time_zones_crossed == 2:
            mult *= 0.97
        return round(base_proj * mult, 2)

# ================================================================================
# SCRIPT #60: MARKET INEFFICIENCY / ARBITRAGE DETECTOR
# ================================================================================

class Script60_ArbDetector:
    @staticmethod
    def find_arb(books: Dict[str, Dict[str, float]]) -> Optional[Dict]:
        # books = {'DraftKings': {'over': -110, 'under': +100}, 'FanDuel': {...}}
        best_over = max((v['over'] for v in books.values() if 'over' in v), default=None)
        best_under = max((v['under'] for v in books.values() if 'under' in v), default=None)
        if best_over and best_under:
            implied_over = 110 / (110 + abs(best_over)) if best_over < 0 else best_over / (best_over + 100)
            implied_under = 100 / (100 + best_under) if best_under > 0 else abs(best_under) / (abs(best_under) + 100)
            total_implied = implied_over + implied_under
            if total_implied < 1:
                return {'arb_pct': round((1 - total_implied) * 100, 2), 'total_implied': round(total_implied, 4)}
        return None

# ================================================================================
# END OF 10 NEW SCRIPTS
# ================================================================================
