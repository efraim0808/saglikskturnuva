import { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Shield, Users, X, Trash2, Edit2, Save, Crown, Eye, Activity,
  ClipboardList, UserCheck, UserX, Clock, KeyRound, CheckCircle2,
} from 'lucide-react';
import { cn, validatePassword } from '../lib/utils';
import type { UserRole, SystemUser } from '../types';

interface ChangePasswordModalProps {
  user: SystemUser;
  onClose: () => void;
  onSave: (userId: string, newPassword: string) => Promise<{ error: string | null }>;
}

function ChangePasswordModal({ user, onClose, onSave }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    const result = await onSave(user.id, newPassword);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(onClose, 1500);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-900">Şifre Değiştir</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-slate-500 mb-5">
            <span className="font-medium text-slate-700">{user.email}</span> kullanıcısı için yeni şifre belirleyin.
          </p>
          {success ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Şifre başarıyla güncellendi!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Yeni Şifre</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="En az 6 karakter, büyük/küçük harf ve rakam"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Şifre Tekrar</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Şifreyi tekrar girin"
                  required
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{error}</div>
              )}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
                  İptal
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  <KeyRound className="w-4 h-4 mr-2" />
                  {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

interface ResetPasswordModalProps {
  email: string;
  requestId: string;
  userId: string;
  onClose: () => void;
  onSave: (userId: string, newPassword: string) => Promise<{ error: string | null }>;
  onResolve: (requestId: string) => Promise<void>;
}

function generateDefaultPassword(): string {
  return 'Saglik41';
}

function ResetPasswordModal({ email, requestId, userId, onClose, onSave, onResolve }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState(generateDefaultPassword());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    setLoading(true);
    const result = await onSave(userId, newPassword);
    if (result.error) {
      setLoading(false);
      setError(result.error);
      return;
    }
    await onResolve(requestId);
    setLoading(false);
    setSuccessMsg(`Şifre başarıyla '${newPassword}' olarak güncellendi ve talep kapatıldı!`);
    setTimeout(onClose, 2200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="font-semibold text-slate-900">Şifre Sıfırlama ve Güncelleme</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">
          {successMsg ? (
            <div className="flex items-start gap-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Kullanıcı E-postası</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200">
                  <span className="text-slate-400 text-sm">{email}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Yeni Şifre</label>
                <Input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Yeni şifre"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  autoFocus
                />
                <p className="text-xs text-slate-400">Otomatik dolduruldu, düzenleyebilirsiniz.</p>
              </div>
              {error && (
                <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{error}</div>
              )}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
                  İptal
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  <KeyRound className="w-4 h-4 mr-2" />
                  {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle ve Talebi Kapat'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminUsers() {
  const {
    systemUsers, teams, teamApplications, isSuperAdmin,
    updateUserRole, deleteSystemUser, approveUser, rejectUser,
    approveApplication, rejectApplication, refreshUsers,
    changeUserPassword, passwordResetRequests, refreshPasswordResetRequests, resolvePasswordResetRequest, deletePasswordResetRequest,
  } = useApp();

  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editTeamId, setEditTeamId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'pending' | 'applications' | 'resets'>('users');
  const [pendingRoles, setPendingRoles] = useState<Record<string, UserRole>>({});
  const [changePwUser, setChangePwUser] = useState<SystemUser | null>(null);
  const [resetTarget, setResetTarget] = useState<{ email: string; requestId: string; userId: string } | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    refreshUsers();
    refreshPasswordResetRequests();
  }, []);

  const approvedUsers = systemUsers.filter(u => u.status === 'approved');
  const pendingUsers = systemUsers.filter(u => u.status === 'pending');
  const pendingApplications = teamApplications.filter(a => a.status === 'pending');
  const pendingResets = passwordResetRequests.filter(r => r.status === 'pending');

  const filteredUsers = approvedUsers.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.role && u.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  function getRoleBadge(role: UserRole | null) {
    switch (role) {
      case 'super_admin': return <Badge variant="danger">Süper Admin</Badge>;
      case 'scorekeeper': return <Badge variant="info">Skor Girişçisi</Badge>;
      case 'team_manager': return <Badge variant="warning">Takım Sorumlusu</Badge>;
      case 'user': return <Badge variant="default">Kullanıcı</Badge>;
      default: return <Badge variant="default">Onaysız</Badge>;
    }
  }

  function getRoleIcon(role: UserRole | null) {
    switch (role) {
      case 'super_admin': return <Crown className="w-4 h-4 text-red-500" />;
      case 'scorekeeper': return <Activity className="w-4 h-4 text-sky-500" />;
      case 'team_manager': return <Users className="w-4 h-4 text-amber-500" />;
      default: return <Eye className="w-4 h-4 text-slate-400" />;
    }
  }

  async function handleSaveRole(userId: string) {
    await updateUserRole(userId, editRole, editTeamId || null);
    setEditingUser(null);
  }

  function startEdit(user: SystemUser) {
    setEditingUser(user.id);
    setEditRole(user.role || 'user');
    setEditTeamId(user.team_id || '');
  }

  async function handleDelete(userId: string, email: string) {
    if (!confirm(`"${email}" kullanıcısını silmek istediğinize emin misiniz?`)) return;
    await deleteSystemUser(userId);
  }

  async function handleApproveUser(userId: string) {
    if (actingId) return;
    setActingId(userId);
    const role = pendingRoles[userId] || 'user';
    try { await approveUser(userId, role); } finally { setActingId(null); }
  }

  async function handleRejectUser(userId: string) {
    if (actingId) return;
    setActingId(userId);
    try { await rejectUser(userId); } finally { setActingId(null); }
  }

  async function handleApproveApp(appId: string) {
    if (actingId) return;
    setActingId(appId);
    try { await approveApplication(appId); } finally { setActingId(null); }
  }

  async function handleRejectApp(appId: string) {
    if (actingId) return;
    setActingId(appId);
    try { await rejectApplication(appId); } finally { setActingId(null); }
  }

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

  return (
    <div className="space-y-6">
      {changePwUser && (
        <ChangePasswordModal
          user={changePwUser}
          onClose={() => setChangePwUser(null)}
          onSave={changeUserPassword}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          email={resetTarget.email}
          requestId={resetTarget.requestId}
          userId={resetTarget.userId}
          onClose={() => setResetTarget(null)}
          onSave={changeUserPassword}
          onResolve={resolvePasswordResetRequest}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kullanıcı Yönetimi / Başvurular</h1>
          <p className="text-slate-500">Sistemdeki tüm kullanıcıları ve takım başvurularını yönetin</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
            activeTab === 'users' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          <Users className="w-4 h-4" />
          Kullanıcılar ({approvedUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
            activeTab === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          <Clock className="w-4 h-4" />
          Onay Bekleyenler
          {pendingUsers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{pendingUsers.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
            activeTab === 'applications' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          <ClipboardList className="w-4 h-4" />
          Takım Başvuruları
          {pendingApplications.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{pendingApplications.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('resets')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
            activeTab === 'resets' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          <KeyRound className="w-4 h-4" />
          Şifre Sıfırlama Talepleri
          {pendingResets.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{pendingResets.length}</span>
          )}
        </button>
      </div>

      {/* --- APPROVED USERS TAB --- */}
      {activeTab === 'users' && (
        <>
          <Card>
            <CardContent className="p-4">
              <Input
                placeholder="E-posta veya rol ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full sm:w-80"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto select-none whitespace-nowrap scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
                <table className="w-full text-sm whitespace-nowrap min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left font-medium text-slate-500">E-posta</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Rol</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Takım</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">Kayıt Tarihi</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-500">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            <span className="font-medium text-slate-900">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {editingUser === user.id ? (
                            <Select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}>
                              <option value="super_admin">Süper Admin</option>
                              <option value="scorekeeper">Skor Girişçisi</option>
                              <option value="team_manager">Takım Sorumlusu</option>
                              <option value="user">Kullanıcı</option>
                            </Select>
                          ) : (
                            getRoleBadge(user.role)
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingUser === user.id && editRole === 'team_manager' ? (
                            <Select value={editTeamId} onChange={e => setEditTeamId(e.target.value)}>
                              <option value="">Takım seçin...</option>
                              {teams.filter(t => t.status === 'approved').map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </Select>
                          ) : (
                            <span className="text-slate-600">
                              {user.team_id ? teams.find(t => t.id === user.team_id)?.name || '-' : '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(user.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingUser === user.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleSaveRole(user.id)}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                title="Kaydet"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                                title="İptal"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setChangePwUser(user)}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                                title="Şifre Değiştir"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => startEdit(user)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                title="Rol Düzenle"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(user.id, user.email)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          Kullanıcı bulunamadı
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-slate-900">{approvedUsers.length}</div>
                <div className="text-sm text-slate-500">Onaylı Kullanıcı</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{approvedUsers.filter(u => u.role === 'super_admin').length}</div>
                <div className="text-sm text-slate-500">Süper Admin</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-sky-600">{approvedUsers.filter(u => u.role === 'scorekeeper').length}</div>
                <div className="text-sm text-slate-500">Skor Girişçisi</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-amber-600">{approvedUsers.filter(u => u.role === 'team_manager').length}</div>
                <div className="text-sm text-slate-500">Takım Sorumlusu</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* --- PENDING USERS TAB --- */}
      {activeTab === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Onay Bekleyen Kullanıcılar ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto select-none whitespace-nowrap scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-500">E-posta</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Kayıt Tarihi</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Atanacak Rol</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-500">Durum</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(user => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span className="font-medium text-slate-900">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 w-44">
                        <Select
                          value={pendingRoles[user.id] ?? 'user'}
                          onChange={e => setPendingRoles(prev => ({ ...prev, [user.id]: e.target.value as UserRole }))}
                        >
                          <option value="user">Kullanıcı</option>
                          <option value="scorekeeper">Skor Girişçisi</option>
                          <option value="team_manager">Takım Sorumlusu</option>
                          <option value="super_admin">Süper Admin</option>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                          <Clock className="w-3 h-3" /> Onay Bekliyor
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            disabled={actingId === user.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> {actingId === user.id ? 'Bekleyin...' : 'Onayla'}
                          </button>
                          <button
                            onClick={() => handleRejectUser(user.id)}
                            disabled={actingId === user.id}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                            title="Reddet"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                        <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Onay bekleyen kullanıcı yok
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- APPLICATIONS TAB --- */}
      {activeTab === 'applications' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Takım Başvuruları ({pendingApplications.length} bekleyen)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto select-none whitespace-nowrap scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Kullanıcı</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Takım Adı</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Turnuva</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Tarih</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-500">Durum</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {teamApplications.map(app => (
                    <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{app.user_email || app.user_id}</td>
                      <td className="px-4 py-3 text-slate-600">{app.team_name}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs font-mono truncate max-w-[120px]">
                        {app.tournament_id}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(app.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {app.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                            Beklemede
                          </span>
                        )}
                        {app.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                            Onaylandı
                          </span>
                        )}
                        {app.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                            Reddedildi
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {app.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveApp(app.id)}
                              disabled={actingId === app.id}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                              title="Onayla"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectApp(app.id)}
                              disabled={actingId === app.id}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                              title="Reddet"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {teamApplications.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Henüz başvuru bulunmuyor
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- PASSWORD RESET REQUESTS TAB --- */}
      {activeTab === 'resets' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-rose-500" />
              Şifre Sıfırlama Talepleri ({pendingResets.length} bekleyen)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto select-none whitespace-nowrap scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-500">E-posta</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Talep Tarihi</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-500">Durum</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {passwordResetRequests.map(req => {
                    const matchedUser = systemUsers.find(u => u.email.toLowerCase() === req.email.toLowerCase());
                    return (
                      <tr key={req.id} className="border-b border-slate-100 hover:bg-rose-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-rose-400" />
                            <span className="font-medium text-slate-900">{req.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(req.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {req.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-medium">
                              <Clock className="w-3 h-3" /> Beklemede
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Çözüldü
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {req.status === 'pending' && (
                            <div className="flex items-center justify-end gap-2">
                              {matchedUser ? (
                                <button
                                  onClick={() => setResetTarget({ email: req.email, requestId: req.id, userId: matchedUser.id })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 active:scale-95 transition-all"
                                >
                                  <KeyRound className="w-3.5 h-3.5" /> Şifreyi Güncelle/Çöz
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Kullanıcı eşleşmedi</span>
                              )}
                              <button
                                onClick={() => deletePasswordResetRequest(req.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 active:scale-95 transition-all"
                                title="Talebi Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Sil
                              </button>
                            </div>
                          )}
                          {req.status === 'resolved' && (
                            <button
                              onClick={() => deletePasswordResetRequest(req.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 active:scale-95 transition-all"
                              title="Talebi Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Sil
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {passwordResetRequests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                        <KeyRound className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Şifre sıfırlama talebi bulunmuyor
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
