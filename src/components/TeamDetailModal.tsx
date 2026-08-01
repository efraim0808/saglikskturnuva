import { useApp } from '../AppContext';
import { X, Goal, Square, Star, Users, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Team } from '../types';

interface TeamDetailModalProps {
  team: Team;
  onClose: () => void;
}

const POSITION_SHORT: Record<string, string> = {
  'Kaleci': 'KL',
  'Defans': 'DF',
  'Orta Saha': 'OS',
  'Forvet': 'FV',
};

export function TeamDetailModal({ team, onClose }: TeamDetailModalProps) {
  const { players, matchEvents, standings, matches, fixtures, selectedTournament } = useApp();

  const teamPlayers = players.filter(p => p.team_id === team.id);
  const teamStanding = standings.find(s => s.team_id === team.id);
  const teamEvents = matchEvents.filter(e => {
    const player = teamPlayers.find(p => p.id === e.player_id);
    return player !== undefined;
  });

  const goalsByPlayer = new Map<string, number>();
  const yellowByPlayer = new Map<string, number>();
  const redByPlayer = new Map<string, number>();
  const potmByPlayer = new Map<string, number>();

  for (const e of teamEvents) {
    if (!e.player_id) continue;
    if (e.event_type === 'goal') {
      goalsByPlayer.set(e.player_id, (goalsByPlayer.get(e.player_id) || 0) + 1);
    } else if (e.event_type === 'yellow_card') {
      yellowByPlayer.set(e.player_id, (yellowByPlayer.get(e.player_id) || 0) + 1);
    } else if (e.event_type === 'red_card') {
      redByPlayer.set(e.player_id, (redByPlayer.get(e.player_id) || 0) + 1);
    }
  }

  const teamFixtureIds = fixtures.filter(f => f.home_team_id === team.id || f.away_team_id === team.id).map(f => f.id);
  const teamMatches = matches.filter(m => teamFixtureIds.includes(m.fixture_id));
  for (const m of teamMatches) {
    if (m.player_of_the_match) {
      const player = teamPlayers.find(p => p.id === m.player_of_the_match);
      if (player) {
        potmByPlayer.set(m.player_of_the_match, (potmByPlayer.get(m.player_of_the_match) || 0) + 1);
      }
    }
  }

  // ── Fallback: compute stats from completed matches if standings are missing or all zeros ──
  const standingValid = teamStanding && (teamStanding.played > 0 || teamStanding.won > 0 || teamStanding.drawn > 0 || teamStanding.lost > 0 || teamStanding.goals_for > 0 || teamStanding.goals_against > 0 || teamStanding.points > 0);

  let computed: { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number } | null = null;
  if (!standingValid && selectedTournament) {
    const winPts = selectedTournament.win_points;
    const drawPts = selectedTournament.draw_points;
    const lossPts = selectedTournament.loss_points;
    let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0, points = 0;
    for (const m of teamMatches) {
      if (m.status !== 'completed') continue;
      const isHome = fixtures.find(f => f.id === m.fixture_id)?.home_team_id === team.id;
      const myScore = isHome ? m.home_score : m.away_score;
      const oppScore = isHome ? m.away_score : m.home_score;
      played++;
      gf += myScore;
      ga += oppScore;
      if (myScore > oppScore) { won++; points += winPts; }
      else if (myScore === oppScore) { drawn++; points += drawPts; }
      else { lost++; points += lossPts; }
    }
    computed = { played, won, drawn, lost, gf, ga, points };
  }

  const sPlayed = standingValid ? teamStanding!.played : (computed?.played ?? 0);
  const sWon = standingValid ? teamStanding!.won : (computed?.won ?? 0);
  const sDrawn = standingValid ? teamStanding!.drawn : (computed?.drawn ?? 0);
  const sLost = standingValid ? teamStanding!.lost : (computed?.lost ?? 0);
  const sGf = standingValid ? teamStanding!.goals_for : (computed?.gf ?? 0);
  const sGa = standingValid ? teamStanding!.goals_against : (computed?.ga ?? 0);
  const sPoints = standingValid ? teamStanding!.points : (computed?.points ?? 0);

  const stats: { label: string; value: number; color: string }[] = [
    { label: 'Oynanan', value: sPlayed, color: 'text-slate-700' },
    { label: 'Galibiyet', value: sWon, color: 'text-emerald-600' },
    { label: 'Beraberlik', value: sDrawn, color: 'text-slate-600' },
    { label: 'Mağlubiyet', value: sLost, color: 'text-red-600' },
    { label: 'Atılan Gol', value: sGf, color: 'text-emerald-600' },
    { label: 'Yenilen Gol', value: sGa, color: 'text-red-600' },
    { label: 'Averaj', value: sGf - sGa, color: 'text-slate-700' },
    { label: 'Puan', value: sPoints, color: 'text-emerald-700' },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 sm:my-8 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with jersey color stripe */}
        <div className="relative">
          <div
            className="h-2"
            style={{ backgroundColor: team.jersey_color || '#16a34a' }}
          />
          <div className="flex items-center justify-between px-5 sm:px-6 py-4">
            <div className="flex items-center gap-3 min-w-0">
              {team.logo_url ? (
                <img src={team.logo_url} alt={team.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
              ) : (
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
                  style={{ backgroundColor: team.jersey_color || '#16a34a' }}
                >
                  {(team.name || '?').charAt(0).toLocaleUpperCase('tr-TR')}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-bold text-lg text-slate-900 leading-tight truncate">{team.name}</h2>
                {team.manager_name && (
                  <p className="text-sm text-slate-500 truncate">Kaptan: {team.manager_name}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {stats.map(s => (
              <div key={s.label} className="text-center p-2 sm:p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={cn('text-lg sm:text-2xl font-bold', s.color)}>
                  {s.label === 'Averaj' && s.value > 0 ? '+' : ''}{s.value}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Player Roster Table */}
        <div className="px-5 sm:px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Oyuncu Kadrosu</h3>
            <span className="text-xs text-slate-400">({teamPlayers.length})</span>
          </div>
          {teamPlayers.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Bu takımda kayıtlı oyuncu bulunmuyor
            </div>
          ) : (
            <div className="w-full overflow-x-auto select-none whitespace-nowrap scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-sm whitespace-nowrap min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left font-medium text-slate-500">#</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Oyuncu</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-500">Mevki</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-500">Gol</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-500">Sarı</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-500">Kırmızı</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-500">POTM</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPlayers.map(player => (
                    <tr key={player.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-slate-400">
                        {player.jersey_number || '-'}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {player.photo_url
                              ? <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                              : <span className="text-xs font-bold text-slate-500">{player.name.charAt(0).toLocaleUpperCase('tr-TR')}</span>
                            }
                          </div>
                          <span className="font-medium text-slate-900">{player.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                          {player.position ? (POSITION_SHORT[player.position] || player.position) : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {goalsByPlayer.get(player.id) ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                            <Goal className="w-3.5 h-3.5" /> {goalsByPlayer.get(player.id)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {yellowByPlayer.get(player.id) ? (
                          <span className="inline-flex items-center gap-0.5 text-amber-600 font-medium">
                            <Square className="w-3 h-3 fill-amber-400 text-amber-400" /> {yellowByPlayer.get(player.id)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {redByPlayer.get(player.id) ? (
                          <span className="inline-flex items-center gap-0.5 text-red-600 font-medium">
                            <Square className="w-3 h-3 fill-red-500 text-red-500" /> {redByPlayer.get(player.id)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {potmByPlayer.get(player.id) ? (
                          <span className="inline-flex items-center gap-0.5 text-amber-600 font-medium">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {potmByPlayer.get(player.id)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedTournament && (
          <div className="px-5 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <Trophy className="w-3.5 h-3.5 text-emerald-500" />
            {selectedTournament.name} · {selectedTournament.season}
          </div>
        )}
      </div>
    </div>
  );
}
