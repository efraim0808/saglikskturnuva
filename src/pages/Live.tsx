import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { TeamDetailModal } from '../components/TeamDetailModal';
import { formatTimer, formatMatchDate } from '../lib/utils';
import { Activity, Play, Pause, Square, Goal, AlertTriangle, RefreshCw, Eye, Star, Calendar, Clock, Wrench } from 'lucide-react';
import { cn } from '../lib/utils';
import { EditScoreModal } from '../components/EditScoreModal';
import type { Team } from '../types';

export function Live() {
  const {
    fixtures, matches, matchEvents, players, suspensions, isScorekeeper, selectedTournament,
    startMatch, pauseMatch, resumeMatch, endMatch, addMatchEvent, getLineupForFixture,
  } = useApp();

  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventType, setEventType] = useState<string>('goal');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedAssistId, setSelectedAssistId] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [potmPlayerId, setPotmPlayerId] = useState('');
  const [potmError, setPotmError] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [endingMatch, setEndingMatch] = useState(false);
  const [detailTeam, setDetailTeam] = useState<Team | null>(null);
  const [editScoreFixtureId, setEditScoreFixtureId] = useState<string | null>(null);

  const liveFixtures = fixtures.filter(f => f.status === 'live' || f.status === 'scheduled');
  const selectedFixture = fixtures.find(f => f.id === selectedFixtureId);
  const selectedMatch = matches.find(m => m.fixture_id === selectedFixtureId);
  const fixtureEvents = matchEvents.filter(e => e.match_id === selectedMatch?.id).sort((a, b) => a.minute - b.minute);

  const homePlayers = selectedFixture ? players.filter(p => p.team_id === selectedFixture.home_team_id) : [];
  const awayPlayers = selectedFixture ? players.filter(p => p.team_id === selectedFixture.away_team_id) : [];
  const allMatchPlayers = [...homePlayers, ...awayPlayers];

  // Active suspensions for players in this match
  const activeSuspensionMap: Record<string, number> = {};
  suspensions.forEach(s => {
    if (s.matches_remaining > 0) activeSuspensionMap[s.player_id] = s.matches_remaining;
  });

  useEffect(() => {
    if (selectedFixtureId) return;
    const live = fixtures.find(f => f.status === 'live');
    const first = fixtures.find(f => f.status === 'live' || f.status === 'scheduled');
    const autoId = (live ?? first)?.id ?? null;
    if (autoId) setSelectedFixtureId(autoId);
  }, [fixtures]);

  async function handleStartMatch() {
    if (!selectedFixtureId) return;
    await startMatch(selectedFixtureId);
  }

  async function handlePauseMatch() {
    if (!selectedFixtureId) return;
    await pauseMatch(selectedFixtureId);
  }

  async function handleResumeMatch() {
    if (!selectedFixtureId) return;
    await resumeMatch(selectedFixtureId);
  }

  async function handleEndMatch() {
    if (!selectedFixtureId || endingMatch) return;
    if (!potmPlayerId) {
      setPotmError(true);
      return;
    }
    setPotmError(false);
    setEndingMatch(true);
    try {
      await endMatch(selectedFixtureId, potmPlayerId);
      setPotmPlayerId('');
    } finally {
      setEndingMatch(false);
    }
  }

  async function handleAddEvent() {
    if (!selectedFixtureId || !selectedMatch || eventSubmitting) return;

    // Block suspended players from being added to events as the main player
    if (selectedPlayerId && activeSuspensionMap[selectedPlayerId]) {
      const remaining = activeSuspensionMap[selectedPlayerId];
      alert(`Bu oyuncu cezalıdır ve kadroya yazılamaz! Kalan ceza: ${remaining} maç.`);
      return;
    }

    const minute = Math.floor(selectedMatch.timer_seconds / 60);
    setEventSubmitting(true);
    try {
      await addMatchEvent(
        selectedFixtureId,
        eventType,
        selectedPlayerId || null,
        eventType === 'goal' ? (selectedAssistId || null) : null,
        minute,
        eventDetails || null,
      );
      setEventModalOpen(false);
      setSelectedPlayerId('');
      setSelectedAssistId('');
      setEventDetails('');
    } finally {
      setEventSubmitting(false);
    }
  }

  const isArchived = selectedTournament?.status === 'archived';
  const canEnd = selectedMatch?.status === 'live' || selectedMatch?.status === 'paused';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Canlı Skor Merkezi</h1>
        <p className="text-slate-500">{selectedTournament?.name}</p>
      </div>

      {/* Match Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium text-slate-700 mb-1 block">Maç Seçin</label>
              <Select
                value={selectedFixtureId || ''}
                onChange={e => setSelectedFixtureId(e.target.value || null)}
              >
                <option value="">Maç seçin...</option>
                {liveFixtures.map(f => {
                  const dt = formatMatchDate(f.match_date);
                  return (
                    <option key={f.id} value={f.id}>
                      {f.home_team?.name} vs {f.away_team?.name} — {dt.date} {dt.time} {f.status === 'live' ? '(Canlı)' : ''}
                    </option>
                  );
                })}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedFixture && selectedMatch && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column: scoreboard + stream + events */}
          <div className="lg:col-span-2 space-y-4">

            {/* Scoreboard */}
            <Card className={cn('overflow-hidden', selectedMatch.status === 'live' && 'ring-2 ring-emerald-500')}>
              <CardContent className="p-8">
                <div className="flex items-center justify-center mb-6">
                  {selectedMatch.status === 'live' && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-bold text-red-700">CANLI</span>
                    </div>
                  )}
                  {selectedMatch.status === 'paused' && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-full">
                      <Pause className="w-3 h-3 text-amber-700" />
                      <span className="text-sm font-bold text-amber-700">DURAKLATILDI</span>
                    </div>
                  )}
                  {selectedMatch.status === 'completed' && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                      <Square className="w-3 h-3 text-slate-700" />
                      <span className="text-sm font-bold text-slate-700">MAÇ BİTTİ</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <button
                      onClick={() => selectedFixture.home_team && setDetailTeam(selectedFixture.home_team)}
                      className="text-2xl font-bold text-slate-900 mb-2 hover:text-emerald-600 hover:underline cursor-pointer transition-colors"
                    >
                      {selectedFixture.home_team?.name}
                    </button>
                    <div className="text-5xl font-bold text-emerald-600">{selectedMatch.home_score}</div>
                  </div>
                  <div className="px-6 text-center">
                    <div className="text-4xl font-mono font-bold text-slate-900">
                      {formatTimer(selectedMatch.timer_seconds)}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Dakika</div>
                  </div>
                  <div className="flex-1 text-center">
                    <button
                      onClick={() => selectedFixture.away_team && setDetailTeam(selectedFixture.away_team)}
                      className="text-2xl font-bold text-slate-900 mb-2 hover:text-emerald-600 hover:underline cursor-pointer transition-colors"
                    >
                      {selectedFixture.away_team?.name}
                    </button>
                    <div className="text-5xl font-bold text-emerald-600">{selectedMatch.away_score}</div>
                  </div>
                </div>

                {/* Match Date/Time Display */}
                <div className="mt-6 flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                    <Calendar className="w-4 h-4" />
                    {formatMatchDate(selectedFixture.match_date).date}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    <Clock className="w-4 h-4" />
                    {formatMatchDate(selectedFixture.match_date).time}
                  </div>
                </div>

                {/* Timer Controls */}
                {!isArchived && isScorekeeper && (
                  <div className="mt-8 space-y-4">
                    {/* POTM selector shown when match can be ended */}
                    {canEnd && (
                      <div className={`p-4 rounded-xl border-2 ${potmError ? 'border-red-300 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                        <label className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-2">
                          <Star className="w-4 h-4 text-amber-500" />
                          Maçın Oyuncusu
                          <span className="text-red-500">*</span>
                          {potmError && <span className="text-red-600 font-normal">(Maçı bitirmeden önce seçim yapın)</span>}
                        </label>
                        <Select
                          value={potmPlayerId}
                          onChange={e => { setPotmPlayerId(e.target.value); setPotmError(false); }}
                        >
                          <option value="">Oyuncu seçin...</option>
                          <optgroup label={selectedFixture?.home_team?.name ?? 'Ev Sahibi'}>
                            {homePlayers.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.jersey_number ?? '-'})</option>
                            ))}
                          </optgroup>
                          <optgroup label={selectedFixture?.away_team?.name ?? 'Deplasman'}>
                            {awayPlayers.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.jersey_number ?? '-'})</option>
                            ))}
                          </optgroup>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-3">
                      {selectedMatch?.status === 'scheduled' && (
                        <Button onClick={handleStartMatch} variant="primary" size="lg">
                          <Play className="w-5 h-5 mr-2" /> Maçı Başlat
                        </Button>
                      )}
                      {selectedMatch?.status === 'live' && (
                        <>
                          <Button onClick={handlePauseMatch} variant="secondary" size="lg">
                            <Pause className="w-5 h-5 mr-2" /> Duraklat
                          </Button>
                          <Button onClick={handleEndMatch} variant="danger" size="lg" disabled={endingMatch}>
                            <Square className="w-5 h-5 mr-2" /> {endingMatch ? 'Bitiriliyor...' : 'Maçı Bitir'}
                          </Button>
                        </>
                      )}
                      {selectedMatch?.status === 'paused' && (
                        <>
                          <Button onClick={handleResumeMatch} variant="primary" size="lg">
                            <Play className="w-5 h-5 mr-2" /> Devam Et
                          </Button>
                          <Button onClick={handleEndMatch} variant="danger" size="lg" disabled={endingMatch}>
                            <Square className="w-5 h-5 mr-2" /> {endingMatch ? 'Bitiriliyor...' : 'Maçı Bitir'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Score Button - available for all match statuses */}
            {!isArchived && isScorekeeper && (
              <div className="flex justify-center mt-4">
                <Button
                  onClick={() => setEditScoreFixtureId(selectedFixture.id)}
                  variant="primary"
                  className="bg-slate-800 hover:bg-slate-900"
                >
                  <Wrench className="w-4 h-4 mr-2" /> Maçı Düzenle / Skor Gir
                </Button>
              </div>
            )}

            {/* Event Buttons */}
            {!isArchived && isScorekeeper && selectedMatch.status !== 'completed' && selectedMatch.status !== 'scheduled' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Olay Girişi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button onClick={() => { setEventType('goal'); setEventModalOpen(true); }} variant="primary">
                      <Goal className="w-4 h-4 mr-2" /> Gol
                    </Button>
                    <Button onClick={() => { setEventType('yellow_card'); setEventModalOpen(true); }} variant="secondary">
                      <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" /> Sarı Kart
                    </Button>
                    <Button onClick={() => { setEventType('red_card'); setEventModalOpen(true); }} variant="danger">
                      <AlertTriangle className="w-4 h-4 mr-2" /> Kırmızı Kart
                    </Button>
                    <Button onClick={() => { setEventType('substitution'); setEventModalOpen(true); }} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" /> Oyuncu Değişikliği
                    </Button>
                    <Button onClick={() => { setEventType('var_review'); setEventModalOpen(true); }} variant="ghost">
                      <Eye className="w-4 h-4 mr-2" /> VAR
                    </Button>
                    <Button onClick={() => { setEventType('penalty'); setEventModalOpen(true); }} variant="outline">
                      <Goal className="w-4 h-4 mr-2" /> Penaltı
                    </Button>
                    <Button onClick={() => { setEventType('penalty_missed'); setEventModalOpen(true); }} variant="outline">
                      <Goal className="w-4 h-4 mr-2" /> Kaçan Penaltı
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Event Modal */}
            {eventModalOpen && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {eventType === 'goal' ? 'Gol Ekle'
                      : eventType === 'yellow_card' ? 'Sarı Kart Ekle'
                      : eventType === 'red_card' ? 'Kırmızı Kart Ekle'
                      : eventType === 'substitution' ? 'Oyuncu Değişikliği'
                      : eventType === 'var_review' ? 'VAR İncelemesi'
                      : eventType === 'penalty' ? 'Penaltı Gol'
                      : eventType === 'penalty_missed' ? 'Kaçan Penaltı'
                      : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">
                      {eventType === 'substitution' ? 'Çıkan Oyuncu' : 'Oyuncu'}
                    </label>
                    <Select value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)}>
                      <option value="">Seçin...</option>
                      <optgroup label={selectedFixture.home_team?.name}>
                        {homePlayers.map(p => {
                          const rem = activeSuspensionMap[p.id];
                          return (
                            <option key={p.id} value={p.id} disabled={!!rem}>
                              {p.name} ({p.jersey_number}){rem ? ` ⚠️ Cezalı — ${rem} Maç` : ''}
                            </option>
                          );
                        })}
                      </optgroup>
                      <optgroup label={selectedFixture.away_team?.name}>
                        {awayPlayers.map(p => {
                          const rem = activeSuspensionMap[p.id];
                          return (
                            <option key={p.id} value={p.id} disabled={!!rem}>
                              {p.name} ({p.jersey_number}){rem ? ` ⚠️ Cezalı — ${rem} Maç` : ''}
                            </option>
                          );
                        })}
                      </optgroup>
                    </Select>
                    {selectedPlayerId && activeSuspensionMap[selectedPlayerId] && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Bu oyuncu cezalıdır ve kadroya yazılamaz! Kalan ceza: {activeSuspensionMap[selectedPlayerId]} maç.
                      </p>
                    )}
                  </div>

                  {eventType === 'goal' && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Asist (İsteğe Bağlı)</label>
                      <Select value={selectedAssistId} onChange={e => setSelectedAssistId(e.target.value)}>
                        <option value="">Asist yok</option>
                        <optgroup label={selectedFixture.home_team?.name}>
                          {homePlayers.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.jersey_number})</option>
                          ))}
                        </optgroup>
                        <optgroup label={selectedFixture.away_team?.name}>
                          {awayPlayers.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.jersey_number})</option>
                          ))}
                        </optgroup>
                      </Select>
                    </div>
                  )}

                  {eventType === 'substitution' && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Giren Oyuncu</label>
                      <Select value={selectedAssistId} onChange={e => setSelectedAssistId(e.target.value)}>
                        <option value="">Seçin...</option>
                        <optgroup label={selectedFixture.home_team?.name}>
                          {homePlayers.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.jersey_number})</option>
                          ))}
                        </optgroup>
                        <optgroup label={selectedFixture.away_team?.name}>
                          {awayPlayers.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.jersey_number})</option>
                          ))}
                        </optgroup>
                      </Select>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Detaylar</label>
                    <input
                      type="text"
                      value={eventDetails}
                      onChange={e => setEventDetails(e.target.value)}
                      placeholder="Varsa ek bilgi..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleAddEvent} className="flex-1" disabled={eventSubmitting}>
                      {eventSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                    <Button onClick={() => setEventModalOpen(false)} variant="outline" className="flex-1">İptal</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Match Timeline */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Maç Kronolojisi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {fixtureEvents.map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="text-sm font-bold text-slate-400 min-w-[2.5rem]">{event.minute}'</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {event.event_type === 'goal' && <Goal className="w-4 h-4 text-emerald-600" />}
                          {event.event_type === 'yellow_card' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          {event.event_type === 'red_card' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                          {event.event_type === 'substitution' && <RefreshCw className="w-4 h-4 text-slate-500" />}
                          {event.event_type === 'var_review' && <Eye className="w-4 h-4 text-sky-500" />}
                          {event.event_type === 'penalty' && <Goal className="w-4 h-4 text-emerald-600" />}
                          {event.event_type === 'penalty_missed' && <Goal className="w-4 h-4 text-red-400" />}
                          <span className="font-medium text-sm">
                            {event.event_type === 'goal' ? 'Gol'
                              : event.event_type === 'yellow_card' ? 'Sarı Kart'
                              : event.event_type === 'red_card' ? 'Kırmızı Kart'
                              : event.event_type === 'substitution' ? 'Oyuncu Değişikliği'
                              : event.event_type === 'var_review' ? 'VAR İncelemesi'
                              : event.event_type === 'penalty' ? 'Penaltı'
                              : event.event_type === 'penalty_missed' ? 'Kaçan Penaltı'
                              : null}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 mt-0.5">
                          {event.player?.name}
                          {event.assist_player && <span className="text-slate-400"> (Asist: {event.assist_player.name})</span>}
                        </div>
                        {event.details && (
                          <div className="text-xs text-slate-400 mt-0.5">{event.details}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {fixtureEvents.length === 0 && (
                    <div className="text-center text-slate-400 py-8">
                      <Activity className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      Henüz olay kaydedilmemiş
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!selectedFixture && (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            {liveFixtures.length === 0
              ? 'Şu anda canlı veya planlanmış maç bulunmamaktadır.'
              : 'Canlı takip etmek için bir maç seçin'}
          </CardContent>
        </Card>
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
