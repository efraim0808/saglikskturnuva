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

  const sortedStandings = Array.from(stats.values()).sort((a, b) => {
      // 1. Puan
      if (b.points !== a.points) return b.points - a.points;

      // 2. İki Takım Arasındaki Doğrudan Maç (İkili Averaj)
      const h2hMatch = fixtures.find((f) => {
        if (f.status !== 'completed') return false;
        return (
          (f.home_team_id === a.team_id && f.away_team_id === b.team_id) ||
          (f.home_team_id === b.team_id && f.away_team_id === a.team_id) ||
          (f.home_team_name === a.team_name && f.away_team_name === b.team_name) ||
          (f.home_team_name === b.team_name && f.away_team_name === a.team_name)
        );
      });

      if (h2hMatch) {
        const match = matches.find((m) => m.fixture_id === h2hMatch.id) || h2hMatch;
        const isATeamHome =
          match.home_team_id === a.team_id || match.home_team_name === a.team_name;

        const aGoals = Number(isATeamHome ? match.home_score : match.away_score);
        const bGoals = Number(isATeamHome ? match.away_score : match.home_score);

        // Eğer aralarında maç var ve biri kazandıysa DİREKT O ÜSTE GEÇER!
        if (!isNaN(aGoals) && !isNaN(bGoals) && aGoals !== bGoals) {
          return bGoals - aGoals;
        }
      }

      // 3. Genel Averaj (Troponin United burada hak ettiği gibi 0 averajla alta düşer!)
      const aGoalDiff = a.goals_for - a.goals_against;
      const bGoalDiff = b.goals_for - b.goals_against;
      if (bGoalDiff !== aGoalDiff) return bGoalDiff - aGoalDiff;

      // 4. Attığı Gol
      if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;

      // 5. Yediği Gol
      return a.goals_against - b.goals_against;
    });

    const aGoalDifference = a.goals_for - a.goals_against;
    const bGoalDifference = b.goals_for - b.goals_against;
    if (bGoalDifference !== aGoalDifference) return bGoalDifference - aGoalDifference;

    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return a.goals_against - b.goals_against;
  });

  return sortedStandings;
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
