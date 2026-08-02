import { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { Card, CardContent } from '../components/ui/Card';
import { TeamDetailModal } from '../components/TeamDetailModal';
import { Trophy, AlertTriangle, BookOpen, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { recalculateStandingsFromMatches } from '../lib/standingsCache';
import type { Team } from '../types';

export function Standings() {
  const { selectedTournament, penalties, fixtures, matches, teams, isDataLoading } = useApp();
  const [detailTeam, setDetailTeam] = useState<Team | null>(null);
  const [showRules, setShowRules] = useState(false);

  const effectiveStandings = useMemo(() => recalculateStandingsFromMatches({
    tournament: selectedTournament,
    teams,
    fixtures,
    matches,
    penalties,
  }), [selectedTournament, teams, fixtures, matches, penalties]);

  const sortedStandings = [...effectiveStandings].sort((a, b) => {
    // 1. Önce Ana Puan
    if (b.points !== a.points) return b.points - a.points;

    // 2. İki takım kendi arasında maç yapmış mı? (H2H)
    const h2hMatch = fixtures.find(
      (f) =>
        f.status === 'completed' &&
        ((f.home_team_id === a.team_id && f.away_team_id === b.team_id) ||
          (f.home_team_id === b.team_id && f.away_team_id === a.team_id))
    );

    if (h2hMatch) {
      const aIsHome = h2hMatch.home_team_id === a.team_id;
      const aScore = aIsHome ? h2hMatch.home_score : h2hMatch.away_score;
      const bScore = aIsHome ? h2hMatch.away_score : h2hMatch.home_score;

      // Eğer aralarındaki maç berabere DEĞİLSE, kazanan doğrudan üstte!
      if (aScore !== bScore) {
        return (bScore ?? 0) - (aScore ?? 0);
      }
    }

    // 3. Aralarında maç yoksa veya berabereyse: Genel Averaj
    const aGoalDifference = a.goals_for - a.goals_against;
    const bGoalDifference = b.goals_for - b.goals_against;
    if (bGoalDifference !== aGoalDifference) {
      return bGoalDifference - aGoalDifference;
    }

    // 4. Attığı Gol
    if (b.goals_for !== a.goals_for) {
      return b.goals_for - a.goals_for;
    }

    // 5. Yediği Gol (Az olan üstte)
    return a.goals_against - b.goals_against;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Puan Durumu</h1>
          <p className="text-slate-500">{selectedTournament?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedTournament && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>G:{selectedTournament.win_points} B:{selectedTournament.draw_points} M:{selectedTournament.loss_points}</span>
              </div>
              <button
                onClick={() => setShowRules(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Kurallar
              </button>
            </div>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="table-responsive-container select-none scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-sm whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 py-3 text-left font-medium text-slate-500 w-10">#</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-500">Takım</th>
                  <th className="px-3 py-3 text-center font-medium text-slate-500 w-10">O</th>
                  <th className="hidden sm:table-cell px-3 py-3 text-center font-medium text-slate-500 w-10">G</th>
                  <th className="hidden sm:table-cell px-3 py-3 text-center font-medium text-slate-500 w-10">B</th>
                  <th className="hidden sm:table-cell px-3 py-3 text-center font-medium text-slate-500 w-10">M</th>
                  <th className="hidden md:table-cell px-3 py-3 text-center font-medium text-slate-500 w-10">A</th>
                  <th className="hidden md:table-cell px-3 py-3 text-center font-medium text-slate-500 w-10">Y</th>
                  <th className="hidden sm:table-cell px-3 py-3 text-center font-medium text-slate-500 w-14">AV</th>
                  {penalties.length > 0 && (
                    <th className="hidden md:table-cell px-3 py-3 text-center font-medium text-slate-500 w-10">C</th>
                  )}
                  <th className="px-3 py-3 text-center font-medium text-slate-900 w-14">P</th>
                </tr>
              </thead>
              <tbody>
                {sortedStandings.map((s, idx) => {
                  const gd = s.goals_for - s.goals_against;
                  const teamPenalties = penalties.filter(p => p.team_id === s.team_id);
                  return (
                    <tr
                      key={s.id}
                      className={cn(
                        'border-b border-slate-100 hover:bg-slate-50 transition-colors',
                        idx < 3 && 'bg-emerald-50/30'
                      )}
                      style={{ boxShadow: s.team?.jersey_color ? `inset 4px 0 0 ${s.team.jersey_color}` : undefined }}
                    >
                      <td className="px-3 py-3">
                        <div className={cn(
                          'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                          idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                          idx === 1 ? 'bg-slate-200 text-slate-700' :
                          idx === 2 ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        )}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        <button
                          onClick={() => s.team && setDetailTeam(s.team)}
                          className="flex items-center gap-2 group"
                        >
                          {s.team?.logo_url
                            ? <img src={s.team.logo_url} alt={s.team.name} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover shrink-0 border border-slate-200 group-hover:ring-2 group-hover:ring-emerald-300 transition-all" />
                            : (
                              <div
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold group-hover:ring-2 group-hover:ring-emerald-300 transition-all"
                                style={{ backgroundColor: s.team?.jersey_color || '#16a34a' }}
                              >
                                {(s.team?.name || '?').charAt(0).toUpperCase()}
                              </div>
                            )
                          }
                          <span className="truncate max-w-[120px] sm:max-w-none cursor-pointer group-hover:text-emerald-600 group-hover:underline transition-colors">{s.team?.name || 'Bilinmiyor'}</span>
                        </button>
                      </td>
                      <td className="px-3 py-3 text-center text-slate-600">{s.played}</td>
                      <td className="hidden sm:table-cell px-3 py-3 text-center text-emerald-600 font-medium">{s.won}</td>
                      <td className="hidden sm:table-cell px-3 py-3 text-center text-slate-600">{s.drawn}</td>
                      <td className="hidden sm:table-cell px-3 py-3 text-center text-red-600 font-medium">{s.lost}</td>
                      <td className="hidden md:table-cell px-3 py-3 text-center text-slate-600">{s.goals_for}</td>
                      <td className="hidden md:table-cell px-3 py-3 text-center text-slate-600">{s.goals_against}</td>
                      <td className={cn('hidden sm:table-cell px-3 py-3 text-center font-medium', gd > 0 ? 'text-emerald-600' : gd < 0 ? 'text-red-600' : 'text-slate-500')}>
                        {gd > 0 ? '+' : ''}{gd}
                      </td>
                      {penalties.length > 0 && (
                        <td className="hidden md:table-cell px-3 py-3 text-center">
                          {teamPenalties.length > 0 ? (
                            <span className="text-red-600 font-medium">{s.penalty_points}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-sm">
                          {s.points}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {sortedStandings.length === 0 && isDataLoading && (
                  <>
                    {[...Array(8)].map((_, i) => (
                      <tr key={`skel-${i}`} className="border-b border-slate-100">
                        <td className="px-3 py-3"><div className="w-6 h-6 rounded-full bg-slate-200 animate-pulse" /></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 animate-pulse shrink-0" />
                            <div className="h-3.5 bg-slate-200 animate-pulse rounded w-28" />
                          </div>
                        </td>
                        {[...Array(8)].map((_, j) => (
                          <td key={j} className="px-3 py-3 text-center">
                            <div className="h-3.5 bg-slate-200 animate-pulse rounded w-6 mx-auto" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                )}
                {sortedStandings.length === 0 && !isDataLoading && (
                  <tr>
                    <td colSpan={penalties.length > 0 ? 12 : 11} className="px-4 py-12 text-center text-slate-400">
                      <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Henüz puan durumu oluşturulmamış
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {detailTeam && (
        <TeamDetailModal team={detailTeam} onClose={() => setDetailTeam(null)} />
      )}

      {/* Rules Viewer Modal */}
      {showRules && selectedTournament && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowRules(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 sm:my-8 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-emerald-50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 leading-tight truncate">Turnuva Kuralları</h2>
                  <p className="text-xs text-slate-500 truncate">{selectedTournament.name} · {selectedTournament.season}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 max-h-[60vh] overflow-y-auto">
              {selectedTournament.rules_text && selectedTournament.rules_text.trim() ? (
                <div className="space-y-3">
                  {selectedTournament.rules_text.split(/\n+/).filter((p: string) => p.trim()).map((para: string, idx: number) => (
                    <p key={idx} className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{para}</p>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="w-8 h-8 text-slate-300 mb-3" />
                  <p className="text-sm text-slate-400">Bu turnuva için henüz kural metni girilmemiştir.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
