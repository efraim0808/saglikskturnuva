import { useState } from 'react';
import { useApp } from '../AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Shield, AlertTriangle, Trash2, Gavel } from 'lucide-react';

export function AdminPenalties() {
  const { teams, standings, penalties, isSuperAdmin, selectedTournament, addPenaltyPoints, setForfeit, fixtures } = useApp();
  const [selectedTeam, setSelectedTeam] = useState('');
  const [penaltyPoints, setPenaltyPoints] = useState(-1);
  const [penaltyReason, setPenaltyReason] = useState('');
  const [selectedFixture, setSelectedFixture] = useState('');
  const [winnerTeam, setWinnerTeam] = useState('');
  const [activeTab, setActiveTab] = useState<'penalty' | 'forfeit'>('penalty');
  const [penaltySubmitting, setPenaltySubmitting] = useState(false);
  const [forfeitSubmitting, setForfeitSubmitting] = useState(false);

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

  async function handleAddPenalty(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeam || !penaltyReason || penaltySubmitting) return;
    setPenaltySubmitting(true);
    try {
      await addPenaltyPoints(selectedTeam, penaltyPoints, penaltyReason);
      setSelectedTeam('');
      setPenaltyPoints(-1);
      setPenaltyReason('');
    } finally {
      setPenaltySubmitting(false);
    }
  }

  async function handleForfeit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFixture || !winnerTeam || forfeitSubmitting) return;
    setForfeitSubmitting(true);
    try {
      await setForfeit(selectedFixture, winnerTeam);
      setSelectedFixture('');
      setWinnerTeam('');
    } finally {
      setForfeitSubmitting(false);
    }
  }

  const pendingFixtures = fixtures.filter(f => f.status === 'scheduled');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cezalar ve Hükmen Maçlar</h1>
        <p className="text-slate-500">{selectedTournament?.name}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('penalty')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'penalty' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Puan Cezası
        </button>
        <button
          onClick={() => setActiveTab('forfeit')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'forfeit' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Gavel className="w-4 h-4 inline mr-2" />
          Hükmen Maç
        </button>
      </div>

      {activeTab === 'penalty' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Puan Cezası Uygula</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPenalty} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Takım</label>
                <Select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} required>
                  <option value="">Seçin...</option>
                  {teams.filter(t => t.status === 'approved').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Puan</label>
                <Input type="number" value={penaltyPoints} onChange={e => setPenaltyPoints(parseInt(e.target.value) || 0)} required />
                <p className="text-xs text-slate-400 mt-1">Negatif değer puan siler (örn: -1, -3)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Sebep</label>
                <Input value={penaltyReason} onChange={e => setPenaltyReason(e.target.value)} placeholder="Ceza sebebi" required />
              </div>
              <Button type="submit" className="w-full" disabled={penaltySubmitting}>
                {penaltySubmitting ? 'Uygulanıyor...' : 'Ceza Uygula'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'forfeit' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hükmen Maç Sonucu</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForfeit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Maç</label>
                <Select value={selectedFixture} onChange={e => setSelectedFixture(e.target.value)} required>
                  <option value="">Seçin...</option>
                  {pendingFixtures.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.home_team?.name} vs {f.away_team?.name} (Hafta {f.week})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Kazanan Takım</label>
                <Select value={winnerTeam} onChange={e => setWinnerTeam(e.target.value)} required>
                  <option value="">Seçin...</option>
                  {selectedFixture && (() => {
                    const f = fixtures.find(fix => fix.id === selectedFixture);
                    if (!f) return null;
                    return (
                      <>
                        <option value={f.home_team_id}>{f.home_team?.name}</option>
                        <option value={f.away_team_id}>{f.away_team?.name}</option>
                      </>
                    );
                  })()}
                </Select>
              </div>
              <p className="text-sm text-slate-500">Kazanan takım 3-0 hükmen galip sayılacaktır.</p>
              <Button type="submit" variant="danger" className="w-full" disabled={forfeitSubmitting}>
                {forfeitSubmitting ? 'Uygulanıyor...' : 'Hükmen Sonuçlandır'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Penalties List */}
      {penalties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Uygulanan Cezalar</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto select-none whitespace-nowrap scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-sm whitespace-nowrap min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Takım</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-500">Puan</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Sebep</th>
                  </tr>
                </thead>
                <tbody>
                  {penalties.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{p.team?.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-red-600 font-bold">{p.points > 0 ? '+' : ''}{p.points}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
