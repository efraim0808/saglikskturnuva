import { useState, useRef } from 'react';
import { useApp } from '../AppContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Handshake, Star, Award, Shield, Heart, Upload, X,
  Check, Clock, TrendingUp, Mail, Phone, User, ChevronDown, ImageIcon, Trash2,
} from 'lucide-react';
import type { SponsorCategory } from '../types';

const CATEGORIES: SponsorCategory[] = ['Ana Sponsor', 'Altın Sponsor', 'Gümüş Sponsor', 'Destek Sponsoru'];

const categoryConfig: Record<SponsorCategory, {
  icon: typeof Star;
  color: string;
  bg: string;
  border: string;
  badge: string;
  headerBg: string;
}> = {
  'Ana Sponsor':     { icon: Star,   color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-800',   headerBg: 'bg-amber-50 border-amber-200' },
  'Altın Sponsor':   { icon: Award,  color: 'text-yellow-700',  bg: 'bg-yellow-50',  border: 'border-yellow-200',  badge: 'bg-yellow-100 text-yellow-800',  headerBg: 'bg-yellow-50 border-yellow-200' },
  'Gümüş Sponsor':   { icon: Shield, color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200',   badge: 'bg-slate-100 text-slate-700',    headerBg: 'bg-slate-50 border-slate-200' },
  'Destek Sponsoru': { icon: Heart,  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', headerBg: 'bg-emerald-50 border-emerald-200' },
};

const statusBadge: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
};
const statusLabel: Record<string, string> = {
  pending:  'Beklemede',
  approved: 'Onaylı',
  rejected: 'Reddedildi',
};

// ── Base64 file picker ──────────────────────────────────────────────────────
function LogoPicker({ value, onChange }: { value: string; onChange: (b64: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => onChange((e.target?.result as string) ?? '');
    reader.readAsDataURL(file);
  }

  function handleFiles(files: FileList | null) {
    if (files?.[0]) processFile(files[0]);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 p-4 min-h-[120px] ${
        dragging ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      {value ? (
        <div className="flex flex-col items-center gap-2 w-full">
          <img src={value} alt="Logo önizleme" className="max-h-24 max-w-full object-contain rounded-lg" />
          <span className="text-xs text-emerald-600 font-medium">Değiştirmek için tıkla veya sürükle</span>
        </div>
      ) : (
        <>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">Logo yükle</p>
            <p className="text-xs text-slate-400">PNG, JPG, SVG — tıkla veya sürükle</p>
          </div>
        </>
      )}
    </div>
  );
}

// ── Application Form ────────────────────────────────────────────────────────
function ApplicationForm() {
  const { submitSponsorApplication } = useApp();
  const [form, setForm] = useState({
    company_name: '',
    logo_b64: '',
    sponsor_amount: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company_name || !form.logo_b64 || !form.contact_email || !form.contact_phone || !form.sponsor_amount) {
      setError('Lütfen zorunlu alanları (Firma Adı, Logo, Bütçe, E-Posta, Telefon) doldurun.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await submitSponsorApplication({
        company_name: form.company_name,
        logo_url: form.logo_b64,
        sponsor_amount: parseFloat(form.sponsor_amount),
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
      });
      setSuccess(true);
    } catch {
      setError('Başvuru gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Handshake className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Başvurunuz Alındı!</h3>
        <p className="text-slate-500 mb-6">Başvurunuz başarıyla Süper Admin onayına gönderilmiştir. En kısa sürede sizinle iletişime geçeceğiz.</p>
        <Button variant="primary" onClick={() => { setSuccess(false); setForm({ company_name: '', logo_b64: '', sponsor_amount: '', contact_name: '', contact_email: '', contact_phone: '' }); }}>
          Yeni Başvuru Yap
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">Sponsorluk Başvurusu</h2>
        <p className="text-sm text-slate-500">Bilgilerinizi doldurun, ekibimiz en kısa sürede sizinle iletişime geçsin.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Firma Adı <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.company_name}
            onChange={e => set('company_name', e.target.value)}
            placeholder="Örn: Kocaeli Sağlık Teknolojileri A.Ş."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Firma Logosu <span className="text-red-500">*</span>
          </label>
          <LogoPicker value={form.logo_b64} onChange={v => set('logo_b64', v)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Sponsorluk Bütçesi (TL) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              min="0"
              value={form.sponsor_amount}
              onChange={e => set('sponsor_amount', e.target.value)}
              placeholder="50000"
              className="w-full pl-9 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">İletişim Kişisi</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={form.contact_name}
                onChange={e => set('contact_name', e.target.value)}
                placeholder="Ad Soyad"
                className="w-full pl-9 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Telefon <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={form.contact_phone}
                onChange={e => set('contact_phone', e.target.value)}
                placeholder="0212 000 00 00"
                className="w-full pl-9 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            E-Posta <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={form.contact_email}
              onChange={e => set('contact_email', e.target.value)}
              placeholder="iletisim@firmaniz.com"
              className="w-full pl-9 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting ? 'Gönderiliyor...' : (
              <><Handshake className="w-4 h-4 mr-2" />Başvuru Gönder</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Approve dropdown ────────────────────────────────────────────────────────
function ApproveDropdown({ sponsorId, onApprove }: { sponsorId: string; onApprove: (id: string, cat: SponsorCategory) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SponsorCategory>('Altın Sponsor');

  return (
    <div className="relative">
      <div className="flex items-stretch rounded-lg overflow-hidden border border-emerald-300">
        <button
          onClick={() => onApprove(sponsorId, selected)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          Onayla
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

// ── Admin requests tab ──────────────────────────────────────────────────────
function RequestsTab() {
  const { sponsors, approveSponsor, rejectSponsor, refreshSponsors, deleteSponsor, userRole } = useApp();
  const isAdmin = userRole?.toLowerCase() === 'super_admin' || userRole?.toLowerCase() === 'admin';
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const filtered = sponsors.filter(s => s.status === statusFilter);

  async function handleDelete(id: string) {
    if (!window.confirm('Bu sponsoru sistemden tamamen silmek istediğinize emin misiniz?')) return;
    await deleteSponsor(id);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {(['pending', 'approved', 'rejected'] as const).map(t => (
            <button
              key={t}
              onClick={() => setStatusFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${statusFilter === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'pending'  && <Clock  className="w-3.5 h-3.5" />}
              {t === 'approved' && <Check  className="w-3.5 h-3.5" />}
              {t === 'rejected' && <X      className="w-3.5 h-3.5" />}
              {statusLabel[t]}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusBadge[t]}`}>
                {sponsors.filter(s => s.status === t).length}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => refreshSponsors()}
          className="text-sm text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1"
        >
          <Upload className="w-3.5 h-3.5 rotate-180" />
          Yenile
        </button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            <Handshake className="w-8 h-8 mx-auto mb-2 opacity-40" />
            {statusFilter === 'pending' ? 'Bekleyen sponsorluk başvurusu yok.' : 'Bu kategoride başvuru bulunamadı.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(sponsor => (
            <Card key={sponsor.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-40 h-32 sm:h-auto bg-slate-50 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-100 shrink-0 p-4">
                    {sponsor.logo_url ? (
                      <img
                        src={sponsor.logo_url}
                        alt={sponsor.company_name}
                        className="max-h-full max-w-full object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-base">{sponsor.company_name}</h3>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[sponsor.status]}`}>
                            {statusLabel[sponsor.status]}
                          </span>
                          {sponsor.category && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {sponsor.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-sm">
                          <TrendingUp className="w-4 h-4" />
                          {Number(sponsor.sponsor_amount).toLocaleString('tr-TR')} TL
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {new Date(sponsor.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(sponsor.id)}
                            title="Sponsoru Sil"
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
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

                    {statusFilter === 'pending' && (
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

// ── Public sponsors grid ────────────────────────────────────────────────────
function SponsorsGrid() {
  const { sponsors, deleteSponsor, userRole } = useApp();
  const isAdmin = userRole?.toLowerCase() === 'super_admin' || userRole?.toLowerCase() === 'admin';
  const approved = sponsors.filter(s => s.status === 'approved');

  async function handleDelete(id: string) {
    if (!window.confirm('Bu sponsoru sistemden tamamen silmek istediğinize emin misiniz?')) return;
    await deleteSponsor(id);
  }

  if (approved.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Handshake className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Henüz onaylı sponsor bulunmuyor</h3>
          <p className="text-slate-400">İlk sponsor siz olun!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {CATEGORIES.map(cat => {
        const catSponsors = approved.filter(s => s.category === cat);
        if (catSponsors.length === 0) return null;
        const cfg = categoryConfig[cat];
        const Icon = cfg.icon;
        return (
          <section key={cat}>
            <div className={`flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl border ${cfg.headerBg}`}>
              <Icon className={`w-5 h-5 ${cfg.color}`} />
              <h2 className={`text-base font-bold ${cfg.color}`}>{cat}</h2>
              <span className={`ml-auto px-2.5 py-0.5 text-xs font-semibold rounded-full ${cfg.badge}`}>
                {catSponsors.length}
              </span>
            </div>
            <div className={`grid gap-5 ${cat === 'Ana Sponsor' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
              {catSponsors.map(sponsor => (
                <div
                  key={sponsor.id}
                  className={`relative bg-white rounded-2xl border ${cfg.border} p-4 flex flex-col items-center text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}
                >
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(sponsor.id)}
                      title="Sponsoru Sil"
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className={`w-full h-36 flex items-center justify-center bg-gray-50/50 rounded-xl p-4 mb-4 border border-gray-100/80 overflow-hidden`}>
                    {sponsor.logo_url ? (
                      <img
                        src={sponsor.logo_url}
                        alt={sponsor.company_name}
                        className="max-h-full max-w-full object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-slate-300" />
                    )}
                  </div>
                  <span className={`mb-2 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cat}</span>
                  <h3 className="font-bold text-gray-900 text-lg leading-snug">{sponsor.company_name}</h3>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
type Tab = 'sponsors' | 'apply' | 'requests';

export function Sponsors() {
  const { isSuperAdmin, sponsors } = useApp();
  const [tab, setTab] = useState<Tab>('sponsors');

  const pendingCount = sponsors.filter(s => s.status === 'pending').length;

  const tabs: { id: Tab; label: string; adminOnly?: boolean }[] = [
    { id: 'sponsors', label: 'Sponsorlarımız' },
    { id: 'apply',    label: 'Başvuru Yap' },
    { id: 'requests', label: 'Talepler', adminOnly: true },
  ];

  const visibleTabs = tabs.filter(t => !t.adminOnly || isSuperAdmin);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-white">
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-4 right-8 w-40 h-40 bg-white rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-white rounded-full" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
              <Handshake className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Sponsorluk</h1>
          </div>
          <p className="text-emerald-100 max-w-lg">
            SağlıkSK'ya destek veren değerli kurumlarımıza teşekkür ederiz.
            Siz de aramıza katılmak için başvuru yapabilirsiniz.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {visibleTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {t.id === 'requests' && pendingCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-semibold">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'sponsors'  && <SponsorsGrid />}
      {tab === 'apply'     && <ApplicationForm />}
      {tab === 'requests'  && isSuperAdmin && <RequestsTab />}
    </div>
  );
}
