import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { X, Save, CheckCircle2, Trash2, Plus, Goal as GoalIcon, Square } from 'lucide-react';
import type { Fixture, MatchStatus } from '../types';
import { toLocalDatetimeInputValue, formatMatchDate } from '../lib/utils';

interface EditScoreModalProps {
  fixture: Fixture;
  onClose: () => void;
  onUpdated?: () => void;
}

export function EditScoreModal({ fixture, onClose, onUpdated }: EditScoreModalProps) {
  const {
    matches, matchEvents, players, teams,
    updateMatchScore, addMatchEvent, deleteMatchEvent, selectedTournament,
  } = useApp();
  const match = matches.find(m => m.fixture_id === fixture.id);

  const [homeScore, setHomeScore] = useState(String(match?.home_score ?? 0));
  const [awayScore, setAwayScore] = useState(String(match?.away_score ?? 0));
  const [status, setStatus] = useState<MatchStatus>(match?.status ?? 'scheduled');
  const [timerSeconds, setTimerSeconds] = useState(String(match?.timer_seconds ?? 0));
  const [matchDate, setMatchDate] = useState(
    fixture.match_date ? toLocalDatetimeInputValue(new Date(fixture.match_date)) : ''
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Maç detayları ve puan durumu başarıyla güncellendi!');

  // Goal management state
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalTeam, setGoalTeam] = useState<'home' | 'away'>('home');
  const [goalPlayerId, setGoalPlayerId] = useState('');
  const [goalMinute, setGoalMinute] = useState('');
  const [goalSaving, setGoalSaving] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Yellow card management state
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardTeam, setCardTeam] = useState<'home' | 'away'>('home');
  const [cardPlayerId, setCardPlayerId] = useState('');
  const [cardMinute, setCardMinute] = useState('');
  const [cardSaving, setCardSaving] = useState(false);

  // Sync score inputs when match changes from external goal add/delete
  useEffect(() => {
    if (match) {
      setHomeScore(String(match.home_score));
      setAwayScore(String(match.away_score));
    }
  }, [match?.home_score, match?.away_score]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => {
      setToast(false);
    }, 1800);
    return () => clearTimeout(t);
  }, [toast]);

  // All relevant events for this match (goals + yellow cards), sorted by minute
  const matchId = match?.id;
  const allEvents = matchId
    ? matchEvents
        .filter(e => e?.match_id === matchId && (e.event_type === 'goal' || e.event_type === 'penalty' || e.event_type === 'yellow_card'))
        .sort((a, b) => (a?.minute ?? 0) - (b?.minute ?? 0))
    : [];

  const goalCount = matchId
    ? matchEvents.filter(e => e?.match_id === matchId && (e.event_type === 'goal' || e.event_type === 'penalty')).length
    : 0;
  const cardCount = matchId
    ? matchEvents.filter(e => e?.match_id === matchId && e.event_type === 'yellow_card').length
    : 0;

  // Players by team
  const homePlayers = players.filter(p => p.team_id === fixture.home_team_id);
  const awayPlayers = players.filter(p => p.team_id === fixture.away_team_id);
  const goalTeamPlayers = goalTeam === 'home' ? homePlayers : awayPlayers;
  const cardTeamPlayers = cardTeam === 'home' ? homePlayers : awayPlayers;

  async function handleSave() {
    if (!match || saving) return;
    setSaving(true);
    try {
      await updateMatchScore(fixture.id, {
        homeScore: parseInt(homeScore) || 0,
        awayScore: parseInt(awayScore) || 0,
        status,
        timerSeconds: status === 'live' ? parseInt(timerSeconds) || 0 : undefined,
        matchDate: matchDate ? new Date(matchDate).toISOString() : null,
      });
      setToastMsg('Maç detayları ve puan durumu başarıyla güncellendi!');
      setToast(true);
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddGoal() {
    if (!goalPlayerId || goalSaving || !match) return;
    setGoalSaving(true);
    try {
      await addMatchEvent(fixture.id, 'goal', goalPlayerId, null, parseInt(goalMinute) || 0, null);
      setToastMsg('Oyuncu gol istatistikleri ve maç skoru başarıyla güncellendi!');
      setToast(true);
      setShowAddGoal(false);
      setGoalPlayerId('');
      setGoalMinute('');
    } finally {
      setGoalSaving(false);
    }
  }

  async function handleAddCard() {
    if (!cardPlayerId || cardSaving || !match) return;
    setCardSaving(true);
    try {
      await addMatchEvent(fixture.id, 'yellow_card', cardPlayerId, null, parseInt(cardMinute) || 0, null);
      setToastMsg('Oyuncu sarı kart istatistiği başarıyla eklendi!');
      setToast(true);
      setShowAddCard(false);
      setCardPlayerId('');
      setCardMinute('');
    } finally {
      setCardSaving(false);
    }
  }

  async function handleDeleteEvent(eventId: string, eventType: string) {
    if (deletingEventId) return;
    setDeletingEventId(eventId);
    try {
      await deleteMatchEvent(eventId, fixture.id);
      if (eventType === 'yellow_card') {
        setToastMsg('Sarı kart başarıyla silindi ve oyuncu istatistikleri güncellendi!');
      } else {
        setToastMsg('Oyuncu gol istatistikleri ve maç skoru başarıyla güncellendi!');
      }
      setToast(true);
    } finally {
      setDeletingEventId(null);
    }
  }

  function getTeamName(teamId: string | undefined): string {
    return teams.find(t => t.id === teamId)?.name ?? '';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md my-4 sm:my-8 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 leading-tight">Maçı Düzenle / Skor Gir</h2>
              <p className="text-xs text-slate-500 truncate">
                {fixture.home_team?.name} vs {fixture.away_team?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Score inputs */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Skor</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1 truncate">{fixture.home_team?.name}</p>
                <input
                  type="number"
                  min={0}
                  value={homeScore}
                  onChange={e => setHomeScore(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-xl text-slate-300 font-bold pt-5">-</span>
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1 truncate">{fixture.away_team?.name}</p>
                <input
                  type="number"
                  min={0}
                  value={awayScore}
                  onChange={e => setAwayScore(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* ── Match Events (Goals & Cards) Section ─────────────────────────── */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GoalIcon className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-700">Maç Olayları (Gol & Kart Yönetimi)</span>
              </div>
              <span className="text-xs text-slate-400">{goalCount} gol · {cardCount} sarı kart</span>
            </div>

            {/* Combined events list */}
            <div className="divide-y divide-slate-100">
              {allEvents.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-slate-400">
                  Bu maça ait gol veya kart kaydı bulunmamaktadır.
                </div>
              )}
              {allEvents.map(ev => {
                const player = ev.player || players.find(p => p.id === ev.player_id);
                const teamName = player ? getTeamName(player.team_id) : '';
                const isCard = ev.event_type === 'yellow_card';
                return (
                  <div key={ev.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      {isCard ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-amber-400 shrink-0">
                          <Square className="w-3 h-3 text-amber-700 fill-amber-700" />
                        </span>
                      ) : (
                        <span className="text-base shrink-0">⚽</span>
                      )}
                      <span className="text-sm font-medium text-slate-700 shrink-0">{ev.minute}'</span>
                      <span className="text-sm text-slate-600 truncate">
                        {player?.name || 'Bilinmeyen'}
                      </span>
                      <span className="text-xs text-slate-400 truncate hidden sm:inline">({teamName})</span>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(ev.id, ev.event_type)}
                      disabled={deletingEventId === ev.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 disabled:opacity-50"
                      title={isCard ? 'Kartı Sil' : 'Golü Sil'}
                    >
                      {deletingEventId === ev.id
                        ? <span className="text-xs">...</span>
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add goal form */}
            {showAddGoal ? (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                  <GoalIcon className="w-4 h-4" /> Yeni Gol Ekle
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Takım</label>
                  <Select
                    value={goalTeam}
                    onChange={e => {
                      setGoalTeam(e.target.value as 'home' | 'away');
                      setGoalPlayerId('');
                    }}
                  >
                    <option value="home">{fixture.home_team?.name} (Ev Sahibi)</option>
                    <option value="away">{fixture.away_team?.name} (Deplasman)</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Oyuncu</label>
                  <Select
                    value={goalPlayerId}
                    onChange={e => setGoalPlayerId(e.target.value)}
                  >
                    <option value="">Oyuncu seçin...</option>
                    {goalTeamPlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.jersey_number ? ` (#${p.jersey_number})` : ''}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Dakika (opsiyonel)</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={goalMinute}
                    onChange={e => setGoalMinute(e.target.value)}
                    placeholder="örn. 45"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={handleAddGoal} size="sm" className="flex-1" disabled={!goalPlayerId || goalSaving}>
                    {goalSaving ? 'Kaydediliyor...' : 'Golü Kaydet'}
                  </Button>
                  <Button onClick={() => { setShowAddGoal(false); setGoalPlayerId(''); setGoalMinute(''); }} variant="outline" size="sm">
                    İptal
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Add yellow card form */}
            {showAddCard ? (
              <div className="px-4 py-3 bg-amber-50/50 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-amber-400">
                    <Square className="w-2.5 h-2.5 text-amber-700 fill-amber-700" />
                  </span>
                  Yeni Sarı Kart Ekle
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Takım</label>
                  <Select
                    value={cardTeam}
                    onChange={e => {
                      setCardTeam(e.target.value as 'home' | 'away');
                      setCardPlayerId('');
                    }}
                  >
                    <option value="home">{fixture.home_team?.name} (Ev Sahibi)</option>
                    <option value="away">{fixture.away_team?.name} (Deplasman)</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Oyuncu</label>
                  <Select
                    value={cardPlayerId}
                    onChange={e => setCardPlayerId(e.target.value)}
                  >
                    <option value="">Oyuncu seçin...</option>
                    {cardTeamPlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.jersey_number ? ` (#${p.jersey_number})` : ''}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Dakika (opsiyonel)</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={cardMinute}
                    onChange={e => setCardMinute(e.target.value)}
                    placeholder="örn. 45"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={handleAddCard} size="sm" className="flex-1 bg-amber-500 hover:bg-amber-600" disabled={!cardPlayerId || cardSaving}>
                    {cardSaving ? 'Kaydediliyor...' : 'Kartı Kaydet'}
                  </Button>
                  <Button onClick={() => { setShowAddCard(false); setCardPlayerId(''); setCardMinute(''); }} variant="outline" size="sm">
                    İptal
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Action buttons */}
            {!showAddGoal && !showAddCard && (
              <div className="px-4 py-2.5 border-t border-slate-200 flex items-center gap-4">
                <button
                  onClick={() => setShowAddGoal(true)}
                  className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Yeni Gol Ekle
                </button>
                <span className="text-slate-200">|</span>
                <button
                  onClick={() => setShowAddCard(true)}
                  className="flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Yeni Sarı Kart Ekle
                </button>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Maç Durumu</label>
            <Select value={status} onChange={e => setStatus(e.target.value as MatchStatus)}>
              <option value="scheduled">Başlamadı</option>
              <option value="live">Canlı</option>
              <option value="completed">Bitti</option>
            </Select>
          </div>

          {/* Timer (only if live) */}
          {status === 'live' && (
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Maç Dakikası (saniye cinsinden)
              </label>
              <input
                type="number"
                min={0}
                value={timerSeconds}
                onChange={e => setTimerSeconds(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Örn: 45 dakika için 2700 yazın
              </p>
            </div>
          )}

          {/* Date/Time */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Tarih & Saat</label>
            <input
              type="datetime-local"
              value={matchDate}
              onChange={e => setMatchDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {fixture.match_date && (
              <p className="text-xs text-slate-400 mt-1">
                Mevcut: {formatMatchDate(fixture.match_date).full}
              </p>
            )}
          </div>

          {/* Points info */}
          {selectedTournament && (
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold">
                G: {selectedTournament.win_points}p
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                B: {selectedTournament.draw_points}p
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 font-semibold">
                M: {selectedTournament.loss_points}p
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <Button onClick={handleSave} className="flex-1" disabled={saving || toast}>
            {saving ? (
              'Kaydediliyor...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Sonucu Güncelle
              </>
            )}
          </Button>
          <Button onClick={onClose} variant="outline" disabled={saving}>
            İptal
          </Button>
        </div>
      </div>

      {/* Success Toast */}
      {toast && (
        <div className="toast-notification fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium text-sm">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
