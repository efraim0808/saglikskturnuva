import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TeamDetailModal } from '../components/TeamDetailModal';
import { formatTimer, formatMatchDate } from '../lib/utils';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Play, Pause, Activity, Eye, Goal, AlertTriangle, RefreshCw, X, Star, Users, Wrench } from 'lucide-react';
import { cn } from '../lib/utils';
import { PlayerCard, PlayerName } from '../components/PlayerCard';
import { EditScoreModal } from '../components/EditScoreModal';
import type { Team } from '../types';

export function Fixtures() {
  const { fixtures, matches, matchEvents, players, teams, selectedTournament, getLineupForFixture, isDataLoading, isScorekeeper } = useApp();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [detailFixtureId, setDetailFixtureId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [detailTeam, setDetailTeam] = useState<Team | null>(null);
  const [editScoreFixtureId, setEditScoreFixtureId] = useState<string | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      const { playerId } = (e as CustomEvent).detail;
      setSelectedPlayerId(playerId);
    }
    window.addEventListener('open-player-card', handler);
    return () => window.removeEventListener('open-player-card', handler);
  }, []);

  const weeks = Array.from(new Set(fixtures.map(f => f.week))).sort((a, b) => a - b);
  const currentWeekFixtures = fixtures
    .filter(f => f.week === currentWeek)
    .sort((a, b) => {
      const aTime = a.match_date ? new Date(a.match_date).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.match_date ? new Date(b.match_date).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

  const maxWeek = weeks.length > 0 ? Math.max(...weeks) : 1;

  const detailFixture = detailFixtureId ? fixtures.find(f => f.id === detailFixtureId) : null;
  const detailMatch = detailFixtureId ? matches.find(m => m.fixture_id === detailFixtureId) : null;
  const detailEvents = detailMatch
    ? matchEvents.filter(e => e.match_id === detailMatch.id).sort((a, b) => a.minute - b.minute)
    : [];
  const potmPlayer = detailMatch?.player_of_the_match
    ? players.find(p => p.id === detailMatch.player_of_the_match)
    : null;

  function getStatusBadge(status: string) {
    switch (status) {
      case 'live': return <Badge variant="success">Canlı</Badge>;
      case 'completed': return <Badge variant="default">Tamamlandı</Badge>;
      case 'cancelled': return <Badge variant="danger">İptal</Badge>;
      case 'forfeit': return <Badge variant="warning">Hükmen</Badge>;
      default: return <Badge variant="info">Planlandı</Badge>;
    }
  }

  function getEventIcon(eventType: string) {
    switch (eventType) {
      case 'goal': return <Goal className="w-4 h-4 text-emerald-600" />;
      case 'yellow_card': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'red_card': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'substitution': return <RefreshCw className="w-4 h-4 text-slate-500" />;
      case 'var_review': return <Eye className="w-4 h-4 text-sky-500" />;
      case 'penalty': return <Goal className="w-4 h-4 text-emerald-600" />;
      case 'penalty_missed': return <Goal className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  }

  function getEventLabel(eventType: string) {
    switch (eventType) {
      case 'goal': return 'Gol';
      case 'yellow_card': return 'Sarı Kart';
      case 'red_card': return 'Kırmızı Kart';
      case 'substitution': return 'Oyuncu Değişikliği';
      case 'var_review': return 'VAR İncelemesi';
      case 'penalty': return 'Penaltı';
      case 'penalty_missed': return 'Kaçan Penaltı';
      default: return eventType;
    }
  }

  return (
    <div className="space-y-6">
      {selectedPlayerId && (
        <PlayerCard playerId={selectedPlayerId} onClose={() => setSelectedPlayerId(null)} />
      )}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fikstür</h1>
        <p className="text-slate-500">{selectedTournament?.name}</p>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
          disabled={currentWeek <= 1}
          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700">Hafta {currentWeek}</span>
          <span className="text-sm text-slate-400">/ {maxWeek}</span>
        </div>
        <button
          onClick={() => setCurrentWeek(Math.min(maxWeek, currentWeek + 1))}
          disabled={currentWeek >= maxWeek}
          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid gap-4">
        {currentWeekFixtures.map(fixture => (
          <Card key={fixture.id} className={cn('overflow-hidden', fixture.status === 'live' && 'ring-2 ring-emerald-500')}>
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Match Info */}
                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(fixture.status)}
                      {fixture.match && fixture.status === 'live' && (
                        <div className="flex items-center gap-1 text-emerald-600 font-bold">
                          <Activity className="w-4 h-4 animate-pulse" />
                          <span>{formatTimer(fixture.match.timer_seconds)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                      <MapPin className="w-3 h-3" />
                      {fixture.venue || 'Belirtilmemiş'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Home Team */}
                    <div className="flex-1 text-center">
                      <button
                        onClick={() => fixture.home_team && setDetailTeam(fixture.home_team)}
                        className="text-lg font-bold text-slate-900 hover:text-emerald-600 hover:underline cursor-pointer transition-colors"
                      >
                        {fixture.home_team?.name}
                      </button>
                    </div>

                    {/* Score */}
                    <div className="px-6">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-slate-900">{fixture.match?.home_score ?? 0}</span>
                        <span className="text-xl text-slate-300">-</span>
                        <span className="text-3xl font-bold text-slate-900">{fixture.match?.away_score ?? 0}</span>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-center">
                      <button
                        onClick={() => fixture.away_team && setDetailTeam(fixture.away_team)}
                        className="text-lg font-bold text-slate-900 hover:text-emerald-600 hover:underline cursor-pointer transition-colors"
                      >
                        {fixture.away_team?.name}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1 mt-4 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      {formatMatchDate(fixture.match_date).date}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatMatchDate(fixture.match_date).time}
                    </div>
                  </div>

                  {/* Match Detail Button for completed/forfeit matches */}
                  {(fixture.status === 'completed' || fixture.status === 'forfeit') && (
                    <div className="flex justify-center mt-4">
                      <Button
                        onClick={() => setDetailFixtureId(fixture.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" /> Maç Detayı
                      </Button>
                    </div>
                  )}

                  {/* Edit Score Button for admins/scorekeepers */}
                  {isScorekeeper && selectedTournament?.status !== 'archived' && (
                    <div className="flex justify-center mt-3">
                      <Button
                        onClick={() => setEditScoreFixtureId(fixture.id)}
                        variant="primary"
                        size="sm"
                        className="bg-slate-800 hover:bg-slate-900"
                      >
                        <Wrench className="w-4 h-4 mr-2" /> Maçı Düzenle / Skor Gir
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {currentWeekFixtures.length === 0 && isDataLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Card key={`skel-${i}`} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 flex items-center justify-end gap-3">
                      <div className="h-4 bg-slate-200 animate-pulse rounded w-28" />
                      <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse shrink-0" />
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="h-5 bg-slate-200 animate-pulse rounded w-12" />
                      <div className="h-3 bg-slate-100 animate-pulse rounded w-16" />
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse shrink-0" />
                      <div className="h-4 bg-slate-200 animate-pulse rounded w-28" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {currentWeekFixtures.length === 0 && !isDataLoading && (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Bu hafta için maç bulunmuyor
            </CardContent>
          </Card>
        )}
      </div>

      {/* Match Detail Modal */}
      {detailFixture && detailMatch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/40 overflow-y-auto">
          <div className="w-full max-w-2xl my-4 sm:my-8 space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200">
              <div>
                <CardTitle className="text-base sm:text-lg">Maç Detayı</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  {detailFixture.home_team?.name} {detailMatch.home_score} - {detailMatch.away_score} {detailFixture.away_team?.name}
                </p>
              </div>
              <button
                onClick={() => setDetailFixtureId(null)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[50vh] sm:max-h-[60vh]">
              {/* Score Summary */}
              <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <button
                      onClick={() => detailFixture.home_team && setDetailTeam(detailFixture.home_team)}
                      className="text-sm sm:text-xl font-bold text-slate-900 leading-tight hover:text-emerald-600 hover:underline cursor-pointer transition-colors"
                    >
                      {detailFixture.home_team?.name}
                    </button>
                    <div className="text-3xl sm:text-4xl font-bold text-emerald-600 mt-2">{detailMatch.home_score}</div>
                  </div>
                  <div className="px-3 text-slate-300 text-xl sm:text-2xl font-light">vs</div>
                  <div className="flex-1 text-center">
                    <button
                      onClick={() => detailFixture.away_team && setDetailTeam(detailFixture.away_team)}
                      className="text-sm sm:text-xl font-bold text-slate-900 leading-tight hover:text-emerald-600 hover:underline cursor-pointer transition-colors"
                    >
                      {detailFixture.away_team?.name}
                    </button>
                    <div className="text-3xl sm:text-4xl font-bold text-emerald-600 mt-2">{detailMatch.away_score}</div>
                  </div>
                </div>

                {/* Player of the Match */}
                {potmPlayer && (
                  <div className="mt-5 mx-auto max-w-xs">
                    <div className="relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 shadow-md shadow-amber-200/60">
                      <div className="absolute inset-0 rounded-2xl ring-2 ring-amber-300/70 pointer-events-none" />
                      <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center shrink-0">
                        <Star className="w-5 h-5 text-amber-800 fill-amber-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800/70 leading-none mb-0.5">
                          Maçın Oyuncusu
                        </p>
                        <p className="text-base font-extrabold text-amber-950 leading-tight truncate">
                          <PlayerName playerId={potmPlayer.id} name={potmPlayer.name} className="text-amber-950" />
                        </p>
                        <p className="text-xs text-amber-800 font-medium truncate">
                          {teams.find(t => t.id === potmPlayer.team_id)?.name ?? ''}
                          {potmPlayer.position ? ` · ${potmPlayer.position}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Events Timeline */}
              <div className="p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Maç Kronolojisi</h3>
                {detailEvents.length > 0 ? (
                  <div className="space-y-3">
                    {detailEvents.map(event => (
                      <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-sm font-bold text-slate-400 min-w-[2.5rem]">{event.minute}'</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.event_type)}
                            <span className="font-medium text-sm text-slate-800">{getEventLabel(event.event_type)}</span>
                          </div>
                          <div className="text-sm text-slate-600 mt-0.5">
                            {event.player_id
                              ? <PlayerName playerId={event.player_id} name={event.player?.name ?? '—'} className="text-slate-700" />
                              : null
                            }
                            {event.assist_player && event.assist_player_id && (
                              <span className="text-slate-400"> (Asist: <PlayerName playerId={event.assist_player_id} name={event.assist_player.name} className="text-slate-500" />)</span>
                            )}
                          </div>
                          {event.details && (
                            <div className="text-xs text-slate-400 mt-0.5">{event.details}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    <Activity className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    Bu maç için kaydedilmiş olay bulunmuyor.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lineups */}
          {detailFixture && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[detailFixture.home_team_id, detailFixture.away_team_id].map(teamId => {
                const team = teams.find(t => t.id === teamId);
                const lineup = getLineupForFixture(detailFixture.id, teamId);
                const starters = lineup.filter(l => l?.status === 'starter');
                const subs = lineup.filter(l => l?.status === 'substitute');
                const hasLineup = starters.length > 0 || subs.length > 0;
                return (
                  <Card key={teamId}>
                    <CardHeader>
                      <CardTitle className="text-base">{team?.name ?? 'Bilinmeyen Takım'} Kadrosu</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hasLineup ? (
                        <>
                          {starters.length > 0 && (
                            <div className="mb-3">
                              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                As Oyuncular ({starters.length})
                              </div>
                              <div className="space-y-1">
                                {starters.map(l => {
                                  const pName = l?.player?.name || (l as any)?.players?.name || 'Bilinmeyen Oyuncu';
                                  const pNum = l?.player?.jersey_number || (l as any)?.players?.jersey_number;
                                  return (
                                  <div key={l.id} className="flex items-center gap-2 text-sm text-slate-700">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                                      {pName?.charAt(0)?.toUpperCase() ?? '?'}
                                    </div>
                                    {pName}
                                    {pNum ? <span className="text-xs text-slate-400">#{pNum}</span> : null}
                                  </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {subs.length > 0 && (
                            <div>
                              <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Yedekler ({subs.length})
                              </div>
                              <div className="space-y-1">
                                {subs.map(l => {
                                  const pName = l?.player?.name || (l as any)?.players?.name || 'Bilinmeyen Oyuncu';
                                  const pNum = l?.player?.jersey_number || (l as any)?.players?.jersey_number;
                                  return (
                                  <div key={l.id} className="flex items-center gap-2 text-sm text-slate-600">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                                      {pName?.charAt(0)?.toUpperCase() ?? '?'}
                                    </div>
                                    {pName}
                                    {pNum ? <span className="text-xs text-slate-400">#{pNum}</span> : null}
                                  </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <AlertTriangle className="w-5 h-5 text-slate-300 mb-2" />
                          <p className="text-sm text-slate-400">Bu maç için henüz kadro seçimi yapılmamıştır.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          </div>
        </div>
      )}

      {detailTeam && (
        <TeamDetailModal team={detailTeam} onClose={() => setDetailTeam(null)} />
      )}

      {editScoreFixtureId && (() => {
        const f = fixtures.find(fx => fx.id === editScoreFixtureId);
        return f ? <EditScoreModal fixture={f} onClose={() => setEditScoreFixtureId(null)} /> : null;
      })()}
    </div>
  );
}
