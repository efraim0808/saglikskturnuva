import { useState, useRef } from 'react';
import { useApp } from '../AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Shield, Users, Plus, Edit2, Save, X, Trash2, Building2, Stethoscope, Phone, AlertTriangle, Camera, User, Calendar, Clock, MapPin, ClipboardList, Star, CreditCard, Eye, EyeOff, Lock } from 'lucide-react';
import { compressImage, toTurkishUpper, cn, formatMatchDate } from '../lib/utils';
import type { LineupStatus } from '../types';

async function compressAvatar(file: File): Promise<string> {
  return compressImage(file, 400, 0.8);
}

function AvatarPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressAvatar(file);
    onChange(compressed);
    e.target.value = '';
  }

  return (
    <div className="relative group w-20 h-20 shrink-0">
      <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
        {value ? (
          <img src={value} alt="Profil" className="w-full h-full object-cover" />
        ) : (
          <User className="w-8 h-8 text-slate-300" />
        )}
      </div>
      {/* Overlay */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center"
        title="Fotoğraf yükle"
      >
        <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
          title="Kaldır"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

export function TeamPlayers() {
  const { userRole, managedTeamId, teams, players, isTeamManager, isSuperAdmin, isScorekeeper, addPlayer, updatePlayer, deletePlayer, suspensions, fixtures, selectedTournament, getLineupForFixture, setLineupStatus } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newJersey, setNewJersey] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newHospital, setNewHospital] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTcNo, setNewTcNo] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editJersey, setEditJersey] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editHospital, setEditHospital] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTcNo, setEditTcNo] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [lineupFixtureId, setLineupFixtureId] = useState<string | null>(null);
  const [lineupWarning, setLineupWarning] = useState<string | null>(null);
  const [revealedTcIds, setRevealedTcIds] = useState<Set<string>>(new Set());

  const myTeam = teams.find(t => t.id === managedTeamId);
  const teamPlayers = myTeam ? players.filter(p => p.team_id === myTeam.id) : [];

  const upcomingFixtures = myTeam
    ? fixtures
        .filter(f => (f.home_team_id === myTeam.id || f.away_team_id === myTeam.id) && f.status === 'scheduled')
        .sort((a, b) => (a.match_date || '9999') .localeCompare(b.match_date || '9999'))
        .slice(0, 2)
    : [];

  const lineupFixture = fixtures.find(f => f.id === lineupFixtureId);
  const currentLineup = lineupFixtureId && myTeam ? getLineupForFixture(lineupFixtureId, myTeam.id) : [];
  const selectedCount = currentLineup.filter(l => l.status === 'starter' || l.status === 'substitute').length;
  const MAX_LINEUP = 12;

  const isPlayerSuspended = (playerId: string) =>
    suspensions.some(s => s.player_id === playerId && s.matches_remaining > 0);

  const getPlayerStatus = (playerId: string): LineupStatus =>
    currentLineup.find(l => l.player_id === playerId)?.status ?? 'unavailable';

  const canManage = isTeamManager && myTeam;
  const canDelete = isSuperAdmin || isScorekeeper;

  const isCaptainLocked = userRole === 'team_manager';
  const canViewTc = isSuperAdmin || isScorekeeper || (isTeamManager && !!myTeam);

  function maskTc(tc: string | null): string {
    if (!tc) return '-';
    if (tc.length !== 11) return tc;
    return tc.substring(0, 3) + '******' + tc.substring(9);
  }

  function toggleRevealTc(playerId: string) {
    setRevealedTcIds(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }

  if (userRole !== 'team_manager' && userRole !== 'super_admin' && userRole !== 'scorekeeper') {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-400">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Bu sayfaya erişim yetkiniz yok.
        </CardContent>
      </Card>
    );
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!myTeam || !newName.trim() || submitting) return;
    setSubmitting(true);
    setAddError(null);
    const error = await addPlayer(
      myTeam.id,
      newName,
      newJersey ? parseInt(newJersey) : null,
      newPosition || null,
      newHospital.trim() || null,
      newDepartment.trim() || null,
      newPhone.trim() || null,
      newPhoto,
      newTcNo,
    );
    setSubmitting(false);
    if (error) { setAddError(error); return; }
    setNewName(''); setNewJersey(''); setNewPosition('');
    setNewHospital(''); setNewDepartment(''); setNewPhone(''); setNewTcNo(''); setNewPhoto(null);
    setShowAddForm(false);
  }

  async function handleUpdate(id: string) {
    if (updatingId) return;
    setUpdatingId(id);
    setEditError(null);
    const updates: Record<string, unknown> = {
      jersey_number: editJersey ? parseInt(editJersey) : null,
      position: editPosition || null,
      hospital: editHospital.trim() || null,
      department: editDepartment.trim() || null,
      phone: editPhone.trim() || null,
      photo_url: editPhoto,
    };
    if (!isCaptainLocked) {
      updates.name = editName;
      updates.tc_no = editTcNo.trim() || null;
    }
    const error = await updatePlayer(id, updates);
    setUpdatingId(null);
    if (error) { setEditError(error); return; }
    setEditingPlayer(null);
  }

  function startEdit(player: typeof players[0]) {
    setEditingPlayer(player.id);
    setEditName(player.name);
    setEditJersey(player.jersey_number?.toString() || '');
    setEditPosition(player.position || '');
    setEditHospital(player.hospital || '');
    setEditDepartment(player.department || '');
    setEditPhone(player.phone || '');
    setEditTcNo(player.tc_no || '');
    setEditPhoto(player.photo_url || null);
    setEditError(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kadro Yönetimi</h1>
          <p className="text-slate-500">{myTeam?.name || 'Takımınız'}</p>
        </div>
        {canManage && (
          <Button onClick={() => { setShowAddForm(!showAddForm); setAddError(null); }}>
            <Plus className="w-4 h-4 mr-2" /> Oyuncu Ekle
          </Button>
        )}
      </div>

      {/* Upcoming Fixtures with Lineup Selection */}
      {canManage && upcomingFixtures.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingFixtures.map(fixture => {
            const isHome = fixture.home_team_id === myTeam!.id;
            const opponent = teams.find(t => t.id === (isHome ? fixture.away_team_id : fixture.home_team_id));
            const md = formatMatchDate(fixture.match_date);
            const lineup = getLineupForFixture(fixture.id, myTeam!.id);
            const starters = lineup.filter(l => l.status === 'starter').length;
            const subs = lineup.filter(l => l.status === 'substitute').length;
            return (
              <Card key={fixture.id} className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                          {fixture.week}. Hafta
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          {isHome ? 'Ev Sahibi' : 'Deplasman'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {md.date} {md.time}
                      </div>
                      {fixture.venue && (
                        <div className="text-xs text-slate-400 flex items-center gap-1 justify-end mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {fixture.venue}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 py-3 bg-white rounded-xl border border-slate-100 mb-3">
                    <span className="text-sm font-semibold text-slate-700">{myTeam?.name}</span>
                    <span className="text-xs text-slate-400 font-bold">VS</span>
                    <span className="text-sm font-semibold text-slate-700">{opponent?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs">
                      {starters > 0 && (
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <Star className="w-3 h-3" /> {starters} As
                        </span>
                      )}
                      {subs > 0 && (
                        <span className="flex items-center gap-1 text-blue-700 font-medium">
                          <Users className="w-3 h-3" /> {subs} Yedek
                        </span>
                      )}
                      {starters === 0 && subs === 0 && (
                        <span className="text-slate-400">Kadro seçilmedi</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="!bg-emerald-600 hover:!bg-emerald-700"
                      onClick={() => setLineupFixtureId(fixture.id)}
                    >
                      <ClipboardList className="w-4 h-4 mr-1.5" />
                      Esame Listesi Seç
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showAddForm && canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yeni Oyuncu Ekle</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              {addError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  {addError}
                </div>
              )}

              {/* Photo + Name row */}
              <div className="flex items-start gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Profil Fotoğrafı</label>
                  <AvatarPicker value={newPhoto} onChange={setNewPhoto} />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 block mb-1">Ad Soyad</label>
                  <Input value={newName} onChange={e => { setNewName(toTurkishUpper(e.target.value)); setAddError(null); }} placeholder="Dr. Ahmet Yılmaz" required />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Forma Numarası</label>
                  <Input type="number" value={newJersey} onChange={e => setNewJersey(e.target.value)} placeholder="10" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Pozisyon</label>
                  <Select value={newPosition} onChange={e => setNewPosition(e.target.value)}>
                    <option value="">Seçin...</option>
                    <option value="Kaleci">Kaleci</option>
                    <option value="Defans">Defans</option>
                    <option value="Orta Saha">Orta Saha</option>
                    <option value="Forvet">Forvet</option>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />Çalıştığı Hastane
                  </label>
                  <Input value={newHospital} onChange={e => setNewHospital(e.target.value)} placeholder="Kocaeli Şehir Hastanesi" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-slate-400" />Birim
                  </label>
                  <Input value={newDepartment} onChange={e => setNewDepartment(e.target.value)} placeholder="Acil Servis" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />Telefon Numarası
                </label>
                <Input value={newPhone} onChange={e => { setNewPhone(e.target.value); setAddError(null); }} placeholder="05XX XXX XX XX" />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />TC Kimlik Numarası <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newTcNo}
                  onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 11); setNewTcNo(v); setAddError(null); }}
                  placeholder="11 haneli TC kimlik no"
                  required
                  inputMode="numeric"
                  maxLength={11}
                />
                <p className="text-xs text-slate-400 mt-1">Sadece rakam, tam 11 hane.</p>
              </div>

              {isCaptainLocked && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-xs">
                  <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Oyuncu adı ve telefon bilgisi sadece Turnuva Yönetimi (Admin) tarafından değiştirilebilir. Kayıt sonrası bu alanları düzenleyemezsiniz.
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Lütfen Bekleyin...' : 'Ekle'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); setAddError(null); }} className="flex-1" disabled={submitting}>İptal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto select-none whitespace-nowrap scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-sm whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">#</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Oyuncu</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Pozisyon</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Çalıştığı Hastane</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Birim</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Telefon</th>
                  {canViewTc && (
                    <th className="px-4 py-3 text-left font-medium text-slate-500">TC Kimlik</th>
                  )}
                  <th className="px-4 py-3 text-right font-medium text-slate-500"></th>
                </tr>
              </thead>
              <tbody>
                {teamPlayers.map(player => (
                  <>
                    <tr key={player.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500">{player.jersey_number || '-'}</td>

                      <td className="px-4 py-3">
                        {editingPlayer === player.id ? (
                          <div className="flex items-start gap-2">
                            <AvatarPicker value={editPhoto} onChange={setEditPhoto} />
                            <div className="flex-1 min-w-0">
                              <Input
                                value={editName}
                                onChange={e => { setEditName(toTurkishUpper(e.target.value)); setEditError(null); }}
                                className={isCaptainLocked ? 'opacity-60 bg-slate-50' : ''}
                                disabled={isCaptainLocked}
                                readOnly={isCaptainLocked}
                              />
                              {isCaptainLocked && (
                                <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 whitespace-normal">
                                  <Lock className="w-2.5 h-2.5 shrink-0" /> Bu alan sadece Turnuva Yönetimi tarafından değiştirilebilir.
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {player.photo_url
                                ? <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                                : <User className="w-4 h-4 text-slate-300" />
                              }
                            </div>
                            <span className="font-medium text-slate-900">{player.name}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {editingPlayer === player.id ? (
                          <Select value={editPosition} onChange={e => setEditPosition(e.target.value)}>
                            <option value="">Seçin...</option>
                            <option value="Kaleci">Kaleci</option>
                            <option value="Defans">Defans</option>
                            <option value="Orta Saha">Orta Saha</option>
                            <option value="Forvet">Forvet</option>
                          </Select>
                        ) : player.position || '-'}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {editingPlayer === player.id ? (
                          <Input value={editHospital} onChange={e => setEditHospital(e.target.value)} placeholder="Hastane..." />
                        ) : (
                          player.hospital
                            ? <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />{player.hospital}</span>
                            : '-'
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {editingPlayer === player.id ? (
                          <Input value={editDepartment} onChange={e => setEditDepartment(e.target.value)} placeholder="Birim..." />
                        ) : (
                          player.department
                            ? <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />{player.department}</span>
                            : '-'
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {editingPlayer === player.id ? (
                          <Input
                            value={editPhone}
                            onChange={e => { setEditPhone(e.target.value); setEditError(null); }}
                            placeholder="05XX..."
                          />
                        ) : (
                          player.phone
                            ? <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />{player.phone}</span>
                            : '-'
                        )}
                      </td>

                      {canViewTc && (
                        <td className="px-4 py-3 text-slate-600">
                          {editingPlayer === player.id ? (
                            <div className="flex flex-col gap-0.5">
                              <Input
                                value={editTcNo}
                                onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 11); setEditTcNo(v); setEditError(null); }}
                                placeholder="11 haneli TC"
                                inputMode="numeric"
                                maxLength={11}
                                disabled={isCaptainLocked}
                                readOnly={isCaptainLocked}
                                className={isCaptainLocked ? 'opacity-60 bg-slate-50' : ''}
                              />
                              {isCaptainLocked && (
                                <p className="flex items-center gap-1 text-[10px] text-slate-400 whitespace-normal">
                                  <Lock className="w-2.5 h-2.5 shrink-0" /> Bu alan sadece Turnuva Yönetimi tarafından değiştirilebilir.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-mono text-xs">
                                {revealedTcIds.has(player.id) ? player.tc_no : maskTc(player.tc_no)}
                              </span>
                              {player.tc_no && (
                                <button
                                  onClick={() => toggleRevealTc(player.id)}
                                  className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                  title={revealedTcIds.has(player.id) ? 'Gizle' : 'Göster'}
                                >
                                  {revealedTcIds.has(player.id)
                                    ? <EyeOff className="w-3.5 h-3.5" />
                                    : <Eye className="w-3.5 h-3.5" />
                                  }
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}

                      <td className="px-4 py-3 text-right">
                        {editingPlayer === player.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleUpdate(player.id)} disabled={updatingId === player.id} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-40">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingPlayer(null); setEditError(null); }} className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {canManage && (
                              <button onClick={() => startEdit(player)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => { if (confirm('Bu oyuncuyu silmek istediğinize emin misiniz?')) deletePlayer(player.id); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                    {editingPlayer === player.id && editError && (
                      <tr key={`${player.id}-error`}>
                        <td colSpan={canViewTc ? 8 : 7} className="px-4 pb-3">
                          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            {editError}
                          </div>
                        </td>
                      </tr>
                    )}
                    {editingPlayer === player.id && isCaptainLocked && (
                      <tr key={`${player.id}-lock`}>
                        <td colSpan={canViewTc ? 8 : 7} className="px-4 pb-3">
                          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-sm">
                            <Lock className="w-4 h-4 mt-0.5 shrink-0 text-sky-500" />
                            <span>
                              Güvenlik gereği; <strong>oyuncu adı ve TC Kimlik numarası</strong> bilgileri yalnızca{' '}
                              <strong>Turnuva Yönetimi (Admin)</strong> tarafından değiştirilebilir.
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {teamPlayers.length === 0 && (
                  <tr>
                    <td colSpan={canViewTc ? 8 : 7} className="px-4 py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Henüz oyuncu bulunmuyor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lineup Selection Modal */}
      {lineupFixtureId && lineupFixture && myTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-600" />
                  Esame Listesi
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {lineupFixture.home_team?.name} vs {lineupFixture.away_team?.name}
                </p>
                <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${selectedCount >= MAX_LINEUP ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Users className="w-3 h-3" />
                  {selectedCount} / {MAX_LINEUP} oyuncu
                </div>
              </div>
              <button onClick={() => setLineupFixtureId(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              {lineupWarning && (
                <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-300 flex items-center gap-2 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{lineupWarning}</span>
                </div>
              )}
              {teamPlayers.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Bu takımda oyuncu bulunmuyor
                </div>
              ) : (
                <div className="space-y-2">
                  {teamPlayers.map(player => {
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
                                  setLineupStatus(lineupFixtureId, myTeam.id, player.id, s);
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

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLineupFixtureId(null)}>Kapat</Button>
              <Button className="!bg-emerald-600 hover:!bg-emerald-700" onClick={() => setLineupFixtureId(null)}>
                <Save className="w-4 h-4 mr-1.5" />
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
