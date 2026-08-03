import type { Fixture, Match, Penalty, Player, Standing, Team, Tournament } from '../types';

const CACHE_KEY_PREFIX = 'standings_cache_';
const MATCHES_CACHE_KEY_PREFIX = 'matches_cache_';
const PLAYERS_CACHE_KEY_PREFIX = 'players_cache_';

function cacheKey(tournamentId: string): string {
  return `${CACHE_KEY_PREFIX}${tournamentId}`;
}

export function loadCachedStandings(tournamentId: string): Standing[] | null {
  return safeRead<Standing>(cacheKey(tournamentId));
}

export function saveCachedStandings(tournamentId: string, standings: Standing[]): void {
  safeWrite(cacheKey(tournamentId), standings);
}

export function clearCachedStandings(tournamentId: string): void {
  safeWrite(cacheKey(tournamentId), []);
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

  const completedMatchByFixtureId = new Map<string, Match>(
    matches.filter(m => m.status === 'completed').map(m => [m.fixture_id, m])
  );

  const completedFixtureResults = completedFixtures
    .map(f => {
      const match = completedMatchByFixtureId.get(f.id);
      return match ? { fixture: f, match } : null;
    })
    .filter((entry): entry is { fixture: Fixture; match: Match } => Boolean(entry));

  for (const { fixture, match } of completedFixtureResults) {
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

  const standingsByPoints = new Map<number, Standing[]>();
  for (const standing of stats.values()) {
    const bucket = standingsByPoints.get(standing.points) ?? [];
    bucket.push(standing);
    standingsByPoints.set(standing.points, bucket);
  }

  const sortedStandings: Standing[] = [];
  const pointGroups = Array.from(standingsByPoints.entries()).sort((a, b) => b[0] - a[0]);

  for (const [, group] of pointGroups) {
    if (group.length === 1) {
      sortedStandings.push(group[0]);
      continue;
    }

    const h2hStats = buildHeadToHeadStats(group, completedFixtureResults, winPoints, drawPoints, lossPoints);

    group.sort((a, b) => {
      const aH2H = h2hStats.get(a.team_id);
      const bH2H = h2hStats.get(b.team_id);

      if (aH2H && bH2H) {
        if (bH2H.points !== aH2H.points) return bH2H.points - aH2H.points;

        const aH2HDiff = aH2H.goals_for - aH2H.goals_against;
        const bH2HDiff = bH2H.goals_for - bH2H.goals_against;
        if (bH2HDiff !== aH2HDiff) return bH2HDiff - aH2HDiff;

        if (bH2H.goals_for !== aH2H.goals_for) return bH2H.goals_for - aH2H.goals_for;
      }

      const aGoalDiff = a.goals_for - a.goals_against;
      const bGoalDiff = b.goals_for - b.goals_against;
      if (bGoalDiff !== aGoalDiff) return bGoalDiff - aGoalDiff;

      if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
      if (a.goals_against !== b.goals_against) return a.goals_against - b.goals_against;
      return 0;
    });

    sortedStandings.push(...group);
  }

  return sortedStandings;
}

function buildHeadToHeadStats(
  group: Standing[],
  completedFixtureResults: Array<{ fixture: Fixture; match: Match }>,
  winPoints: number,
  drawPoints: number,
  lossPoints: number
): Map<string, { points: number; goals_for: number; goals_against: number; played: number }> {
  const teamIds = new Set(group.map(s => s.team_id));
  const stats = new Map<string, { points: number; goals_for: number; goals_against: number; played: number }>();

  for (const standing of group) {
    stats.set(standing.team_id, {
      points: 0,
      goals_for: 0,
      goals_against: 0,
      played: 0,
    });
  }

  for (const { fixture, match } of completedFixtureResults) {
    if (!teamIds.has(fixture.home_team_id) || !teamIds.has(fixture.away_team_id)) continue;

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
      home.points += winPoints;
      away.points += lossPoints;
    } else if (match.home_score < match.away_score) {
      away.points += winPoints;
      home.points += lossPoints;
    } else {
      home.points += drawPoints;
      away.points += drawPoints;
    }
  }

  return stats;
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
