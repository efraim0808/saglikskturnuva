import { useState, useEffect, Component, ReactNode } from 'react';
import { useApp } from '../AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Goal, AlertTriangle, Shield, Star, Trophy } from 'lucide-react';
import { PlayerCard, PlayerName } from '../components/PlayerCard';

type Tab = 'scorers' | 'potm' | 'goalkeeper' | 'teams';

// ── Error Boundary: catches render crashes and shows fallback UI ──────────────
class StatsErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { /* swallow — UI already replaced by fallback */ }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">İstatistikler yüklenemedi</h2>
          <p className="text-sm text-slate-500 text-center max-w-sm">
            İstatistikler şu an hesaplanamıyor, lütfen daha sonra tekrar deneyin.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Safe helpers ──────────────────────────────────────────────────────────────
const safeArray = <T,>(arr: T[] | undefined | null): T[] =>
  Array.isArray(arr) ? arr : [];

const isGoalkeeper = (pos: string | null | undefined): boolean => {
  if (!pos) return false;
  const normalized = pos.trim().toLowerCase().replace('İ', 'i').replace('I', 'i');
  return normalized === 'kaleci' || normalized === 'kl';
};

export function Stats() {
  const ctx = useApp();
  const matchEvents = safeArray(ctx?.matchEvents);
  const players = safeArray(ctx?.players);
  const teams = safeArray(ctx?.teams);
  const matches = safeArray(ctx?.matches);
  const fixtures = safeArray(ctx?.fixtures);
  const lineups = safeArray(ctx?.lineups);
  const selectedTournament = ctx?.selectedTournament;

  const [activeTab, setActiveTab] = useState<Tab>('scorers');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      const { playerId } = (e as CustomEvent).detail;
      setSelectedPlayerId(playerId);
    }
    window.addEventListener('open-player-card', handler);
    return () => window.removeEventListener('open-player-card', handler);
  }, []);

  // ── Computation (wrapped in try-catch for crash protection) ─────────────────
  let goalEvents: typeof matchEvents = [];
  let yellowCards: typeof matchEvents = [];
  let redCards: typeof matchEvents = [];
  let topScorers: { player: typeof players[0]; count: number }[] = [];
  let teamGoalCounts: Record<string, { team: typeof teams[0]; goals: number }> = {};
  let potmList: { player: typeof players[0]; count: number }[] = [];
  let gkFiltered: { gk: typeof players[0]; team?: typeof teams[0]; goalsAgainst: number; played: number; avg: string }[] = [];
  let goalkeepers: typeof players = [];
  let thresholdLabel = '';

  try {
    goalEvents = matchEvents.filter(e => e?.event_type === 'goal');
    yellowCards = matchEvents.filter(e => e?.event_type === 'yellow_card');
    redCards = matchEvents.filter(e => e?.event_type === 'red_card');

    // ── Gol Krallığı ────────────────────────────────────────────────────────────
    const playerGoals: Record<string, { player: typeof players[0]; count: number }> = {};
    goalEvents.forEach(e => {
      if (e?.player_id && e?.player) {
        if (!playerGoals[e.player_id]) playerGoals[e.player_id] = { player: e.player, count: 0 };
        playerGoals[e.player_id].count++;
      }
    });
    topScorers = Object.values(playerGoals).sort((a, b) => b.count - a.count).slice(0, 10);

    // ── Takım Bazlı Goller ───────────────────────────────────────────────────────
    goalEvents.forEach(e => {
      if (e?.player_id) {
        const player = players.find(p => p?.id === e.player_id);
        if (player) {
          const team = teams.find(t => t?.id === player.team_id);
          if (team) {
            if (!teamGoalCounts[team.id]) teamGoalCounts[team.id] = { team, goals: 0 };
            teamGoalCounts[team.id].goals++;
          }
        }
      }
    });

    // ── Maçın Oyuncusu ─────────────────────────────────────────────────────────
    const completedMatches = matches.filter(m => m?.status === 'completed' && m?.player_of_the_match);
    const potmCounts: Record<string, { player: typeof players[0]; count: number }> = {};
    completedMatches.forEach(m => {
      const pid = m.player_of_the_match!;
      const player = players.find(p => p?.id === pid);
      if (player) {
        if (!potmCounts[pid]) potmCounts[pid] = { player, count: 0 };
        potmCounts[pid].count++;
      }
    });
    potmList = Object.values(potmCounts).sort((a, b) => b.count - a.count);

    // ── Altın Eldiven ──────────────────────────────────────────────────────────
    const goalkeeperLineups = lineups.filter(l => l?.status === 'starter' && l?.player?.position && isGoalkeeper(l.player.position));
    const goalkeeperIds = new Set(goalkeeperLineups.map(l => l.player_id));
    const goalkeepersInLineups = players.filter(p => goalkeeperIds.has(p.id));
    goalkeepers = goalkeepersInLineups;

    const gkList = goalkeepersInLineups
      .map(gk => {
        const team = teams.find(t => t?.id === gk?.team_id);

        let played = 0;
        let goalsAgainst = 0;

        const fixturesByTeam = fixtures.filter(f => f?.tournament_id === selectedTournament?.id && (f.home_team_id === gk.team_id || f.away_team_id === gk.team_id));
        for (const fixture of fixturesByTeam) {
          const match = matches.find(m => m?.fixture_id === fixture.id && m?.status === 'completed');
          if (!match) continue;

          const lineupEntry = lineups.find(
            l => l.fixture_id === fixture.id && l.team_id === gk.team_id && l.player_id === gk.id && l.status === 'starter'
          );
          if (!lineupEntry) continue;

          played++;
          const isHome = fixture.home_team_id === gk.team_id;
          goalsAgainst += isHome ? (match.away_score ?? 0) : (match.home_score ?? 0);
        }

        const avg = played > 0 ? (goalsAgainst / played).toFixed(2) : '0.00';
        return { gk, team, goalsAgainst, played, avg };
      })
      .filter(entry => entry.played >= 2)
      .sort((a, b) => {
        if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;
        return b.played - a.played;
      });

    gkFiltered = gkList;
    thresholdLabel = 'En az 2 maç oynamış kaleciler.';
  } catch {
    // Swallow — boundary will catch render errors, computation falls back to empty
  }

  const tabs: { id: Tab; label: string; icon: typeof Goal }[] = [
    { id: 'scorers',    label: 'Gol Krallığı',    icon: Goal    },
    { id: 'potm',       label: 'Maçın Oyuncusu',  icon: Star    },
    { id: 'goalkeeper', label: 'Altın Eldiven',    icon: Trophy  },
    { id: 'teams',      label: 'Takım Goller',     icon: Shield  },
  ];

  return (
    <StatsErrorBoundary>
      <div className="space-y-6">
        {selectedPlayerId && (
          <PlayerCard playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />
        )}

        <div>
          <h1 className="text-2xl font-bold text-slate-900">İstatistikler</h1>
          <p className="text-slate-500">{selectedTournament?.name}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Goal className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{goalEvents.length}</div>
                  <div className="text-sm text-slate-500">Toplam Gol</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{yellowCards.length}</div>
                  <div className="text-sm text-slate-500">Sarı Kart</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{redCards.length}</div>
                  <div className="text-sm text-slate-500">Kırmızı Kart</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit flex-wrap">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Gol Krallığı */}
        {activeTab === 'scorers' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Goal className="w-5 h-5 text-emerald-600" />
                Gol Krallığı
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topScorers.length > 0 ? (
                <div className="space-y-3">
                  {topScorers.map((entry, idx) => (
                    <div key={entry.player.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <PlayerName playerId={entry.player.id} name={entry.player.name} className="text-slate-900" />
                        <div className="text-xs text-slate-500">{teams.find(t => t?.id === entry.player.team_id)?.name}</div>
                      </div>
                      <div className="text-lg font-bold text-emerald-600">{entry.count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  <Goal className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  Henüz gol kaydedilmemiş
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Maçın Oyuncusu */}
        {activeTab === 'potm' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Maçın Oyuncusu Ödülü
              </CardTitle>
            </CardHeader>
            <CardContent>
              {potmList.length > 0 ? (
                <div className="space-y-3">
                  {potmList.map((entry, idx) => (
                    <div key={entry.player.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-amber-200 text-amber-800' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
                        <Star className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <PlayerName playerId={entry.player.id} name={entry.player.name} className="text-slate-900" />
                        <div className="text-xs text-slate-500">
                          {teams.find(t => t?.id === entry.player.team_id)?.name}
                          {entry.player.position && <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">{entry.player.position}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-amber-600">{entry.count}</div>
                        <div className="text-xs text-slate-400">ödül</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  <Star className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  Henüz maçın oyuncusu seçilmemiş
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Altın Eldiven */}
        {activeTab === 'goalkeeper' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-sky-600" />
                Altın Eldiven — En Az Gol Yiyen Kaleci
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gkFiltered.length > 0 ? (
                <>
                  <p className="text-xs text-slate-400 mb-4">{thresholdLabel} Daha az gol = daha iyi sıra. Eşitlikte daha çok maç oynayan öne geçer.</p>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                          <th className="px-3 py-2.5 text-left font-semibold">#</th>
                          <th className="px-3 py-2.5 text-left font-semibold">Kaleci</th>
                          <th className="px-3 py-2.5 text-center font-semibold">OM</th>
                          <th className="px-3 py-2.5 text-center font-semibold">YG</th>
                          <th className="px-3 py-2.5 text-center font-semibold">Ort.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {gkFiltered.map((entry, idx) => (
                          <tr key={entry.gk.id} className="hover:bg-sky-50/50 transition-colors">
                            <td className="px-3 py-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {idx + 1}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                                  <Trophy className="w-4 h-4 text-sky-500" />
                                </div>
                                <div className="min-w-0">
                                  <PlayerName playerId={entry.gk.id} name={entry.gk.name} className="text-slate-900 font-medium" />
                                  <div className="text-xs text-slate-400 truncate">{entry.team?.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center font-semibold text-slate-600">{entry.played}</td>
                            <td className="px-3 py-3 text-center text-lg font-bold text-sky-600">{entry.goalsAgainst}</td>
                            <td className="px-3 py-3 text-center text-slate-500 font-medium">{entry.avg}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  <Trophy className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  {goalkeepers.length === 0
                    ? 'Maç kadrolarında kaleci olarak seçilmiş oyuncu bulunmuyor. Esame listeleri ve oyuncu pozisyonlarını kontrol edin.'
                    : 'Altın Eldiven kriterlerini karşılayan kaleci bulunmuyor.'}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Takım Bazlı Goller */}
        {activeTab === 'teams' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-sky-600" />
                Takım Bazlı Goller
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.values(teamGoalCounts).length > 0 ? (
                <div className="space-y-3">
                  {Object.values(teamGoalCounts).sort((a, b) => b.goals - a.goals).map(entry => (
                    <div key={entry.team.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="flex-1 font-medium text-slate-900">{entry.team.name}</div>
                      <div className="text-lg font-bold text-emerald-600">{entry.goals}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  <Shield className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  Henüz gol kaydedilmemiş
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </StatsErrorBoundary>
  );
}
