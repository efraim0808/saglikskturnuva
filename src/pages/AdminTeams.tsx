import { useState } from 'react';
import { useApp } from '../AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Users, Check, X, Trash2, Shield, UserPlus, ChevronDown, ChevronRight, User, Phone, ImageIcon, Palette, AlertTriangle, Pencil, CheckCircle } from 'lucide-react';
import { cn, toTurkishUpper } from '../lib/utils';
import type { Player } from '../types';

const POSITIONS = ['Kaleci', 'Defans', 'Orta Saha', 'Kanat', 'Forvet'] as const;

const POSITION_ABBR: Record<string, string> = {
  'Kaleci': 'KL', 'Defans': 'DF', 'Orta Saha': 'OS', 'Kanat': 'KN', 'Forvet': 'FV',
};

const POSITION_COLORS: Record<string, string> = {
  'Kaleci': 'bg-amber-100 text-amber-700',
  'Defans': 'bg-sky-100 text-sky-700',
  'Orta Saha': 'bg-emerald-100 text-emerald-700',
  'Kanat': 'bg-orange-100 text-orange-700',
  'Forvet': 'bg-red-100 text-red-700',
};

function TeamAvatar({ name, logoUrl, color }: { name: string; logoUrl?: string | null; color?: string | null }) {
  if (logoUrl) {
    return <img src={logoUrl} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200" />;
  }
  return (
    <div
      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
      style={{ backgroundColor: color || '#16a34a' }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function AdminTeams() {
  const { teams, players, isSuperAdmin, selectedTournament, addTeam, approveTeam, rejectTeam, deleteTeam, deletePlayer, updatePlayer } = useApp();

  // Add team form
  const [newTeamName, setNewTeamName] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [newLogoBase64, setNewLogoBase64] = useState<string>('');
  const [newJerseyColor, setNewJerseyColor] = useState('#16a34a');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Edit player
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState('');
  const [editJerseyNumber, setEditJerseyNumber] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editTeamId, setEditTeamId] = useState('');
  const [editHospital, setEditHospital] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTcNo, setEditTcNo] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-400">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Bu sayfaya erişim yetkiniz yok.
        </CardContent>
      </Card>
    );
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  function openEdit(player: Player) {
    setEditingPlayer(player);
    setEditName(player.name);
    setEditJerseyNumber(player.jersey_number != null ? String(player.jersey_number) : '');
    setEditPosition(player.position || '');
    setEditTeamId(player.team_id);
    setEditHospital(player.hospital || '');
    setEditDepartment(player.department || '');
    setEditPhone(player.phone || '');
    setEditTcNo(player.tc_no || '');
    setEditError(null);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPlayer || editSubmitting) return;
    setEditSubmitting(true);
    setEditError(null);
    const error = await updatePlayer(editingPlayer.id, {
      name: editName,
      jersey_number: editJerseyNumber !== '' ? Number(editJerseyNumber) : null,
      position: editPosition || null,
      team_id: editTeamId,
      hospital: editHospital.trim() || null,
      department: editDepartment.trim() || null,
      phone: editPhone.trim() || null,
      tc_no: editTcNo.trim() || null,
    });
    setEditSubmitting(false);
    if (error) { setEditError(error); return; }
    setEditingPlayer(null);
    showToast('Oyuncu bilgileri başarıyla güncellendi.');
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNewLogoBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim() || submitting) return;
    setSubmitting(true);
    setAddError(null);
    const error = await addTeam(newTeamName, newManagerName, newLogoBase64 || null, newJerseyColor);
    setSubmitting(false);
    if (error) { setAddError(error); return; }
    setNewTeamName('');
    setNewManagerName('');
    setNewLogoBase64('');
    setNewJerseyColor('#16a34a');
    setShowAddForm(false);
  }

  async function handleApproveTeam(id: string) {
    if (approvingId) return;
    setApprovingId(id);
    try { await approveTeam(id); } finally { setApprovingId(null); }
  }

  function toggleTeam(teamId: string) {
    setExpandedTeamId(prev => (prev === teamId ? null : teamId));
  }

  return (
    <div className="space-y-6">
      {/* Success toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl text-sm font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {toastMsg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Takım Yönetimi</h1>
          <p className="text-slate-500">{selectedTournament?.name}</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <UserPlus className="w-4 h-4 mr-2" /> Takım Ekle
        </Button>
      </div>

      {/* Add team form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yeni Takım Ekle</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTeam} className="space-y-4">
              {addError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  {addError}
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Takım Adı</label>
                <Input value={newTeamName} onChange={e => { setNewTeamName(toTurkishUpper(e.target.value)); setAddError(null); }} placeholder="Takım adı" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Takım Sorumlusu</label>
                <Input value={newManagerName} onChange={e => setNewManagerName(toTurkishUpper(e.target.value))} placeholder="Sorumlu adı soyadı" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Takım Logosu
                </label>
                <div className="flex items-center gap-3">
                  {newLogoBase64
                    ? <img src={newLogoBase64} className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0" />
                    : <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><User className="w-5 h-5 text-slate-300" /></div>
                  }
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-sm text-slate-600">
                      <ImageIcon className="w-4 h-4" />
                      {newLogoBase64 ? 'Değiştir' : 'Galeriden / Dosyadan Seç'}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
                  {newLogoBase64 && (
                    <button type="button" onClick={() => setNewLogoBase64('')} className="p-1 text-slate-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-400" /> Forma Rengi
                </label>
                <div className="flex items-center gap-3">
                  <input type="color" value={newJerseyColor} onChange={e => setNewJerseyColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white" />
                  <div className="w-7 h-7 rounded-full border border-slate-200 shrink-0" style={{ backgroundColor: newJerseyColor }} />
                  <span className="text-sm text-slate-500 font-mono">{newJerseyColor}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? 'Lütfen Bekleyin...' : 'Ekle'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="flex-1" disabled={submitting}>İptal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit player modal */}
      {editingPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setEditingPlayer(null); }}
        >
          <div className="w-full max-w-lg my-8 bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Oyuncu Düzenle</h2>
                  <p className="text-xs text-slate-500 truncate max-w-[200px]">{editingPlayer.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingPlayer(null)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 block mb-1">
                    Ad Soyad <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editName}
                    onChange={e => setEditName(toTurkishUpper(e.target.value))}
                    placeholder="Ad Soyad"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Forma Numarası</label>
                  <Input
                    type="number"
                    value={editJerseyNumber}
                    onChange={e => setEditJerseyNumber(e.target.value)}
                    placeholder="No"
                    min={0}
                    max={99}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Mevki</label>
                  <select
                    value={editPosition}
                    onChange={e => setEditPosition(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Mevki seçin</option>
                    {POSITIONS.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 block mb-1">Takım</label>
                  <select
                    value={editTeamId}
                    onChange={e => setEditTeamId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {teams.filter(t => t.status === 'approved').map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Hastane</label>
                  <Input value={editHospital} onChange={e => setEditHospital(e.target.value)} placeholder="Hastane adı" />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Birim / Bölüm</label>
                  <Input value={editDepartment} onChange={e => setEditDepartment(e.target.value)} placeholder="Birim" />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Telefon</label>
                  <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="05XX XXX XX XX" type="tel" />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">TC Kimlik No</label>
                  <Input
                    value={editTcNo}
                    onChange={e => setEditTcNo(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="11 haneli TC No"
                    maxLength={11}
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={editSubmitting}>
                  {editSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingPlayer(null)} className="flex-1" disabled={editSubmitting}>
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="table-responsive-container select-none scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-sm whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-medium text-slate-500 w-8"></th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Takım</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Sorumlu</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-500">Oyuncu</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-500">Durum</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => {
                  const teamPlayers = players.filter(p => p.team_id === team.id);
                  const isExpanded = expandedTeamId === team.id;
                  const jerseyColor = team.jersey_color || '#16a34a';

                  return (
                    <>
                      <tr
                        key={team.id}
                        className={cn(
                          'border-b border-slate-100 transition-colors',
                          isExpanded ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                        )}
                        style={{ boxShadow: `inset 4px 0 0 ${jerseyColor}` }}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleTeam(team.id)}
                            className="p-1 rounded hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-700"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <TeamAvatar name={team.name} logoUrl={team.logo_url} color={jerseyColor} />
                            <span className="font-semibold text-slate-900">{team.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{team.manager_name || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleTeam(team.id)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors',
                              isExpanded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            )}
                          >
                            <Users className="w-3 h-3" />
                            {teamPlayers.length} oyuncu
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {team.status === 'approved' && <Badge variant="success">Onaylı</Badge>}
                          {team.status === 'pending' && <Badge variant="warning">Beklemede</Badge>}
                          {team.status === 'rejected' && <Badge variant="danger">Reddedildi</Badge>}
                        </td>
                        <td className="px-4 py-3 text-right action-buttons-cell">
                          <div className="flex items-center justify-end gap-2">
                            {team.status === 'pending' && (
                              <>
                                <button onClick={() => handleApproveTeam(team.id)} disabled={approvingId === team.id} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-40" title="Onayla">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => rejectTeam(team.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Reddet">
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                if (confirm('Bu takımı silmek istediğinize emin misiniz?')) {
                                  deleteTeam(team.id);
                                  if (expandedTeamId === team.id) setExpandedTeamId(null);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Takımı Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${team.id}-roster`}>
                          <td colSpan={6} className="px-0 pb-0 pt-0">
                            <div className="mx-4 mb-4 mt-1 rounded-xl border border-emerald-100 bg-white shadow-sm overflow-x-auto">
                              {teamPlayers.length > 0 ? (
                                <table className="w-full text-sm min-w-[500px]">
                                  <thead>
                                    <tr className="bg-emerald-50 border-b border-emerald-100">
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Oyuncu</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider">Mevki</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider hidden sm:table-cell">Telefon</th>
                                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-emerald-700 uppercase tracking-wider hidden md:table-cell">Hastane / Birim</th>
                                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-emerald-700 uppercase tracking-wider"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {teamPlayers.map((player, idx) => (
                                      <tr key={player.id} className={cn('transition-colors hover:bg-slate-50', idx < teamPlayers.length - 1 ? 'border-b border-slate-100' : '')}>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                              {player.photo_url ? <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-slate-300" />}
                                            </div>
                                            <div>
                                              <div className="font-semibold text-slate-900">{player.name}</div>
                                              {player.jersey_number != null && <div className="text-xs text-slate-400">#{player.jersey_number}</div>}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          {player.position ? (
                                            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold', POSITION_COLORS[player.position] ?? 'bg-slate-100 text-slate-600')}>
                                              {POSITION_ABBR[player.position] ?? player.position}
                                            </span>
                                          ) : <span className="text-slate-300">-</span>}
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                          {player.phone ? (
                                            <span className="flex items-center gap-1.5 text-slate-600">
                                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />{player.phone}
                                            </span>
                                          ) : <span className="text-slate-300">-</span>}
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                          {player.hospital || player.department ? (
                                            <div className="text-slate-600 text-xs leading-tight">
                                              {player.hospital && <div>{player.hospital}</div>}
                                              {player.department && <div className="text-slate-400">{player.department}</div>}
                                            </div>
                                          ) : <span className="text-slate-300">-</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right action-buttons-cell">
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              onClick={() => openEdit(player)}
                                              className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                                              title="Oyuncuyu Düzenle"
                                            >
                                              <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (confirm(`${player.name} isimli oyuncuyu bu takımdan tamamen silmek istediğinize emin misiniz?`)) {
                                                  deletePlayer(player.id);
                                                }
                                              }}
                                              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                              title="Oyuncuyu Sil"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div className="py-8 text-center text-slate-400">
                                  <Users className="w-6 h-6 mx-auto mb-2 opacity-40" />
                                  <p className="text-sm">Bu takımda henüz oyuncu bulunmuyor.</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                {teams.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Henüz takım bulunmuyor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
