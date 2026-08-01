import { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Shield, AlertTriangle, Minus, Trash2, Plus, Gavel, UserX, Clock, Pencil, X, CheckCircle2, Square } from 'lucide-react';
import { cn } from '../lib/utils';

export function Suspensions() {
  const { suspensions, players, teams, selectedTournament, canManageSuspensions, addSuspension, reduceSuspension, removeSuspension, updateSuspension, matchEvents, fixtures, matches } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [matchesCount, setMatchesCount] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTotal, setEditTotal] = useState(1);
  const [editRemaining, setEditRemaining] = useState(1);
  const [editReason, setEditReason] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isArchived = selectedTournament?.status === 'archived';

  // Compute yellow card counts per player for the selected tournament
  const yellowCardTracker = useMemo(() => {
    if (!selectedTournament) return [];
    const tournamentFixtureIds = new Set(fixtures.filter(f => f.tournament_id === selectedTournament.id).map(f => f.id));
    const tournamentMatchIds = new Set(matches.filter(m => tournamentFixtureIds.has(m.fixture_id)).map(m => m.id));
    const cardMap = new Map<string, number>();
    for (const ev of matchEvents) {
      if (ev?.event_type === 'yellow_card' && ev?.player_id && tournamentMatchIds.has(ev.match_id)) {
        cardMap.set(ev.player_id, (cardMap.get(ev.player_id) || 0) + 1);
      }
    }
    return Array.from(cardMap.entries())
      .map(([playerId, count]) => {
        const player = players.find(p => p.id === playerId);
        const team = teams.find(t => t.id === player?.team_id);
        return { player, team, count };
      })
      .filter(e => e.player)
      .sort((a, b) => b.count - a.count);
  }, [selectedTournament, matchEvents, fixtures, matches, players, teams]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const activeSuspensions = suspensions.filter(s => s.matches_remaining > 0);
  const completedSuspensions = suspensions.filter(s => s.matches_remaining === 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlayer || !suspensionReason) return;
    const player = players.find(p => p.id === selectedPlayer);
    if (!player) return;
    await addSuspension(player.id, player.team_id, suspensionReason, matchesCount);
    setSelectedPlayer('');
    setSuspensionReason('');
    setMatchesCount(1);
    setShowAddForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cezalı Oyuncular / Disiplin</h1>
          <p className="text-slate-500">{selectedTournament?.name}</p>
        </div>
        {!isArchived && canManageSuspensions && (
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" /> Manuel Ceza Ekle
          </Button>
        )}
      </div>

      {showAddForm && !isArchived && canManageSuspensions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gavel className="w-4 h-4" />
              Manuel Ceza Ekle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Oyuncu</label>
                <Select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} required>
                  <option value="">Seçin...</option>
                  {teams.filter(t => t.status === 'approved').map(team => (
                    <optgroup key={team.id} label={team.name}>
                      {players.filter(p => p.team_id === team.id).map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.jersey_number})</option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Ceza Sebebi</label>
                <Input value={suspensionReason} onChange={e => setSuspensionReason(e.target.value)} placeholder="Örn: Yöneticiye hakaret" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Maç Sayısı</label>
                <Input type="number" min={1} max={10} value={matchesCount} onChange={e => setMatchesCount(parseInt(e.target.value) || 1)} required />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">Ceza Uygula</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">İptal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Suspensions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Aktif Cezalar ({activeSuspensions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto select-none whitespace-nowrap scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-sm whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Oyuncu</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Takım</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Sebep</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-500">Toplam</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-500">Kalan</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-500">Tür</th>
                  {!isArchived && canManageSuspensions && <th className="px-4 py-3 text-right font-medium text-slate-500">İşlemler</th>}
                </tr>
              </thead>
              <tbody>
                {activeSuspensions.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.player?.name}</td>
                    <td className="px-4 py-3 text-slate-600">{s.team?.name}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{s.reason}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{s.matches_total}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-bold">
                        {s.matches_remaining}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.is_auto ? (
                        <Badge variant="danger">Otomatik</Badge>
                      ) : (
                        <Badge variant="warning">Manuel</Badge>
                      )}
                    </td>
                    {!isArchived && canManageSuspensions && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingId(s.id);
                              setEditTotal(s.matches_total);
                              setEditRemaining(s.matches_remaining);
                              setEditReason(s.reason);
                            }}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Düzenle"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Bu cezayı 1 maç azaltmak istediğinize emin misiniz?')) {
                                reduceSuspension(s.id, 1);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="1 maç azalt"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(s.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Cezayı sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {activeSuspensions.length === 0 && (
                  <tr>
                    <td colSpan={!isArchived && canManageSuspensions ? 7 : 6} className="px-4 py-12 text-center text-slate-400">
                      <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Aktif ceza bulunmuyor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Completed Suspensions */}
      {completedSuspensions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              Tamamlanan Cezalar ({completedSuspensions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto select-none whitespace-nowrap scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-sm whitespace-nowrap min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Oyuncu</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Takım</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Sebep</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-500">Toplam</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-500">Tür</th>
                    {canManageSuspensions && <th className="px-4 py-3 text-right font-medium text-slate-500">İşlemler</th>}
                  </tr>
                </thead>
                <tbody>
                  {completedSuspensions.map(s => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 opacity-60">
                      <td className="px-4 py-3 font-medium text-slate-900">{s.player?.name}</td>
                      <td className="px-4 py-3 text-slate-600">{s.team?.name}</td>
                      <td className="px-4 py-3 text-slate-600">{s.reason}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{s.matches_total}</td>
                      <td className="px-4 py-3 text-center">
                        {s.is_auto ? (
                          <Badge variant="default">Otomatik</Badge>
                        ) : (
                          <Badge variant="default">Manuel</Badge>
                        )}
                      </td>
                      {canManageSuspensions && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingId(s.id);
                                setEditTotal(s.matches_total);
                                setEditRemaining(s.matches_remaining);
                                setEditReason(s.reason);
                              }}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Düzenle"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(s.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                              title="Cezayı sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Suspension Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Ceza Düzenle</h3>
              <button onClick={() => setEditingId(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Toplam Ceza Maç Sayısı</label>
                <Input
                  type="number"
                  min={0}
                  value={editTotal}
                  onChange={e => setEditTotal(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Kalan Ceza Maç Sayısı</label>
                <Input
                  type="number"
                  min={0}
                  max={editTotal}
                  value={editRemaining}
                  onChange={e => setEditRemaining(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ceza Sebebi</label>
                <Input
                  type="text"
                  value={editReason}
                  onChange={e => setEditReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditingId(null)}>
                  İptal
                </Button>
                <Button
                  className="flex-1"
                  onClick={async () => {
                    await updateSuspension(editingId, editTotal, editRemaining, editReason);
                    setEditingId(null);
                  }}
                >
                  Kaydet
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Ceza Kaydını Sil</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Bu oyuncunun ceza kaydını tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve oyuncunun üzerindeki ceza engeli anında kalkacaktır.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
                İptal
              </Button>
              <Button
                className="flex-1 !bg-red-600 hover:!bg-red-700"
                onClick={async () => {
                  await removeSuspension(deleteId);
                  setDeleteId(null);
                  showToast('Oyuncunun cezası başarıyla kaldırıldı!');
                }}
              >
                Evet, Sil
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Yellow Card Tracking Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-400">
              <Square className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
            </span>
            Sarı Kart Takip Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {yellowCardTracker.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">
              Bu turnuvada sarı kart gören oyuncu bulunmamaktadır.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs">
                    <th className="text-left py-2 px-3 font-medium">Oyuncu</th>
                    <th className="text-left py-2 px-3 font-medium">Takım</th>
                    <th className="text-center py-2 px-3 font-medium">Sarı Kart</th>
                    <th className="text-center py-2 px-3 font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {yellowCardTracker.map(({ player, team, count }) => {
                    const nearLimit = count === 3;
                    const suspended = count >= 4 && count % 4 === 0;
                    return (
                      <tr key={player!.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-700">{player!.name}</td>
                        <td className="py-2.5 px-3 text-slate-500">{team?.name || '-'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm bg-amber-400">
                              <Square className="w-2 h-2 text-amber-700 fill-amber-700" />
                            </span>
                            <span className="font-semibold text-slate-700">{count}</span>
                            <span className="text-slate-300">/ 4</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {nearLimit ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              CEZA SINIRINDA!
                            </span>
                          ) : suspended ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                              <UserX className="w-3.5 h-3.5" />
                              Cezalı
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-emerald-600">Aktif</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium bg-emerald-600 text-white animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}
    </div>
  );
}
