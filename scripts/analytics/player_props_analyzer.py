#!/usr/bin/env python3
"""
Player Props Analyzer - Integration Layer
==========================================
This module provides a command-line interface to the NBA Props Toolkit,
designed to be called from Node.js for player projection calculations.

Usage:
    python player_props_analyzer.py --action <action> --data <json_data>

Actions:
    - base_projection: Calculate base PPG projection
    - edge_calculation: Calculate betting edge vs line
    - variance_analysis: Analyze player variance
    - game_context: Apply game context adjustments
    - hit_rate: Calculate hit rate for a line
    - full_analysis: Run complete integrated analysis
    - prop_specific: Calculate non-points props (assists, rebounds, etc.)
    - monte_carlo: Run Monte Carlo simulation
    - travel_fatigue: Apply travel/fatigue adjustments
"""

import sys
import json
import argparse
import logging
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import the toolkit classes
try:
    from props_toolkit import (
        Script1_BaseProjection,
        Script2_EdgeCalculation,
        Script3_VarianceAnalysis,
        Script4_GameContext,
        Script5_HitRate,
        Script6_IntegratedModel,
        Script7_UsageRateImpact,
        Script12_RestImpact,
        Script19_HomeAwaySplits,
        Script21_RecentForm,
        Script31_DefensiveMatchup,
        Script43_FatigueEffect,
        validate_ppg,
        validate_minutes,
        clamp_value,
        safe_divide,
    )
    TOOLKIT_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Could not import props_toolkit: {e}")
    TOOLKIT_AVAILABLE = False

try:
    from props_toolkit_extended import (
        Script51_OddsSimulator,
        Script52_PropSpecific,
        Script53_MonteCarloRanges,
        Script54_AdvancedMetrics,
        Script56_LiveAdjustment,
        Script59_TravelFatigue,
        Script60_ArbDetector,
    )
    EXTENDED_TOOLKIT_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Could not import props_toolkit_extended: {e}")
    EXTENDED_TOOLKIT_AVAILABLE = False


def clamp_value(value: float, min_val: float, max_val: float) -> float:
    """Clamp value between min and max bounds."""
    return max(min_val, min(max_val, value))


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Safe division with zero-denominator protection."""
    if denominator == 0:
        return default
    return numerator / denominator


class PlayerPropsAnalyzer:
    """
    Main analyzer class that orchestrates all prop calculations.
    Designed to work with player data from the ManuNB database.
    """
    
    def __init__(self):
        self.toolkit_available = TOOLKIT_AVAILABLE
        self.extended_available = EXTENDED_TOOLKIT_AVAILABLE
    
    def calculate_base_projection(self, player_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate base PPG projection for a player.
        
        Args:
            player_data: Dict with keys:
                - season_ppg: Player's season PPG average
                - expected_minutes: Expected minutes for upcoming game
                - avg_minutes: Season average minutes
                - adjustment_factor: Optional tuning factor (default 1.0)
        
        Returns:
            Dict with projection and metadata
        """
        try:
            season_ppg = float(player_data.get('season_ppg', 0))
            expected_minutes = float(player_data.get('expected_minutes', player_data.get('avg_minutes', 30)))
            avg_minutes = float(player_data.get('avg_minutes', 30))
            adjustment_factor = float(player_data.get('adjustment_factor', 1.0))
            
            # Handle edge cases
            if avg_minutes == 0:
                avg_minutes = 30  # Default to 30 minutes
            
            if season_ppg == 0:
                return {
                    'success': False,
                    'error': 'No PPG data available',
                    'projection': 0
                }
            
            # Calculate minutes multiplier
            minutes_multiplier = safe_divide(expected_minutes, avg_minutes, default=1.0)
            
            # Apply multiplier and adjustment factor
            projection = season_ppg * minutes_multiplier * adjustment_factor
            
            # Clamp to realistic range
            projection = clamp_value(projection, 0.0, 45.0)
            
            return {
                'success': True,
                'projection': round(projection, 2),
                'season_ppg': season_ppg,
                'minutes_multiplier': round(minutes_multiplier, 3),
                'expected_minutes': expected_minutes,
                'avg_minutes': avg_minutes
            }
            
        except Exception as e:
            logger.error(f"Base projection error: {e}")
            return {
                'success': False,
                'error': str(e),
                'projection': 0
            }
    
    def calculate_edge(self, projection: float, line: float, min_edge: float = 0.5) -> Dict[str, Any]:
        """
        Calculate betting edge between projection and sportsbook line.
        
        Args:
            projection: Your PPG projection
            line: Sportsbook line
            min_edge: Minimum edge for BUY recommendation
        
        Returns:
            Dict with edge analysis
        """
        try:
            edge = projection - line
            edge_pct = safe_divide(edge, line, default=0) * 100
            
            # Determine recommendation
            if edge >= min_edge * 2:
                recommendation = 'STRONG_BUY'
                confidence = min(0.95, 0.7 + (edge / 10))
            elif edge >= min_edge:
                recommendation = 'BUY'
                confidence = min(0.85, 0.5 + (edge / 10))
            elif edge <= -min_edge * 2:
                recommendation = 'STRONG_SELL'
                confidence = min(0.95, 0.7 + (abs(edge) / 10))
            elif edge <= -min_edge:
                recommendation = 'SELL'
                confidence = min(0.85, 0.5 + (abs(edge) / 10))
            else:
                recommendation = 'PASS'
                confidence = 0.5
            
            # Calculate expected value at -110 odds
            implied_prob = 0.5238  # -110 odds implied probability
            if edge > 0:
                win_prob = min(0.95, 0.5 + (edge / 20))
                ev = (win_prob * 0.909) - ((1 - win_prob) * 1)  # -110 payout
            else:
                win_prob = max(0.05, 0.5 + (edge / 20))
                ev = (win_prob * 0.909) - ((1 - win_prob) * 1)
            
            return {
                'success': True,
                'edge': round(edge, 2),
                'edge_pct': round(edge_pct, 2),
                'recommendation': recommendation,
                'confidence': round(confidence, 3),
                'expected_value': round(ev * 100, 2),
                'is_profitable': ev > 0,
                'projection': projection,
                'line': line
            }
            
        except Exception as e:
            logger.error(f"Edge calculation error: {e}")
            return {
                'success': False,
                'error': str(e),
                'edge': 0
            }
    
    def calculate_variance(self, game_logs: List[float]) -> Dict[str, Any]:
        """
        Analyze player variance from game logs.
        
        Args:
            game_logs: List of PPG values from recent games
        
        Returns:
            Dict with variance analysis
        """
        try:
            if not game_logs or len(game_logs) < 3:
                return {
                    'success': False,
                    'error': 'Insufficient game data (need at least 3 games)',
                    'variance': 0
                }
            
            import statistics
            
            mean_ppg = statistics.mean(game_logs)
            std_dev = statistics.stdev(game_logs) if len(game_logs) > 1 else 0
            variance = statistics.variance(game_logs) if len(game_logs) > 1 else 0
            
            # Calculate coefficient of variation
            cv = safe_divide(std_dev, mean_ppg, default=0) * 100
            
            # Determine consistency rating
            if cv < 15:
                consistency = 'VERY_CONSISTENT'
            elif cv < 25:
                consistency = 'CONSISTENT'
            elif cv < 35:
                consistency = 'MODERATE'
            elif cv < 50:
                consistency = 'INCONSISTENT'
            else:
                consistency = 'VERY_INCONSISTENT'
            
            # Calculate percentiles
            sorted_logs = sorted(game_logs)
            p25 = sorted_logs[int(len(sorted_logs) * 0.25)]
            p75 = sorted_logs[int(len(sorted_logs) * 0.75)]
            
            return {
                'success': True,
                'mean': round(mean_ppg, 2),
                'std_dev': round(std_dev, 2),
                'variance': round(variance, 2),
                'cv': round(cv, 2),
                'consistency': consistency,
                'min': round(min(game_logs), 2),
                'max': round(max(game_logs), 2),
                'p25': round(p25, 2),
                'p75': round(p75, 2),
                'games_analyzed': len(game_logs)
            }
            
        except Exception as e:
            logger.error(f"Variance analysis error: {e}")
            return {
                'success': False,
                'error': str(e),
                'variance': 0
            }
    
    def apply_game_context(
        self,
        base_projection: float,
        is_home: bool = True,
        is_favorite: bool = True,
        spread: float = 0,
        total: float = 220
    ) -> Dict[str, Any]:
        """
        Apply game context adjustments to projection.
        
        Args:
            base_projection: Base PPG projection
            is_home: Whether player is at home
            is_favorite: Whether player's team is favored
            spread: Point spread (negative = favorite)
            total: Over/under total
        
        Returns:
            Dict with adjusted projection
        """
        try:
            adjustment = 1.0
            factors_applied = []
            
            # Home court advantage
            if is_home:
                adjustment *= 1.02
                factors_applied.append('home_court_+2%')
            else:
                adjustment *= 0.98
                factors_applied.append('away_game_-2%')
            
            # Favorite/underdog adjustment
            if is_favorite:
                # Favorites in blowouts may rest
                if abs(spread) > 10:
                    adjustment *= 0.95
                    factors_applied.append('heavy_favorite_-5%')
                else:
                    adjustment *= 1.01
                    factors_applied.append('favorite_+1%')
            else:
                # Underdogs may play harder
                if abs(spread) > 10:
                    adjustment *= 1.03
                    factors_applied.append('heavy_underdog_+3%')
                else:
                    adjustment *= 0.99
                    factors_applied.append('underdog_-1%')
            
            # Pace adjustment based on total
            pace_factor = safe_divide(total, 220, default=1.0)
            adjustment *= pace_factor
            factors_applied.append(f'pace_factor_{round(pace_factor, 3)}')
            
            adjusted_projection = base_projection * adjustment
            adjusted_projection = clamp_value(adjusted_projection, 0.0, 45.0)
            
            return {
                'success': True,
                'base_projection': round(base_projection, 2),
                'adjusted_projection': round(adjusted_projection, 2),
                'total_adjustment': round(adjustment, 4),
                'factors_applied': factors_applied,
                'context': {
                    'is_home': is_home,
                    'is_favorite': is_favorite,
                    'spread': spread,
                    'total': total
                }
            }
            
        except Exception as e:
            logger.error(f"Game context error: {e}")
            return {
                'success': False,
                'error': str(e),
                'adjusted_projection': base_projection
            }
    
    def calculate_hit_rate(
        self,
        game_logs: List[float],
        line: float
    ) -> Dict[str, Any]:
        """
        Calculate historical hit rate for a given line.
        
        Args:
            game_logs: List of PPG values from recent games
            line: Sportsbook line to evaluate
        
        Returns:
            Dict with hit rate analysis
        """
        try:
            if not game_logs:
                return {
                    'success': False,
                    'error': 'No game data provided',
                    'hit_rate': 0
                }
            
            hits = sum(1 for ppg in game_logs if ppg > line)
            total_games = len(game_logs)
            hit_rate = safe_divide(hits, total_games, default=0)
            
            # Calculate recent form (last 5 games)
            recent_logs = game_logs[-5:] if len(game_logs) >= 5 else game_logs
            recent_hits = sum(1 for ppg in recent_logs if ppg > line)
            recent_hit_rate = safe_divide(recent_hits, len(recent_logs), default=0)
            
            # Determine trend
            if recent_hit_rate > hit_rate + 0.1:
                trend = 'IMPROVING'
            elif recent_hit_rate < hit_rate - 0.1:
                trend = 'DECLINING'
            else:
                trend = 'STABLE'
            
            # Calculate confidence based on sample size
            confidence = min(0.95, 0.5 + (total_games / 50))
            
            return {
                'success': True,
                'hit_rate': round(hit_rate, 3),
                'hit_rate_pct': round(hit_rate * 100, 1),
                'hits': hits,
                'total_games': total_games,
                'recent_hit_rate': round(recent_hit_rate, 3),
                'recent_hit_rate_pct': round(recent_hit_rate * 100, 1),
                'trend': trend,
                'confidence': round(confidence, 3),
                'line': line
            }
            
        except Exception as e:
            logger.error(f"Hit rate error: {e}")
            return {
                'success': False,
                'error': str(e),
                'hit_rate': 0
            }
    
    def apply_rest_impact(
        self,
        base_projection: float,
        days_rest: int,
        is_back_to_back: bool = False
    ) -> Dict[str, Any]:
        """
        Apply rest/fatigue adjustments.
        
        Args:
            base_projection: Base PPG projection
            days_rest: Days since last game
            is_back_to_back: Whether this is a back-to-back game
        
        Returns:
            Dict with adjusted projection
        """
        try:
            adjustment = 1.0
            factors = []
            
            if is_back_to_back:
                adjustment *= 0.92
                factors.append('back_to_back_-8%')
            elif days_rest == 0:
                adjustment *= 0.95
                factors.append('no_rest_-5%')
            elif days_rest == 1:
                adjustment *= 0.98
                factors.append('1_day_rest_-2%')
            elif days_rest == 2:
                adjustment *= 1.0
                factors.append('normal_rest')
            elif days_rest >= 3:
                # Extended rest can be positive or negative (rust)
                if days_rest <= 4:
                    adjustment *= 1.02
                    factors.append('extra_rest_+2%')
                else:
                    adjustment *= 0.98
                    factors.append('rust_factor_-2%')
            
            adjusted = base_projection * adjustment
            adjusted = clamp_value(adjusted, 0.0, 45.0)
            
            return {
                'success': True,
                'base_projection': round(base_projection, 2),
                'adjusted_projection': round(adjusted, 2),
                'adjustment': round(adjustment, 4),
                'days_rest': days_rest,
                'is_back_to_back': is_back_to_back,
                'factors': factors
            }
            
        except Exception as e:
            logger.error(f"Rest impact error: {e}")
            return {
                'success': False,
                'error': str(e),
                'adjusted_projection': base_projection
            }
    
    def calculate_prop_specific(
        self,
        prop_type: str,
        player_position: str,
        team_avg: float,
        pace_mult: float = 1.0
    ) -> Dict[str, Any]:
        """
        Calculate non-points props (assists, rebounds, etc.).
        
        Args:
            prop_type: Type of prop (assists, rebounds, steals, blocks)
            player_position: Player position (PG, SG, SF, PF, C)
            team_avg: Team's average for this stat
            pace_mult: Pace multiplier
        
        Returns:
            Dict with prop projection
        """
        try:
            # Position-based share of team stats
            pos_shares = {
                'assists': {'PG': 0.35, 'SG': 0.15, 'SF': 0.12, 'PF': 0.10, 'C': 0.08},
                'rebounds': {'PG': 0.05, 'SG': 0.08, 'SF': 0.12, 'PF': 0.20, 'C': 0.30},
                'steals': {'PG': 0.25, 'SG': 0.20, 'SF': 0.15, 'PF': 0.10, 'C': 0.05},
                'blocks': {'PG': 0.05, 'SG': 0.08, 'SF': 0.10, 'PF': 0.15, 'C': 0.30},
                'threes': {'PG': 0.25, 'SG': 0.30, 'SF': 0.20, 'PF': 0.15, 'C': 0.05},
            }
            
            prop_type_lower = prop_type.lower()
            if prop_type_lower not in pos_shares:
                return {
                    'success': False,
                    'error': f'Unsupported prop type: {prop_type}',
                    'projection': 0
                }
            
            position_upper = player_position.upper()
            share = pos_shares[prop_type_lower].get(position_upper, 0.10)
            
            projection = team_avg * share * pace_mult
            
            # Clamp based on prop type
            clamps = {
                'assists': (0, 15),
                'rebounds': (0, 20),
                'steals': (0, 5),
                'blocks': (0, 5),
                'threes': (0, 10)
            }
            min_v, max_v = clamps.get(prop_type_lower, (0, 50))
            projection = clamp_value(projection, min_v, max_v)
            
            return {
                'success': True,
                'prop_type': prop_type,
                'projection': round(projection, 2),
                'position': position_upper,
                'position_share': share,
                'team_avg': team_avg,
                'pace_mult': pace_mult
            }
            
        except Exception as e:
            logger.error(f"Prop specific error: {e}")
            return {
                'success': False,
                'error': str(e),
                'projection': 0
            }
    
    def run_monte_carlo(
        self,
        base_projection: float,
        std_dev: float,
        line: float,
        n_sims: int = 10000
    ) -> Dict[str, Any]:
        """
        Run Monte Carlo simulation for probability ranges.
        
        Args:
            base_projection: Base PPG projection
            std_dev: Historical standard deviation
            line: Sportsbook line
            n_sims: Number of simulations
        
        Returns:
            Dict with simulation results
        """
        try:
            import random
            
            results = []
            for _ in range(n_sims):
                sim_value = random.gauss(base_projection, std_dev)
                sim_value = max(0, sim_value)  # Can't score negative
                results.append(sim_value)
            
            results.sort()
            
            over_count = sum(1 for r in results if r > line)
            under_count = n_sims - over_count
            
            return {
                'success': True,
                'mean': round(sum(results) / n_sims, 2),
                'median': round(results[n_sims // 2], 2),
                'p5': round(results[int(n_sims * 0.05)], 2),
                'p25': round(results[int(n_sims * 0.25)], 2),
                'p75': round(results[int(n_sims * 0.75)], 2),
                'p95': round(results[int(n_sims * 0.95)], 2),
                'p_over': round(over_count / n_sims, 3),
                'p_under': round(under_count / n_sims, 3),
                'line': line,
                'simulations': n_sims
            }
            
        except Exception as e:
            logger.error(f"Monte Carlo error: {e}")
            return {
                'success': False,
                'error': str(e),
                'p_over': 0.5
            }
    
    def full_analysis(self, player_data: Dict[str, Any], line: float) -> Dict[str, Any]:
        """
        Run complete integrated analysis for a player.
        
        Args:
            player_data: Complete player data dict
            line: Sportsbook line
        
        Returns:
            Dict with comprehensive analysis
        """
        try:
            # Step 1: Base projection
            base_result = self.calculate_base_projection(player_data)
            if not base_result['success']:
                return base_result
            
            base_projection = base_result['projection']
            
            # Step 2: Apply game context if available
            context_result = self.apply_game_context(
                base_projection,
                is_home=player_data.get('is_home', True),
                is_favorite=player_data.get('is_favorite', True),
                spread=player_data.get('spread', 0),
                total=player_data.get('total', 220)
            )
            adjusted_projection = context_result.get('adjusted_projection', base_projection)
            
            # Step 3: Apply rest impact if available
            rest_result = self.apply_rest_impact(
                adjusted_projection,
                days_rest=player_data.get('days_rest', 2),
                is_back_to_back=player_data.get('is_back_to_back', False)
            )
            final_projection = rest_result.get('adjusted_projection', adjusted_projection)
            
            # Step 4: Calculate edge
            edge_result = self.calculate_edge(final_projection, line)
            
            # Step 5: Variance analysis if game logs available
            game_logs = player_data.get('game_logs', [])
            variance_result = self.calculate_variance(game_logs) if game_logs else None
            
            # Step 6: Hit rate if game logs available
            hit_rate_result = self.calculate_hit_rate(game_logs, line) if game_logs else None
            
            # Step 7: Monte Carlo if we have variance data
            monte_carlo_result = None
            if variance_result and variance_result.get('success'):
                monte_carlo_result = self.run_monte_carlo(
                    final_projection,
                    variance_result['std_dev'],
                    line
                )
            
            return {
                'success': True,
                'player_name': player_data.get('name', 'Unknown'),
                'final_projection': round(final_projection, 2),
                'line': line,
                'edge': edge_result.get('edge', 0),
                'recommendation': edge_result.get('recommendation', 'PASS'),
                'confidence': edge_result.get('confidence', 0.5),
                'expected_value': edge_result.get('expected_value', 0),
                'base_projection': base_projection,
                'context_adjusted': adjusted_projection,
                'rest_adjusted': final_projection,
                'variance': variance_result,
                'hit_rate': hit_rate_result,
                'monte_carlo': monte_carlo_result,
                'factors_applied': (
                    context_result.get('factors_applied', []) +
                    rest_result.get('factors', [])
                )
            }
            
        except Exception as e:
            logger.error(f"Full analysis error: {e}")
            return {
                'success': False,
                'error': str(e)
            }


def main():
    """Main entry point for command-line usage."""
    parser = argparse.ArgumentParser(description='NBA Player Props Analyzer')
    parser.add_argument('--action', required=True, help='Action to perform')
    parser.add_argument('--data', required=True, help='JSON data for the action')
    parser.add_argument('--output', default='json', choices=['json', 'pretty'], help='Output format')
    
    args = parser.parse_args()
    
    try:
        data = json.loads(args.data)
    except json.JSONDecodeError as e:
        print(json.dumps({'success': False, 'error': f'Invalid JSON: {e}'}))
        sys.exit(1)
    
    analyzer = PlayerPropsAnalyzer()
    result = None
    
    try:
        if args.action == 'base_projection':
            result = analyzer.calculate_base_projection(data)
        
        elif args.action == 'edge_calculation':
            result = analyzer.calculate_edge(
                data.get('projection', 0),
                data.get('line', 0),
                data.get('min_edge', 0.5)
            )
        
        elif args.action == 'variance_analysis':
            result = analyzer.calculate_variance(data.get('game_logs', []))
        
        elif args.action == 'game_context':
            result = analyzer.apply_game_context(
                data.get('base_projection', 0),
                data.get('is_home', True),
                data.get('is_favorite', True),
                data.get('spread', 0),
                data.get('total', 220)
            )
        
        elif args.action == 'hit_rate':
            result = analyzer.calculate_hit_rate(
                data.get('game_logs', []),
                data.get('line', 0)
            )
        
        elif args.action == 'rest_impact':
            result = analyzer.apply_rest_impact(
                data.get('base_projection', 0),
                data.get('days_rest', 2),
                data.get('is_back_to_back', False)
            )
        
        elif args.action == 'prop_specific':
            result = analyzer.calculate_prop_specific(
                data.get('prop_type', 'points'),
                data.get('position', 'SG'),
                data.get('team_avg', 0),
                data.get('pace_mult', 1.0)
            )
        
        elif args.action == 'monte_carlo':
            result = analyzer.run_monte_carlo(
                data.get('base_projection', 0),
                data.get('std_dev', 5),
                data.get('line', 0),
                data.get('n_sims', 10000)
            )
        
        elif args.action == 'full_analysis':
            result = analyzer.full_analysis(data, data.get('line', 0))
        
        elif args.action == 'batch_analysis':
            # Batch analysis for multiple players
            players = data.get('players', [])
            results = []
            for player in players:
                player_result = analyzer.full_analysis(player, player.get('line', 0))
                results.append(player_result)
            result = {'success': True, 'results': results, 'count': len(results)}
        
        else:
            result = {'success': False, 'error': f'Unknown action: {args.action}'}
    
    except Exception as e:
        result = {'success': False, 'error': str(e)}
    
    # Output result
    if args.output == 'pretty':
        print(json.dumps(result, indent=2))
    else:
        print(json.dumps(result))


if __name__ == '__main__':
    main()
