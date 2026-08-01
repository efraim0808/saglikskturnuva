import { useState } from 'react';
import { useApp } from '../AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Play, Plus, Trash2, Shield, Calendar, RotateCcw, Clock, X, Users, AlertTriangle, AlertOctagon } from 'lucide-react';
import { cn, formatMatchDate, toLocalDatetimeInputValue } from '../lib/utils';
import type { LineupStatus } from '../types';

export function AdminFixtures() {
  const { fixtures, teams, players, suspensions, isSuperAdmin, selectedTournament, generateAutoFixture, addManualFixture, updateFixtureDate, deleteFixture, getLineupForFixture, setLineupStatus, resetTournamentData } = useApp();
  const [showAutoForm, setShowAutoForm] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [doubleRound, setDoubleRound] = useState(false);
  const [manualWeek, setManualWeek] = useState(1);
  const [manualHomeTeam, setManualHomeTeam] = useState('');
  const [manualAwayTeam, setManualAwayTeam] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualVenue, setManualVenue] = useState('');
  const [editingFixtureId, setEditingFixtureId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [lineupFixtureId, setLineupFixtureId] = useState<string | null>(null);
  const [lineupTeamId, setLineupTeamId] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [lineupWarning, setLineupWarning] = useState<string | null>(null);
  const [manualAdding, setManualAdding] = useState(false);

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  if (!selectedTournament) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Lütfen bir turnuva seçin.</p>
        </div>
      </div>
    );
  }

  const weeks = [...new Set(fixtures.map(f => f.week))].sort((a, b) => a - b);

  const handleAutoGenerate = async () => {
    if (autoGenerating) return;
    setAutoGenerating(true);
    try {
      await generateAutoFixture(doubleRound);
      setShowAutoForm(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Fikstür oluşturulamadı');
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleManualAdd = async () => {
    if (manualAdding) return;
    if (!manualHomeTeam || !manualAwayTeam) {
      alert('Lütfen her iki takımı da seçin');
      return;
    }
    if (manualHomeTeam === manualAwayTeam) {
      alert('Aynı takımı iki kez seçemezsiniz');
      return;
    }
    setManualAdding(true);
    try {
      await addManualFixture(manualWeek, manualHomeTeam, manualAwayTeam, manualDate || null, manualVenue || null);
      setShowManualForm(false);
      setManualWeek(1);
      setManualHomeTeam('');
      setManualAwayTeam('');
      setManualDate('');
      setManualVenue('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Maç eklenemedi');
    } finally {
      setManualAdding(false);
    }
  };

  const lineupFixture = fixtures.find(f => f.id === lineupFixtureId);
  const lineupTeam = teams.find(t => t.id === lineupTeamId);
  const lineupPlayers = lineupTeamId ? players.filter(p => p.team_id === lineupTeamId) : [];
  const currentLineup = lineupFixtureId && lineupTeamId ? getLineupForFixture(lineupFixtureId, lineupTeamId) : [];
  const selectedCount = currentLineup.filter(l => l.status === 'starter' || l.status === 'substitute').length;
  const MAX_LINEUP = 12;

  const isPlayerSuspended = (playerId: string) => {
    return suspensions.some(s => s.player_id === playerId && s.matches_remaining > 0);
  };

  const getPlayerStatus = (playerId: string): LineupStatus => {
    const entry = currentLineup.find(l => l.player_id === playerId);
    return entry?.status ?? 'unavailable';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fikstür Yönetimi</h1>
          <p className="text-sm text-slate-500 mt-1">{selectedTournament.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowAutoForm(!showAutoForm)}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Otomatik Fikstür
          </Button>
          <Button onClick={() => setShowManualForm(!showManualForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Manuel Maç
          </Button>
          {isSuperAdmin && fixtures.length > 0 && (
            <Button variant="danger" onClick={() => { setShowResetModal(true); setResetConfirmText(''); setResetDone(false); }}>
              <AlertOctagon className="w-4 h-4 mr-2" />
              Fikstürü Komple Sıfırla
            </Button>
          )}
        </div>
      </div>

      {showAutoForm && (
        <Card>
          <CardHeader>
            <CardTitle>Otomatik Fikstür Oluştur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={doubleRound}
                onChange={e => setDoubleRound(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Çift devreli (deplasmanlı) fikstür oluştur
            </label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAutoForm(false)} disabled={autoGenerating}>İptal</Button>
              <Button onClick={handleAutoGenerate} disabled={autoGenerating}>
                <Play className="w-4 h-4 mr-2" />
                {autoGenerating ? 'Oluşturuluyor...' : 'Oluştur'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showManualForm && (
        <Card>
          <CardHeader>
            <CardTitle>Manuel Maç Ekle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Hafta</label>
                <Input type="number" min={1} value={manualWeek} onChange={e => setManualWeek(parseInt(e.target.value) || 1)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tarih/Saat</label>
                <Input type="datetime-local" value={manualDate} onChange={e => setManualDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ev Sahibi Takım</label>
                <Select value={manualHomeTeam} onChange={e => setManualHomeTeam(e.target.value)}>
                  <option value="">Takım Seçin</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Deplasman Takımı</label>
                <Select value={manualAwayTeam} onChange={e => setManualAwayTeam(e.target.value)}>
                  <option value="">Takım Seçin</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Stadyum/Saha</label>
                <Input type="text" value={manualVenue} onChange={e => setManualVenue(e.target.value)} placeholder="Örn: Kocaeli Stadyumu" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowManualForm(false)} disabled={manualAdding}>İptal</Button>
              <Button onClick={handleManualAdd} disabled={manualAdding}>
                {manualAdding ? 'Ekleniyor...' : 'Ekle'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {weeks.map(week => (
        <Card key={week}>
          <CardHeader>
            <CardTitle>{week}. Hafta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto select-none whitespace-nowrap scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Ev Sahibi</th>
                    <th className="px-4 py-2 text-center font-medium text-slate-500">Skor</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">Deplasman</th>
                    <th className="px-4 py-2 text-center font-medium text-slate-500">Tarih/Saat</th>
                    <th className="px-4 py-2 text-center font-medium text-slate-500">Durum</th>
                    <th className="px-4 py-2 text-right font-medium text-slate-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {fixtures.filter(f => f.week === week)
                    .sort((a, b) => {
                      const aTime = a.match_date ? new Date(a.match_date).getTime() : Number.MAX_SAFE_INTEGER;
                      const bTime = b.match_date ? new Date(b.match_date).getTime() : Number.MAX_SAFE_INTEGER;
                      return aTime - bTime;
                    })
                    .map(fixture => (
                    <tr key={fixture.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-900">{fixture.home_team?.name}</td>
                      <td className="px-4 py-2 text-center font-bold text-slate-900">
                        {fixture.match?.home_score ?? 0} - {fixture.match?.away_score ?? 0}
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-900">{fixture.away_team?.name}</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs text-slate-700 font-medium">{formatMatchDate(fixture.match_date).date}</span>
                          <span className="text-xs text-slate-500">{formatMatchDate(fixture.match_date).time}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {fixture.status === 'live' && <Badge variant="success">Canlı</Badge>}
                        {fixture.status === 'completed' && <Badge variant="default">Bitti</Badge>}
                        {fixture.status === 'scheduled' && <Badge variant="info">Planlandı</Badge>}
                        {fixture.status === 'forfeit' && <Badge variant="warning">Hükmen</Badge>}
                        {fixture.status === 'cancelled' && <Badge variant="danger">İptal</Badge>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setLineupFixtureId(fixture.id);
                              setLineupTeamId(fixture.home_team_id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Kadro Düzenle (Esame)"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingFixtureId(fixture.id);
                              setEditDate(fixture.match_date ? toLocalDatetimeInputValue(new Date(fixture.match_date)) : '');
                            }}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Tarih/Saat Düzenle"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Bu maçı silmek istediğinize emin misiniz?')) {
                                deleteFixture(fixture.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
      {fixtures.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Henüz fikstür oluşturulmamış
          </CardContent>
        </Card>
      )}

      {/* Date/Time Edit Modal */}
      {editingFixtureId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Tarih/Saat Düzenle</h3>
              <button onClick={() => setEditingFixtureId(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Maç Tarihi ve Saati</label>
                <Input
                  type="datetime-local"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditDate('');
                  }}
                >
                  Tarihi Temizle
                </Button>
                <Button
                  className="flex-1"
                  onClick={async () => {
                    await updateFixtureDate(editingFixtureId, editDate || null);
                    setEditingFixtureId(null);
                  }}
                >
                  Kaydet
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lineup Editor Modal */}
      {lineupFixtureId && lineupFixture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Esame Listesi</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {lineupFixture.home_team?.name} vs {lineupFixture.away_team?.name}
                </p>
                <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${selectedCount >= MAX_LINEUP ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Users className="w-3 h-3" />
                  {selectedCount} / {MAX_LINEUP} oyuncu
                </div>
              </div>
              <button onClick={() => { setLineupFixtureId(null); setLineupTeamId(null); }} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Team selector tabs */}
            <div className="flex gap-2 px-6 pt-4">
              <button
                onClick={() => setLineupTeamId(lineupFixture.home_team_id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  lineupTeamId === lineupFixture.home_team_id
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {lineupFixture.home_team?.name}
              </button>
              <button
                onClick={() => setLineupTeamId(lineupFixture.away_team_id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  lineupTeamId === lineupFixture.away_team_id
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {lineupFixture.away_team?.name}
              </button>
            </div>

            {/* 12-player limit warning toast */}
            {lineupWarning && (
              <div className="mx-6 mt-3 p-3 rounded-lg bg-amber-50 border border-amber-300 flex items-center gap-2 text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{lineupWarning}</span>
              </div>
            )}

            {/* Player list */}
            <div className="overflow-y-auto p-6 flex-1">
              {lineupPlayers.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Bu takımda oyuncu bulunmuyor
                </div>
              ) : (
                <div className="space-y-2">
                  {lineupPlayers.map(player => {
                    const suspended = isPlayerSuspended(player.id);
                    const status = getPlayerStatus(player.id);
                    return (
                      <div key={player.id} className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-colors",
                        suspended ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 text-sm">{player.name}</div>
                            {suspended && (
                              <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                CEZALI
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {(['starter', 'substitute', 'unavailable'] as LineupStatus[]).map(s => {
                            const labels: Record<LineupStatus, string> = {
                              starter: 'As',
                              substitute: 'Yedek',
                              unavailable: 'Kadro Dışı',
                            };
                            const colors: Record<LineupStatus, string> = {
                              starter: status === 'starter' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-emerald-50',
                              substitute: status === 'substitute' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-blue-50',
                              unavailable: status === 'unavailable' ? 'bg-slate-400 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100',
                            };
                            const disabled = (suspended && s !== 'unavailable') || (s !== 'unavailable' && status === 'unavailable' && selectedCount >= MAX_LINEUP);
                            return (
                              <button
                                key={s}
                                disabled={disabled}
                                onClick={() => {
                                  if (s !== 'unavailable' && status === 'unavailable' && selectedCount >= MAX_LINEUP) {
                                    setLineupWarning(`Bir maç kadrosuna en fazla ${MAX_LINEUP} oyuncu (As + Yedek toplamı) seçebilirsiniz!`);
                                    setTimeout(() => setLineupWarning(null), 4000);
                                    return;
                                  }
                                  setLineupStatus(lineupFixtureId, lineupTeamId!, player.id, s);
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                  colors[s],
                                  disabled && "opacity-40 cursor-not-allowed"
                                )}
                              >
                                {labels[s]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <Button onClick={() => { setLineupFixtureId(null); setLineupTeamId(null); }}>
                Tamam
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Tournament Modal */}
      {showResetModal && selectedTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-red-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertOctagon className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="font-semibold text-slate-900">Fikstürü Komple Sıfırla</h2>
              </div>
              <button onClick={() => setShowResetModal(false)} className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              {resetDone ? (
                <div className="flex items-start gap-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
                  <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                  <span>Fikstür ve tüm bağlı veriler başarıyla sıfırlandı!</span>
                </div>
              ) : (
                <>
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700">
                    <p className="font-semibold mb-1">Dikkat: Bu işlem geri alınamaz!</p>
                    <p><span className="font-medium">{selectedTournament.name}</span> turnuvasına ait tüm maçlar, olaylar, esame listeleri, puan durumu ve istatistikler silinecek.</p>
                  </div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Onaylamak için <span className="font-bold text-red-600">SİL</span> yazın:
                  </label>
                  <Input
                    type="text"
                    value={resetConfirmText}
                    onChange={e => setResetConfirmText(e.target.value)}
                    placeholder="SİL"
                    autoFocus
                    autoComplete="off"
                  />
                  <div className="flex gap-3 mt-5">
                    <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowResetModal(false)} disabled={resetting}>
                      İptal
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="flex-1"
                      disabled={resetting || resetConfirmText.trim().toUpperCase() !== 'SİL'}
                      onClick={async () => {
                        setResetting(true);
                        try {
                          await resetTournamentData(selectedTournament.id);
                          setResetDone(true);
                          setTimeout(() => setShowResetModal(false), 1500);
                        } catch {
                          setResetting(false);
                        }
                      }}
                    >
                      {resetting ? 'Sıfırlanıyor...' : 'Tüm Verileri Sil'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
