import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import {
  Trophy,
  Calendar,
  Activity,
  BarChart3,
  Shield,
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Archive,
  Play,
  Settings,
  AlertTriangle,
  ClipboardList,
  Handshake,
  Images,
  Sun,
  Moon,
  FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, userRole, userApprovalStatus, signOut, tournaments, selectedTournament, setSelectedTournament, isSuperAdmin, loading } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tournamentDropdownOpen, setTournamentDropdownOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark');
  const location = useLocation();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const navItems = [
    { path: '/', label: 'Puan Durumu', icon: Trophy },
    { path: '/fixtures', label: 'Fikstür', icon: Calendar },
    { path: '/live', label: 'Canlı Skor', icon: Activity },
    { path: '/suspensions', label: 'Cezalılar', icon: AlertTriangle },
    { path: '/stats', label: 'İstatistikler', icon: BarChart3 },
    { path: '/sponsors', label: 'Sponsorlarımız', icon: Handshake },
    { path: '/gallery', label: 'Galeri', icon: Images },
  ];

  const adminItems = [
    { path: '/admin/teams', label: 'Takım Yönetimi', icon: Users },
    { path: '/admin/fixtures', label: 'Fikstür Yönetimi', icon: Play },
    { path: '/admin/penalties', label: 'Cezalar', icon: Shield },
    { path: '/admin/tournaments', label: 'Turnuvalar', icon: Settings },
    { path: '/admin/users', label: 'Kullanıcı Yönetimi', icon: Users },
  ];

  const teamManagerItems = [
    { path: '/team/players', label: 'Kadro Yönetimi', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Loading Screen */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-xl bg-emerald-600 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            </div>
            <div className="text-sm font-medium text-slate-500">Yükleniyor...</div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center h-16 px-2 lg:px-8 gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900 hidden sm:block">SağlıkSK</span>
            </div>
          </div>

          {/* Tournament Selector */}
          <div className="relative flex-1 flex justify-center min-w-0 px-1">
            <button
              onClick={() => setTournamentDropdownOpen(!tournamentDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-medium text-slate-700 min-w-0 max-w-[220px] sm:max-w-xs"
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {selectedTournament?.name || 'Turnuva Seçin'}
              </span>
              {selectedTournament?.status === 'archived' && (
                <Archive className="w-3 h-3 text-amber-600 shrink-0" />
              )}
              <ChevronDown className="w-4 h-4 shrink-0" />
            </button>
            {tournamentDropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Aktif Turnuvalar
                </div>
                {tournaments.filter(t => t.status === 'active').map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTournament(t);
                      setTournamentDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between',
                      selectedTournament?.id === t.id && 'bg-emerald-50 text-emerald-700 font-medium'
                    )}
                  >
                    <span>{t.name}</span>
                    {selectedTournament?.id === t.id && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                  </button>
                ))}
                {tournaments.filter(t => t.status === 'archived').length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-t border-slate-100 mt-1">
                      Arşivlenmiş
                    </div>
                    {tournaments.filter(t => t.status === 'archived').map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedTournament(t);
                          setTournamentDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between text-slate-500',
                          selectedTournament?.id === t.id && 'bg-amber-50 text-amber-700 font-medium'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Archive className="w-3 h-3" />
                          {t.name}
                        </span>
                        {selectedTournament?.id === t.id && <div className="w-2 h-2 bg-amber-500 rounded-full" />}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Tournament Rules Button */}
          {selectedTournament?.rules_text && (
            <button
              onClick={() => setRulesOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors text-sm font-medium shrink-0"
              title="Turnuva Kuralları"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Kurallar</span>
            </button>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDark(d => !d)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              title={isDark ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-700">{user.email}</span>
                  <span className="text-xs text-slate-500 capitalize">{userRole}</span>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-colors"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                Giriş Yap
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed top-16 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 shadow-2xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)] lg:shadow-none',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col h-full overflow-y-auto pt-4">
            <nav className="flex-1 px-3 space-y-1">
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}

              {/* Turnuva Başvurusu - only for approved regular users */}
              {userRole === 'user' && userApprovalStatus === 'approved' && (
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Başvuru
                  </div>
                  <NavLink
                    to="/apply"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )
                    }
                  >
                    <ClipboardList className="w-5 h-5" />
                    Turnuva Başvurusu
                  </NavLink>
                </div>
              )}

              {/* Team Manager Section */}
              {userRole === 'team_manager' && (
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Takım Yönetimi
                  </div>
                  {teamManagerItems.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        )
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </NavLink>
                  ))}
                  <NavLink
                    to="/apply"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )
                    }
                  >
                    <ClipboardList className="w-5 h-5" />
                    Turnuva Başvurusu
                  </NavLink>
                </div>
              )}

              {/* Admin Section */}
              {isSuperAdmin && (
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Admin Paneli
                  </div>
                  {adminItems.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        )
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </nav>

            {selectedTournament?.status === 'archived' && (
              <div className="p-4 mx-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
                  <Archive className="w-4 h-4" />
                  Arşivlenmiş Turnuva
                </div>
                <p className="text-xs text-amber-600 mt-1">Bu turnuva salt okunur moddadır.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed top-16 inset-x-0 bottom-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

      {/* Tournament Rules Modal */}
      {rulesOpen && selectedTournament?.rules_text && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={() => setRulesOpen(false)}
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
                  <p className="text-xs text-slate-500 truncate">{selectedTournament.name} · {selectedTournament.season}</p>
                </div>
              </div>
              <button
                onClick={() => setRulesOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 sm:px-6 py-5 max-h-[60vh] overflow-y-auto">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  Galibiyet: {selectedTournament.win_points} p
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                  Beraberlik: {selectedTournament.draw_points} p
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold">
                  Mağlubiyet: {selectedTournament.loss_points} p
                </span>
              </div>
              <div className="prose prose-sm max-w-none">
                {selectedTournament.rules_text.split(/\n+/).map((para, idx) => (
                  para.trim()
                    ? <p key={idx} className="text-sm text-slate-700 leading-relaxed mb-3 whitespace-pre-wrap">{para}</p>
                    : null
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
