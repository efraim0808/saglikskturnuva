import { useState } from 'react';
import { useApp } from '../AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Handshake, Check, X, Clock, TrendingUp, Mail, Phone, User, ChevronDown } from 'lucide-react';
import type { SponsorCategory } from '../types';

const CATEGORIES: SponsorCategory[] = ['Ana Sponsor', 'Altın Sponsor', 'Gümüş Sponsor', 'Destek Sponsoru'];

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
};

const statusLabel: Record<string, string> = {
  pending: 'Beklemede',
  approved: 'Onaylı',
  rejected: 'Reddedildi',
};

function ApproveDropdown({ sponsorId, onApprove }: { sponsorId: string; onApprove: (id: string, cat: SponsorCategory) => Promise<void> | void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SponsorCategory>('Altın Sponsor');
  const [approving, setApproving] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-stretch rounded-lg overflow-hidden border border-emerald-300">
        <button
          onClick={async () => {
            if (approving) return;
            setApproving(true);
            try { await onApprove(sponsorId, selected); } finally { setApproving(false); }
          }}
          disabled={approving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          {approving ? 'Bekleyin...' : 'Onayla'}
        </button>
        <button
          onClick={() => setOpen(v => !v)}
          className="px-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors border-l border-emerald-300"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-20 py-1 min-w-[160px]">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setSelected(cat); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${selected === cat ? 'text-emerald-700 font-medium' : 'text-slate-700'}`}
            >
              {cat}
              {selected === cat && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminSponsors() {
  const { sponsors, approveSponsor, rejectSponsor, refreshSponsors } = useApp();
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const filtered = sponsors.filter(s => s.status === tab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sponsorluk Talepleri</h1>
        <p className="text-slate-500">Gelen başvuruları inceleyin ve onaylayın</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {(['pending', 'approved', 'rejected'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className={`inline-flex items-center gap-1.5`}>
              {t === 'pending' && <Clock className="w-3.5 h-3.5" />}
              {t === 'approved' && <Check className="w-3.5 h-3.5" />}
              {t === 'rejected' && <X className="w-3.5 h-3.5" />}
              {statusLabel[t]}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusBadge[t]}`}>
                {sponsors.filter(s => s.status === t).length}
              </span>
            </span>
          </button>
        ))}
        <button
          onClick={() => refreshSponsors()}
          className="ml-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          title="Yenile"
        >
          ↻
        </button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            <Handshake className="w-8 h-8 mx-auto mb-2 opacity-40" />
            {tab === 'pending' ? 'Bekleyen sponsorluk başvurusu yok.' : 'Bu kategoride başvuru bulunamadı.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(sponsor => (
            <Card key={sponsor.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Logo */}
                  <div className="sm:w-40 h-32 sm:h-auto bg-slate-50 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-100 shrink-0 p-4">
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.company_name}
                      className="max-h-full max-w-full object-contain"
                      onError={e => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Cpath d="M3 9h18M9 21V9"/%3E%3C/svg%3E';
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 text-lg">{sponsor.company_name}</h3>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[sponsor.status]}`}>
                            {statusLabel[sponsor.status]}
                          </span>
                          {sponsor.category && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {sponsor.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <TrendingUp className="w-4 h-4" />
                          {Number(sponsor.sponsor_amount).toLocaleString('tr-TR')} TL
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(sponsor.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      {sponsor.contact_name && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{sponsor.contact_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{sponsor.contact_email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{sponsor.contact_phone}</span>
                      </div>
                    </div>

                    {tab === 'pending' && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <ApproveDropdown sponsorId={sponsor.id} onApprove={approveSponsor} />
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => rejectSponsor(sponsor.id)}
                          className="flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reddet
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
