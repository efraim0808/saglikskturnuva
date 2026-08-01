import { useState } from 'react';
import { useApp } from '../AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  ClipboardList, Send, CheckCircle, Clock, AlertCircle, Trophy, Phone, Building2, ImageIcon, Palette, User, X,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function TournamentApplication() {
  const { user, userRole, tournaments, selectedTournament, teamApplications, applyForTeam } = useApp();

  const [teamName, setTeamName] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [logoBase64, setLogoBase64] = useState('');
  const [jerseyColor, setJerseyColor] = useState('#16a34a');
  const [tournamentId, setTournamentId] = useState(selectedTournament?.id || '');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeTournaments = tournaments.filter(t => t.status === 'active');
  const myApplications = user ? teamApplications.filter(a => a.user_id === user.id) : [];
  const alreadyApplied = myApplications.some(
    a => a.tournament_id === (tournamentId || selectedTournament?.id) && a.status === 'pending'
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tid = tournamentId || selectedTournament?.id;
    if (!tid || !teamName.trim()) return;
    setLoading(true);
    try {
      await applyForTeam(tid, teamName.trim(), department.trim(), phone.trim(), logoBase64 || null, jerseyColor);
      setSubmitted(true);
      setTeamName('');
      setDepartment('');
      setPhone('');
      setLogoBase64('');
      setJerseyColor('#16a34a');
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Başvuru yapmak için giriş yapmalısınız.
        </CardContent>
      </Card>
    );
  }

  if (userRole !== 'team_manager' && userRole !== 'user') {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Bu sayfaya erişim yetkiniz yok.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-emerald-600" />
          Turnuva Başvurusu
        </h1>
        <p className="text-slate-500 mt-1">Takımınızı bir turnuvaya kaydedin, admin onayıyla aktif olur.</p>
      </div>

      {/* Success banner */}
      {submitted && (
        <div className="flex items-start gap-4 p-5 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle className="w-7 h-7 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-800">Turnuva başvurunuz başarıyla alındı, admin onayı bekleniyor.</p>
            <p className="text-sm text-emerald-600 mt-0.5">Onaylandığında takımınız aktif listeye eklenecektir.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-3 text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
            >
              Yeni başvuru yap
            </button>
          </div>
        </div>
      )}

      {/* Application form */}
      {!submitted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              Başvuru Formu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tournament selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Turnuva <span className="text-red-500">*</span>
                </label>
                <Select
                  value={tournamentId}
                  onChange={e => setTournamentId(e.target.value)}
                  required
                >
                  <option value="">Turnuva seçin...</option>
                  {activeTournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name} — {t.season}</option>
                  ))}
                </Select>
              </div>

              {/* Team name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Takım Adı <span className="text-red-500">*</span>
                </label>
                <Input
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  placeholder="Örn: Acil Servis FC"
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Kurum / Hastane Birimi
                </label>
                <Input
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="Örn: Kardiyoloji Bölümü"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Sorumlu Telefon No
                </label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  type="tel"
                />
              </div>

              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  Takım Logosu <span className="text-slate-400 font-normal text-xs">(isteğe bağlı)</span>
                </label>
                <div className="flex items-center gap-3">
                  {logoBase64
                    ? <img src={logoBase64} className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0" />
                    : <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><User className="w-5 h-5 text-slate-300" /></div>
                  }
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-sm text-slate-600">
                      <ImageIcon className="w-4 h-4" />
                      {logoBase64 ? 'Logoyu Değiştir' : 'Galeriden / Dosyadan Seç'}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setLogoBase64(reader.result as string);
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                  {logoBase64 && (
                    <button type="button" onClick={() => setLogoBase64('')} className="p-1 text-slate-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Jersey color */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  Forma Rengi
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={jerseyColor}
                    onChange={e => setJerseyColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white"
                  />
                  <div className="w-7 h-7 rounded-full border border-slate-200" style={{ backgroundColor: jerseyColor }} />
                  <span className="text-sm text-slate-500 font-mono">{jerseyColor}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={alreadyApplied || loading || !tournamentId || !teamName.trim()}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all',
                  alreadyApplied || loading || !tournamentId || !teamName.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-sm hover:shadow-md'
                )}
              >
                <Send className="w-4 h-4" />
                {loading
                  ? 'Gönderiliyor...'
                  : alreadyApplied
                  ? 'Bu turnuvaya zaten başvurdunuz'
                  : 'Başvuruyu Tamamla'}
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* My Applications history */}
      {myApplications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Başvurularım
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto select-none whitespace-nowrap scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Turnuva</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Takım</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-500">Durum</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {myApplications.map(app => {
                    const tournament = tournaments.find(t => t.id === app.tournament_id);
                    return (
                      <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{tournament?.name || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{app.team_name}</td>
                        <td className="px-4 py-3 text-center">
                          {app.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                              <Clock className="w-3 h-3" /> Beklemede
                            </span>
                          )}
                          {app.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                              <CheckCircle className="w-3 h-3" /> Onaylandı
                            </span>
                          )}
                          {app.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                              <AlertCircle className="w-3 h-3" /> Reddedildi
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(app.created_at).toLocaleDateString('tr-TR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
