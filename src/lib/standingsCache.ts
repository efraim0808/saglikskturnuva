import type { Fixture, Match, Penalty, Player, Standing, Team, Tournament } from '../types';

const CACHE_KEY_PREFIX = 'standings_cache_';
const MATCHES_CACHE_KEY_PREFIX = 'matches_cache_';
const PLAYERS_CACHE_KEY_PREFIX = 'players_cache_';

function cacheKey(tournamentId: string): string {
  return `${CACHE_KEY_PREFIX}${tournamentId}`;
}

export function loadCachedStandings(_tournamentId: string): Standing[] | null {
  return null;
}

export function saveCachedStandings(_tournamentId: string, _standings: Standing[]): void {
  // Cache disabled for live standings.
}

export function clearCachedStandings(_tournamentId: string): void {
  // Cache disabled for live standings.
}

interface RecalcOptions {
  tournament: Tournament | null;
  teams: Team[];
  fixtures: Fixture[];
  matches: Match[];
  penalties: Penalty[];
}

export function recalculateStandingsFromMatches({
  tournament,
  teams,
  fixtures,
  matches,
  penalties,
}: RecalcOptions): Standing[] {
  const winPoints = tournament?.win_points ?? 3;
  const drawPoints = tournament?.draw_points ?? 1;
  const lossPoints = tournament?.loss_points ?? -1;
  const tournamentId = tournament?.id ?? '';

  const approvedTeams = teams.filter(t => t.status === 'approved');
  const stats = new Map<string, Standing>();

  for (const team of approvedTeams) {
    stats.set(team.id, {
      id: `recalc-${team.id}`,
      tournament_id: tournamentId,
      team_id: team.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      penalty_points: 0,
      points: 0,
      created_at: new Date().toISOString(),
      team,
    });
  }

  const completedFixtures = fixtures.filter(
    f => f.status === 'completed' || f.status === 'forfeit'
  );

  for (const fixture of completedFixtures) {
    const match = matches.find(m => m.fixture_id === fixture.id);
    if (!match) continue;
    if (match.status !== 'completed') continue;

    const home = stats.get(fixture.home_team_id);
    const away = stats.get(fixture.away_team_id);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goals_for += match.home_score;
    home.goals_against += match.away_score;
    away.goals_for += match.away_score;
    away.goals_against += match.home_score;

    if (match.home_score > match.away_score) {
      home.won += 1;
      home.points += winPoints;
      away.lost += 1;
      away.points += lossPoints;
    } else if (match.home_score < match.away_score) {
      away.won += 1;
      away.points += winPoints;
      home.lost += 1;
      home.points += lossPoints;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += drawPoints;
      away.points += drawPoints;
    }
  }

  for (const penalty of penalties) {
    const s = stats.get(penalty.team_id);
    if (!s) continue;
    s.penalty_points += penalty.points;
    s.points += penalty.points;
  }

  return Array.from(stats.values());
}

// ── Generic per-tournament caches for matches and players ─────────────────────

function safeRead<T>(_key: string): T[] | null {
  return null;
}

function safeWrite<T>(_key: string, _data: T[]): void {
  // Cache disabled for live standings.
}

export function loadCachedMatches(_tournamentId: string): Match[] | null {
  return safeRead<Match>('');
}

export function saveCachedMatches(_tournamentId: string, _matches: Match[]): void {
  // Cache disabled for live standings.
}

export function loadCachedPlayers(_tournamentId: string): Player[] | null {
  return safeRead<Player>('');
}

export function saveCachedPlayers(_tournamentId: string, _players: Player[]): void {
  // Cache disabled for live standings.
}

export function clearAllTournamentCache(_tournamentId: string): void {
  // Cache disabled for live standings.
}
