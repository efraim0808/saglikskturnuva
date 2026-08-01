import { useState } from 'react';
import { useApp } from '../AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Trophy, Archive, RotateCcw, Trash2, Plus, Shield, Settings, FileText, X, BookOpen, CheckCircle2, AlertTriangle } from 'lucide-react';

export function AdminTournaments() {
  const { tournaments, isSuperAdmin, selectedTournament, addTournament, archiveTournament, activateTournament, deleteTournament, setSelectedTournament, updateTournamentRules } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSeason, setNewSeason] = useState('');
  const [winPoints, setWinPoints] = useState(3);
  const [drawPoints, setDrawPoints] = useState(1);
  const [lossPoints, setLossPoints] = useState(-1);
  const [rulesText, setRulesText] = useState('');
  const [viewingRules, setViewingRules] = useState<{ name: string; season: string; rules: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingRules, setEditingRules] = useState<{ id: string; name: string; season: string; rules: string } | null>(null);
  const [editRulesText, setEditRulesText] = useState('');
  const [rulesSubmitting, setRulesSubmitting] = useState(false);
  const [rulesToast, setRulesToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  async function handleSaveRules() {
    if (!editingRules || rulesSubmitting) return;
    setRulesSubmitting(true);
    try {
      const ok = await updateTournamentRules(editingRules.id, editRulesText);
      if (ok) {
        setRulesToast({ type: 'success', msg: 'Turnuva kuralları başarıyla güncellendi!' });
      } else {
        setRulesToast({ type: 'error', msg: 'Veritabanı bağlantısı kurulamadı, kurallar yerel olarak yedeklendi.' });
      }
      setTimeout(() => setRulesToast(null), 4000);
      setEditingRules(null);
    } finally {
      setRulesSubmitting(false);
    }
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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newSeason.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addTournament(newName, newSeason, winPoints, drawPoints, lossPoints, rulesText);
      setNewName('');
      setNewSeason('');
      setWinPoints(3);
      setDrawPoints(1);
      setLossPoints(-1);
      setRulesText('');
      setShowAddForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Turnuva Yönetimi</h1>
          <p className="text-slate-500">Tüm turnuvaları yönetin</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" /> Turnuva Ekle
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yeni Turnuva Ekle</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Turnuva Adı</label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Örn: Kocaeli Şehir Hastanesi Güz Ligi 2026" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Sezon</label>
                <Input value={newSeason} onChange={e => setNewSeason(e.target.value)} placeholder="Örn: 2025-2026" required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Galibiyet Puanı</label>
                  <Input type="number" value={winPoints} onChange={e => setWinPoints(parseInt(e.target.value) || 0)} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Beraberlik Puanı</label>
                  <Input type="number" value={drawPoints} onChange={e => setDrawPoints(parseInt(e.target.value) || 0)} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Mağlubiyet Puanı</label>
                  <Input type="number" value={lossPoints} onChange={e => setLossPoints(parseInt(e.target.value) || 0)} required />
                  <p className="text-xs text-slate-400 mt-1">Negatif değer alabilir</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Turnuva Özel Kuralları</label>
                <textarea
                  value={rulesText}
                  onChange={e => setRulesText(e.target.value)}
                  placeholder="Turnuvaya özel kuralları buraya yazın..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Lütfen Bekleyin...' : 'Ekle'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">İptal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tournaments.map(t => (
          <Card key={t.id} className={selectedTournament?.id === t.id ? 'ring-2 ring-emerald-500' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-sm text-slate-500">{t.season}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {t.status === 'active' ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : (
                        <Badge variant="warning">Arşivlenmiş</Badge>
                      )}
                      <span className="text-xs text-slate-400">
                        G:{t.win_points} B:{t.draw_points} M:{t.loss_points}
                      </span>
                    </div>
                    {t.rules_text && (
                      <button
                        onClick={() => setViewingRules({ name: t.name, season: t.season, rules: t.rules_text })}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium hover:underline"
                      >
                        <FileText className="w-3 h-3" />
                        Kurallar ({t.rules_text.length} karakter)
                        <span className="text-emerald-600">· Tamamını Oku</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingRules({ id: t.id, name: t.name, season: t.season, rules: t.rules_text || '' });
                      setEditRulesText(t.rules_text || '');
                    }}
                    className="p-2 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-colors"
                    title="Kuralları Düzenle"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                  {t.status === 'active' ? (
                    <button
                      onClick={() => archiveTournament(t.id)}
                      className="p-2 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition-colors"
                      title="Arşivle"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => activateTournament(t.id)}
                      className="p-2 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-colors"
                      title="Aktifleştir"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Bu turnuvayı silmek istediğinize emin misiniz?')) {
                        deleteTournament(t.id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {tournaments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Henüz turnuva bulunmuyor
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rules Viewer Modal */}
      {viewingRules && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={() => setViewingRules(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 sm:my-8 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-emerald-50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 leading-tight truncate">Turnuva Kuralları</h2>
                  <p className="text-xs text-slate-500 truncate">{viewingRules.name} · {viewingRules.season}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingRules(null)}
                className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 sm:px-6 py-5 max-h-[60vh] overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                {viewingRules.rules.split(/\n+/).map((para, idx) => (
                  para.trim()
                    ? <p key={idx} className="text-sm text-slate-700 leading-relaxed mb-3 whitespace-pre-wrap">{para}</p>
                    : null
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules Editor Modal */}
      {editingRules && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={() => setEditingRules(null)}
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
                  <h2 className="font-bold text-slate-900 leading-tight truncate">Kuralları Düzenle</h2>
                  <p className="text-xs text-slate-500 truncate">{editingRules.name} · {editingRules.season}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRules(null)}
                className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Turnuva Kuralları</label>
              <textarea
                rows={10}
                value={editRulesText}
                onChange={e => setEditRulesText(e.target.value)}
                placeholder="Turnuva kurallarını buraya yazın... (Madde madde veya paragraf halinde)"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-y text-sm text-slate-700 leading-relaxed"
              />
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-slate-400">İpucu: Kuralları maddeler halinde yazabilir, boş satırlarla paragrafları ayırabilirsiniz.</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingRules(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSaveRules}
                    disabled={rulesSubmitting}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    {rulesSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Kuralları Kaydet
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules Toast */}
      {rulesToast && (
        <div className={`fixed bottom-6 right-6 z-[70] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-in slide-in-from-bottom-4 ${
          rulesToast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
        }`}>
          {rulesToast.type === 'success'
            ? <CheckCircle2 className="w-4 h-4" />
            : <AlertTriangle className="w-4 h-4" />}
          {rulesToast.msg}
        </div>
      )}
    </div>
  );
}
