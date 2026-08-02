import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './lib/supabase';
import { toTurkishUpper, normalizeTurkish, toLocalDatetimeInputValue } from './lib/utils';
import { recalculateStandingsFromMatches } from './lib/standingsCache';
import type { Tournament, Team, Fixture, FixtureStatus, Match, MatchStatus, MatchEvent, Standing, UserRole, AppUser, Player, Penalty, PlayerSuspension, SystemUser, TeamApplication, UserApprovalStatus, Sponsor, SponsorCategory, GalleryItem, MatchLineup, LineupStatus, PasswordResetRequest } from './types';

interface AppContextType {
  // Auth
  user: AppUser | null;
  loading: boolean;
  isDataLoading: boolean;
  userApprovalStatus: UserApprovalStatus | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;

  // Role
  userRole: UserRole | null;
  managedTeamId: string | null;
  isSuperAdmin: boolean;
  isScorekeeper: boolean;
  isTeamManager: boolean;
  canManageSuspensions: boolean;

  // Tournament
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  setSelectedTournament: (t: Tournament | null) => void;

  // Data
  teams: Team[];
  fixtures: Fixture[];
  matches: Match[];
  matchEvents: MatchEvent[];
  standings: Standing[];
  players: Player[];
  penalties: Penalty[];
  suspensions: PlayerSuspension[];
  lineups: MatchLineup[];
  systemUsers: SystemUser[];
  teamApplications: TeamApplication[];
  sponsors: Sponsor[];
  galleryItems: GalleryItem[];

  // Actions
  refreshData: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshApplications: () => Promise<void>;
  refreshSponsors: () => Promise<void>;
  refreshGallery: () => Promise<void>;
  addGalleryItem: (imageUrl: string, caption: string, category: string) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;
  addTournament: (name: string, season: string, winPoints: number, drawPoints: number, lossPoints: number, rulesText: string) => Promise<void>;
  archiveTournament: (id: string) => Promise<void>;
  activateTournament: (id: string) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  updateTournamentRules: (id: string, rulesText: string) => Promise<boolean>;
  addTeam: (name: string, managerName: string, logoUrl?: string | null, jerseyColor?: string | null) => Promise<string | null>;
  approveTeam: (id: string) => Promise<void>;
  rejectTeam: (id: string) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  addPlayer: (teamId: string, name: string, jerseyNumber: number | null, position: string | null, hospital: string | null, department: string | null, phone: string | null, photoUrl?: string | null, tcNo?: string | null) => Promise<string | null>;
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<string | null>;
  deletePlayer: (id: string) => Promise<void>;
  generateAutoFixture: (doubleRound: boolean) => Promise<void>;
  addManualFixture: (week: number, homeTeamId: string, awayTeamId: string, matchDate: string | null, venue: string | null) => Promise<void>;
  updateFixtureDate: (id: string, matchDate: string | null) => Promise<void>;
  deleteFixture: (id: string) => Promise<void>;
  resetTournamentData: (tournamentId: string) => Promise<void>;
  startMatch: (fixtureId: string) => Promise<void>;
  pauseMatch: (fixtureId: string) => Promise<void>;
  resumeMatch: (fixtureId: string) => Promise<void>;
  endMatch: (fixtureId: string, playerOfMatchId: string | null) => Promise<void>;
  addMatchEvent: (fixtureId: string, eventType: string, playerId: string | null, assistPlayerId: string | null, minute: number, details: string | null) => Promise<void>;
  deleteMatchEvent: (eventId: string, fixtureId: string) => Promise<void>;
  setYoutubeStream: (fixtureId: string, streamId: string | null) => Promise<void>;
  addPenaltyPoints: (teamId: string, points: number, reason: string) => Promise<void>;
  setForfeit: (fixtureId: string, winnerTeamId: string) => Promise<void>;
  updateMatchScore: (fixtureId: string, updates: { homeScore: number; awayScore: number; status: MatchStatus; timerSeconds?: number; matchDate?: string | null }) => Promise<void>;
  assignRole: (userId: string, role: UserRole, teamId?: string | null) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole, teamId?: string | null) => Promise<void>;
  deleteSystemUser: (userId: string) => Promise<void>;
  approveUser: (userId: string, role?: UserRole) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  addSuspension: (playerId: string, teamId: string, reason: string, matchesTotal: number) => Promise<void>;
  reduceSuspension: (suspensionId: string, matches: number) => Promise<void>;
  removeSuspension: (suspensionId: string) => Promise<void>;
  updateSuspension: (suspensionId: string, matchesTotal: number, matchesRemaining: number, reason: string) => Promise<void>;
  getLineupForFixture: (fixtureId: string, teamId: string) => MatchLineup[];
  setLineupStatus: (fixtureId: string, teamId: string, playerId: string, status: LineupStatus) => Promise<void>;
  applyForTeam: (tournamentId: string, teamName: string, department?: string, phone?: string, logoUrl?: string | null, jerseyColor?: string | null) => Promise<void>;
  approveApplication: (appId: string) => Promise<void>;
  rejectApplication: (appId: string) => Promise<void>;
  submitSponsorApplication: (data: { company_name: string; logo_url: string; sponsor_amount: number; contact_name: string; contact_email: string; contact_phone: string }) => Promise<void>;
  approveSponsor: (id: string, category: SponsorCategory) => Promise<void>;
  rejectSponsor: (id: string) => Promise<void>;
  deleteSponsor: (id: string) => Promise<void>;
  // Password management
  passwordResetRequests: PasswordResetRequest[];
  refreshPasswordResetRequests: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<{ error: string | null }>;
  resolvePasswordResetRequest: (id: string) => Promise<void>;
  deletePasswordResetRequest: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userApprovalStatus, setUserApprovalStatus] = useState<UserApprovalStatus | null>(null);
  const [managedTeamId, setManagedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournamentState] = useState<Tournament | null>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [suspensions, setSuspensions] = useState<PlayerSuspension[]>([]);
  const [lineups, setLineups] = useState<MatchLineup[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [teamApplications, setTeamApplications] = useState<TeamApplication[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable refs for Realtime callbacks — avoid stale closures without adding
  // these to the effect's dependency array (which would re-subscribe constantly)
  const fixturesRef = useRef<Fixture[]>([]);
  const playersRef = useRef<Player[]>([]);
  const teamsRef = useRef<Team[]>([]);
  const refreshDataRef = useRef<() => Promise<void>>(async () => {});

  const isSuperAdmin = userRole === 'super_admin';
  const isScorekeeper = userRole === 'scorekeeper' || userRole === 'super_admin';
  const isTeamManager = userRole === 'team_manager' || userRole === 'super_admin';
  const canManageSuspensions = isSuperAdmin || userRole === 'scorekeeper';

  // Auth init
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email || '');
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setUserRole(null);
        setUserApprovalStatus(null);
        setManagedTeamId(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUser(userId: string, email: string) {
    try {
      const { data: roleData } = await supabase.from('user_roles').select('*').eq('user_id', userId).maybeSingle();
      const role: UserRole = (roleData?.role?.toLowerCase() || 'user') as UserRole;
      const approvalStatus: UserApprovalStatus = roleData?.status || 'pending';
      setUserRole(role);
      setUserApprovalStatus(approvalStatus);
      setManagedTeamId(roleData?.team_id || null);
      setUser({ id: userId, email, role, team_id: roleData?.team_id || null });
    } catch {
      setUser(null);
      setUserRole(null);
      setUserApprovalStatus(null);
      setManagedTeamId(null);
    } finally {
      setLoading(false);
    }
  }

  // Load tournaments
  useEffect(() => {
    loadTournaments();
    refreshUsers();
    refreshSponsors();
    refreshGallery();
    refreshPasswordResetRequests();
  }, []);

  async function loadTournaments() {
    const { data } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
    if (data) {
      setTournaments(data);
      setSelectedTournamentState(prev => {
        if (prev) return prev;
        const active = data.find((t: Tournament) => t.status === 'active');
        return active || data[0] || null;
      });
    }
  }

  // Load tournament data when selected changes
  useEffect(() => {
    if (selectedTournament) {
      setIsDataLoading(true);
      refreshData().finally(() => setIsDataLoading(false));
    }
  }, [selectedTournament?.id]);

  const refreshData = useCallback(async () => {
    if (!selectedTournament) return;
    const tid = selectedTournament.id;

    // Stage 1: get team IDs and fixture IDs for this tournament (needed as filters below)
    const [teamIdsRes, fixtureIdsRes] = await Promise.all([
      supabase.from('teams').select('id').eq('tournament_id', tid),
      supabase.from('fixtures').select('id').eq('tournament_id', tid),
    ]);
    const teamIds: string[] = teamIdsRes.data?.map((t: {id: string}) => t.id) || [];
    const fixtureIds: string[] = fixtureIdsRes.data?.map((f: {id: string}) => f.id) || [];

    // Stage 2: get match IDs (needed to scope match_events)
    const matchIdsRes = fixtureIds.length > 0
      ? await supabase.from('matches').select('id').in('fixture_id', fixtureIds)
      : { data: [] };
    const matchIds: string[] = (matchIdsRes.data as {id: string}[] | null)?.map(m => m.id) || [];

    // Stage 3: fetch all full data with tournament-scoped filters
    const [teamsRes, fixturesRes, matchesRes, eventsRes, standingsRes, playersRes, penaltiesRes, suspensionsRes, appsRes, lineupsRes] = await Promise.all([
      supabase.from('teams').select('*').eq('tournament_id', tid),
      supabase.from('fixtures').select('*').eq('tournament_id', tid).order('week', { ascending: true }).order('match_date', { ascending: true }),
      fixtureIds.length > 0
        ? supabase.from('matches').select('*').in('fixture_id', fixtureIds)
        : Promise.resolve({ data: [] }),
      matchIds.length > 0
        ? supabase.from('match_events').select('*').in('match_id', matchIds).order('minute', { ascending: true })
        : Promise.resolve({ data: [] }),
      supabase.from('standings').select('*').eq('tournament_id', tid),
      teamIds.length > 0
        ? supabase.from('players').select('*').in('team_id', teamIds)
        : Promise.resolve({ data: [] }),
      supabase.from('penalties').select('*').eq('tournament_id', tid),
      supabase.from('player_suspensions').select('*').eq('tournament_id', tid).order('created_at', { ascending: false }),
      supabase.from('team_applications').select('*').eq('tournament_id', tid),
      fixtureIds.length > 0
        ? supabase.from('match_lineups').select(`
            *,
            players (
              id,
              name,
              jersey_number,
              position
            )
          `).in('fixture_id', fixtureIds)
        : Promise.resolve({ data: [] }),
    ]);

    if (teamsRes.data) setTeams(teamsRes.data);
    if (fixturesRes.data) {
      const enrichedFixtures = fixturesRes.data.map((f: Fixture) => ({
        ...f,
        home_team: teamsRes.data?.find((t: Team) => t.id === f.home_team_id),
        away_team: teamsRes.data?.find((t: Team) => t.id === f.away_team_id),
        match: matchesRes.data?.find((m: Match) => m.fixture_id === f.id),
      }));
      setFixtures(enrichedFixtures);
    }
    if (matchesRes.data && matchesRes.data.length > 0) {
      setMatches(matchesRes.data);
    } else if (matchesRes.data && matchesRes.data.length === 0) {
      setMatches([]);
    }
    // If matchesRes.data is null (network error), keep existing state (anti-overwrite)
    if (eventsRes.data) {
      const enrichedEvents = eventsRes.data.map((e: MatchEvent) => ({
        ...e,
        player: playersRes.data?.find((p: Player) => p.id === e.player_id),
        assist_player: playersRes.data?.find((p: Player) => p.id === e.assist_player_id),
      }));
      setMatchEvents(enrichedEvents);
    }
    if (standingsRes.data && standingsRes.data.length > 0) {
      const enrichedStandings = standingsRes.data.map((s: Standing) => ({
        ...s,
        team: teamsRes.data?.find((t: Team) => t.id === s.team_id),
      }));
      setStandings(enrichedStandings);
    }
    if (playersRes.data && playersRes.data.length > 0) {
      setPlayers(playersRes.data);
    } else if (playersRes.data && playersRes.data.length === 0) {
      setPlayers([]);
    }
    // If playersRes.data is null (network error), keep existing state
    if (penaltiesRes.data) {
      const enrichedPenalties = penaltiesRes.data.map((p: Penalty) => ({
        ...p,
        team: teamsRes.data?.find((t: Team) => t.id === p.team_id),
      }));
      setPenalties(enrichedPenalties);
    }
    if (suspensionsRes.data) {
      const enrichedSuspensions = suspensionsRes.data.map((s: PlayerSuspension) => ({
        ...s,
        player: playersRes.data?.find((p: Player) => p.id === s.player_id),
        team: teamsRes.data?.find((t: Team) => t.id === s.team_id),
      }));
      setSuspensions(enrichedSuspensions);
    }

    if (lineupsRes.data) {
      const enrichedLineups = lineupsRes.data.map((l: MatchLineup) => {
        const joinedPlayer = (l as any).players;
        return {
          ...l,
          player: joinedPlayer
            ? { ...joinedPlayer, team_id: l.team_id }
            : playersRes.data?.find((p: Player) => p.id === l.player_id),
        };
      });
      setLineups(enrichedLineups);
    }
    if (appsRes.data) {
      const enrichedApps = appsRes.data.map((a: TeamApplication) => ({
        ...a,
        user_email: systemUsers.find((u: SystemUser) => u.id === a.user_id)?.email || a.user_id,
      }));
      setTeamApplications(enrichedApps);
    }
  }, [selectedTournament, systemUsers]);

  // refreshUsers builds systemUsers solely from user_roles table.
  // supabase.auth.admin.listUsers() requires a server-side service role and cannot be called
  // from the browser — so we read user_roles rows directly.
  const refreshUsers = useCallback(async () => {
    const { data: rolesData } = await supabase.from('user_roles').select('*');
    if (!rolesData) return;

    const mapped: SystemUser[] = rolesData.map((r: any) => ({
      id: r.user_id,
      email: r.email || r.user_id,
      role: (r.role as UserRole) || 'user',
      team_id: r.team_id || null,
      status: (r.status as UserApprovalStatus) || 'pending',
      created_at: r.created_at,
    }));

    setSystemUsers(mapped);
  }, []);

  const refreshApplications = useCallback(async () => {
    if (!selectedTournament) return;
    const { data } = await supabase.from('team_applications').select('*').eq('tournament_id', selectedTournament.id);
    if (data) {
      const enriched = data.map((a: TeamApplication) => ({
        ...a,
        user_email: systemUsers.find((u: SystemUser) => u.id === a.user_id)?.email || a.user_id,
      }));
      setTeamApplications(enriched);
    }
  }, [selectedTournament, systemUsers]);

  // Timer for live matches
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setMatches(prev => prev.map(m => {
        if (m.status === 'live' && m.timer_running) {
          return { ...m, timer_seconds: m.timer_seconds + 1 };
        }
        return m;
      }));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Keep refs current so Realtime callbacks always read latest state
  useEffect(() => { fixturesRef.current = fixtures; }, [fixtures]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { teamsRef.current = teams; }, [teams]);
  useEffect(() => { refreshDataRef.current = refreshData; }, [refreshData]);

  // ── Supabase Realtime — one channel per tournament ───────────────────────
  // Subscribes to matches, match_events, standings, teams, players.
  // Cleans up automatically when the selected tournament changes.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedTournament) return;
    const tid = selectedTournament.id;

    const channel = supabase
      .channel(`rt-tournament-${tid}`)

      // matches — protect the live timer from being overwritten by the DB value
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRow = payload.new as Match;
          if (!fixturesRef.current.some(f => f.id === newRow.fixture_id)) return;
          setMatches(prev => prev.some(m => m.id === newRow.id) ? prev : [...prev, newRow]);
          setFixtures(prev => prev.map(f =>
            f.id === newRow.fixture_id ? { ...f, match: newRow } : f
          ));
        } else if (payload.eventType === 'UPDATE') {
          const newRow = payload.new as Match;
          if (!fixturesRef.current.some(f => f.id === newRow.fixture_id)) return;
          setMatches(prev => prev.map(m => {
            if (m.id !== newRow.id) return m;
            // When the local timer is ticking, preserve its seconds — DB lags behind
            if (m.status === 'live' && m.timer_running) {
              return { ...newRow, timer_seconds: m.timer_seconds, timer_running: true };
            }
            return newRow;
          }));
          setFixtures(prev => prev.map(f =>
            f.id === newRow.fixture_id
              ? { ...f, match: newRow, status: newRow.status as FixtureStatus }
              : f
          ));
        } else if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as { id: string }).id;
          setMatches(prev => prev.filter(m => m.id !== oldId));
        }
      })

      // match_events — deduplicate against optimistic inserts from addMatchEvent
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRow = payload.new as MatchEvent;
          const enriched: MatchEvent = {
            ...newRow,
            player: playersRef.current.find(p => p.id === newRow.player_id),
            assist_player: playersRef.current.find(p => p.id === newRow.assist_player_id),
          };
          setMatchEvents(prev => prev.some(e => e.id === enriched.id) ? prev : [...prev, enriched]);
        } else if (payload.eventType === 'UPDATE') {
          const newRow = payload.new as MatchEvent;
          setMatchEvents(prev => prev.map(e => e.id === newRow.id ? {
            ...newRow,
            player: playersRef.current.find(p => p.id === newRow.player_id),
            assist_player: playersRef.current.find(p => p.id === newRow.assist_player_id),
          } : e));
        } else if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as { id: string }).id;
          setMatchEvents(prev => prev.filter(e => e.id !== oldId));
        }
      })

      // standings — refetch full set on any change (rows update in pairs at match end)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'standings', filter: `tournament_id=eq.${tid}` }, async () => {
        const { data } = await supabase.from('standings').select('*').eq('tournament_id', tid);
        if (data && data.length > 0) {
          const enriched = data.map((s: Standing) => ({
            ...s,
            team: teamsRef.current.find(t => t.id === s.team_id),
          }));
          setStandings(enriched);
          saveCachedStandings(tid, enriched);
        }
      })

      // teams — rare structural change; full refresh is safest
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `tournament_id=eq.${tid}` }, () => {
        refreshDataRef.current();
      })

      // players — filter client-side to only players in this tournament
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRow = payload.new as Player;
          if (!teamsRef.current.some(t => t.id === newRow.team_id)) return;
          setPlayers(prev => prev.some(p => p.id === newRow.id) ? prev : [...prev, newRow]);
        } else if (payload.eventType === 'UPDATE') {
          const newRow = payload.new as Player;
          if (!teamsRef.current.some(t => t.id === newRow.team_id)) return;
          setPlayers(prev => prev.map(p => p.id === newRow.id ? newRow : p));
        } else if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as { id: string }).id;
          setPlayers(prev => prev.filter(p => p.id !== oldId));
        }
      })

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTournament?.id]);

  const setSelectedTournament = useCallback((t: Tournament | null) => {
    setSelectedTournamentState(t);
  }, []);

  // Auth actions
  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data?.user) {
        const { data: roleData } = await supabase.from('user_roles').select('*').eq('user_id', data.user.id).maybeSingle();
        if (roleData && roleData.status === 'pending') {
          await supabase.auth.signOut();
          return { error: 'Hesabınız henüz admin tarafından onaylanmamıştır. Lütfen bekleyin.' };
        }
        await loadUser(data.user.id, data.user.email || '');
      }
      return { error: null };
    } catch {
      return { error: 'Bağlantı hatası, lütfen tekrar deneyin.' };
    }
  }

  async function signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (data?.user) {
        await supabase.from('user_roles').upsert({
          user_id: data.user.id,
          email,
          role: 'user',
          status: 'pending',
          team_id: null,
        }, { onConflict: 'user_id' });
        const newUser: SystemUser = {
          id: data.user.id,
          email,
          role: 'user',
          team_id: null,
          status: 'pending',
          created_at: new Date().toISOString(),
        };
        setSystemUsers(prev => {
          if (prev.some(u => u.id === data.user!.id)) return prev;
          return [...prev, newUser];
        });
      }
      return { error: null };
    } catch {
      return { error: 'Bağlantı hatası, lütfen tekrar deneyin.' };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    setUserApprovalStatus(null);
    setManagedTeamId(null);
  }

  // Tournament actions
  async function addTournament(name: string, season: string, winPoints: number, drawPoints: number, lossPoints: number, rulesText: string) {
    const { data, error } = await supabase.from('tournaments').insert({
      name, season, status: 'active',
      win_points: winPoints,
      draw_points: drawPoints,
      loss_points: lossPoints,
      rules_text: rulesText,
    }).select().single();
    if (data) {
      setTournaments(prev => [data, ...prev]);
      setSelectedTournament(data);
    }
    if (error) throw error;
  }

  async function archiveTournament(id: string) {
    await supabase.from('tournaments').update({ status: 'archived' }).eq('id', id);
    setTournaments(prev => prev.map(t => t.id === id ? { ...t, status: 'archived' as const } : t));
    if (selectedTournament?.id === id) {
      setSelectedTournament(prev => prev ? { ...prev, status: 'archived' as const } : null);
    }
  }

  async function activateTournament(id: string) {
    await supabase.from('tournaments').update({ status: 'active' }).eq('id', id);
    setTournaments(prev => prev.map(t => t.id === id ? { ...t, status: 'active' as const } : t));
    if (selectedTournament?.id === id) {
      setSelectedTournament(prev => prev ? { ...prev, status: 'active' as const } : null);
    }
  }

  async function deleteTournament(id: string) {
    await supabase.from('tournaments').delete().eq('id', id);
    setTournaments(prev => prev.filter(t => t.id !== id));
    if (selectedTournament?.id === id) {
      const remaining = tournaments.filter(t => t.id !== id);
      setSelectedTournament(remaining[0] || null);
    }
  }

  async function updateTournamentRules(id: string, rulesText: string): Promise<boolean> {
    const { error } = await supabase.from('tournaments').update({ rules_text: rulesText }).eq('id', id);
    if (error) {
      // Fallback: save to localStorage so admin doesn't lose work
      try { localStorage.setItem(`tournament_rules_${id}`, rulesText); } catch { /* ignore */ }
      return false;
    }
    setTournaments(prev => prev.map(t => t.id === id ? { ...t, rules_text: rulesText } : t));
    if (selectedTournament?.id === id) {
      setSelectedTournament(prev => prev ? { ...prev, rules_text: rulesText } : null);
    }
    return true;
  }

  // Team actions
  async function addTeam(name: string, managerName: string, logoUrl?: string | null, jerseyColor?: string | null): Promise<string | null> {
    if (!selectedTournament) return 'Turnuva seçili değil.';
    const upperName = toTurkishUpper(name.trim());
    if (!upperName) return 'Takım adı boş olamaz.';
    const duplicate = teams.find(t => normalizeTurkish(t.name) === normalizeTurkish(upperName));
    if (duplicate) return 'Bu takım adı zaten kayıtlı.';
    const { data } = await supabase.from('teams').insert({ tournament_id: selectedTournament.id, name: upperName, manager_name: managerName.trim() || null, status: 'pending', logo_url: logoUrl || null, jersey_color: jerseyColor || '#16a34a' }).select().single();
    if (data) setTeams(prev => [...prev, data]);
    return null;
  }

  async function approveTeam(id: string) {
    await supabase.from('teams').update({ status: 'approved' }).eq('id', id);
    setTeams(prev => prev.map(t => t.id === id ? { ...t, status: 'approved' as const } : t));
    if (selectedTournament) {
      await supabase.from('standings').insert({ tournament_id: selectedTournament.id, team_id: id }).select().single();
    }
  }

  async function rejectTeam(id: string) {
    await supabase.from('teams').update({ status: 'rejected' }).eq('id', id);
    setTeams(prev => prev.map(t => t.id === id ? { ...t, status: 'rejected' as const } : t));
  }

  async function deleteTeam(id: string) {
    await supabase.from('teams').delete().eq('id', id);
    setTeams(prev => prev.filter(t => t.id !== id));
  }

  // Player actions
  async function addPlayer(teamId: string, name: string, jerseyNumber: number | null, position: string | null, hospital: string | null, department: string | null, phone: string | null, photoUrl?: string | null, tcNo?: string | null): Promise<string | null> {
    const upperName = toTurkishUpper(name.trim());
    if (!upperName) return 'Oyuncu adı boş olamaz.';
    const trimmedPhone = phone?.trim() || null;
    const trimmedTc = tcNo?.trim() || null;
    if (!trimmedTc) return 'TC Kimlik Numarası zorunludur.';
    if (!/^\d{11}$/.test(trimmedTc)) return 'TC Kimlik Numarası 11 haneli ve sadece rakamlardan oluşmalıdır.';
    const duplicate = players.find(p =>
      normalizeTurkish(p.name) === normalizeTurkish(upperName) ||
      (trimmedPhone && p.phone?.trim() === trimmedPhone) ||
      (trimmedTc && p.tc_no?.trim() === trimmedTc)
    );
    if (duplicate) return '⚠️ Bu TC Kimlik Numarasına sahip oyuncu zaten turnuvada başka bir takımda kayıtlıdır!';
    const { data } = await supabase.from('players').insert({ team_id: teamId, name: upperName, jersey_number: jerseyNumber, position, hospital, department, phone: trimmedPhone || null, photo_url: photoUrl || null, tc_no: trimmedTc }).select().single();
    if (data) setPlayers(prev => [...prev, data]);
    return null;
  }

  async function updatePlayer(id: string, updates: Partial<Player>): Promise<string | null> {
    const upperName = updates.name ? toTurkishUpper(updates.name.trim()) : undefined;
    const trimmedPhone = updates.phone?.trim() || null;
    const trimmedTc = updates.tc_no !== undefined ? (updates.tc_no?.trim() || null) : undefined;
    if (trimmedTc !== undefined && trimmedTc !== null) {
      if (!/^\d{11}$/.test(trimmedTc)) return 'TC Kimlik Numarası 11 haneli ve sadece rakamlardan oluşmalıdır.';
    }
    if (upperName || trimmedPhone || trimmedTc !== undefined) {
      const duplicate = players.find(p =>
        p.id !== id && (
          (upperName && normalizeTurkish(p.name) === normalizeTurkish(upperName)) ||
          (trimmedPhone && p.phone?.trim() === trimmedPhone) ||
          (trimmedTc && trimmedTc !== null && p.tc_no?.trim() === trimmedTc)
        )
      );
      if (duplicate) return '⚠️ Bu TC Kimlik Numarasına sahip oyuncu zaten turnuvada başka bir takımda kayıtlıdır!';
    }
    const normalizedUpdates = { ...updates, ...(upperName ? { name: upperName } : {}), ...(trimmedTc !== undefined ? { tc_no: trimmedTc } : {}) };
    await supabase.from('players').update(normalizedUpdates).eq('id', id);
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...normalizedUpdates } : p));
    return null;
  }

  async function deletePlayer(id: string) {
    await supabase.from('players').delete().eq('id', id);
    setPlayers(prev => prev.filter(p => p.id !== id));
  }

  // Fixture actions
  async function generateAutoFixture(doubleRound: boolean) {
    if (!selectedTournament) return;
    const approvedTeams = teams.filter(t => t.status === 'approved');
    if (approvedTeams.length < 2) throw new Error('Yeterli onaylı takım yok');

    const teamIds = approvedTeams.map(t => t.id);
    const fixturesToInsert: { tournament_id: string; week: number; home_team_id: string; away_team_id: string; status: string; match_date: string }[] = [];

    const n = teamIds.length;
    const rounds = n - 1;
    const teamsArr = [...teamIds];
    if (n % 2 === 1) teamsArr.push('dummy');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 3);

    for (let round = 0; round < rounds; round++) {
      const weekOffset = round;
      const saturday = new Date(startDate);
      const dayOfWeek = saturday.getDay();
      const daysToSat = (6 - dayOfWeek + 7) % 7;
      saturday.setDate(saturday.getDate() + daysToSat + weekOffset * 7);
      let matchHour = 10;
      let matchIdx = 0;

      for (let i = 0; i < teamsArr.length / 2; i++) {
        const home = teamsArr[i];
        const away = teamsArr[teamsArr.length - 1 - i];
        if (home !== 'dummy' && away !== 'dummy') {
          const matchDate = new Date(saturday);
          matchDate.setHours(matchHour + matchIdx, 0, 0, 0);
          fixturesToInsert.push({
            tournament_id: selectedTournament.id,
            week: round + 1,
            home_team_id: home,
            away_team_id: away,
            status: 'scheduled',
            match_date: matchDate.toISOString(),
          });
          matchIdx++;
        }
      }
      const last = teamsArr.pop()!;
      teamsArr.splice(1, 0, last);
    }

    if (doubleRound) {
      const firstHalf = [...fixturesToInsert];
      firstHalf.forEach((f, idx) => {
        const returnDate = new Date(f.match_date);
        returnDate.setDate(returnDate.getDate() + rounds * 7);
        fixturesToInsert.push({
          tournament_id: selectedTournament!.id,
          week: rounds + idx + 1,
          home_team_id: f.away_team_id,
          away_team_id: f.home_team_id,
          status: 'scheduled',
          match_date: returnDate.toISOString(),
        });
      });
    }

    const { data: insertedFixtures } = await supabase.from('fixtures').insert(fixturesToInsert).select();
    if (insertedFixtures) {
      const matchesToInsert = insertedFixtures.map((f: Fixture) => ({
        fixture_id: f.id,
        home_score: 0,
        away_score: 0,
        status: 'scheduled',
        timer_seconds: 0,
        timer_running: false,
      }));
      await supabase.from('matches').insert(matchesToInsert);
    }
    await refreshData();
  }

  async function addManualFixture(week: number, homeTeamId: string, awayTeamId: string, matchDate: string | null, venue: string | null) {
    if (!selectedTournament) return;
    const { data: fixtureData } = await supabase.from('fixtures').insert({
      tournament_id: selectedTournament.id,
      week,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_date: matchDate,
      venue,
      status: 'scheduled',
    }).select().single();

    if (fixtureData) {
      await supabase.from('matches').insert({
        fixture_id: fixtureData.id,
        home_score: 0,
        away_score: 0,
        status: 'scheduled',
        timer_seconds: 0,
        timer_running: false,
      });
    }
    await refreshData();
  }

  async function updateFixtureDate(id: string, matchDate: string | null) {
    const isoDate = matchDate ? new Date(matchDate).toISOString() : null;
    await supabase.from('fixtures').update({ match_date: isoDate }).eq('id', id);
    setFixtures(prev => prev.map(f => f.id === id ? { ...f, match_date: isoDate } : f));
  }

  async function deleteFixture(id: string) {
    await supabase.from('fixtures').delete().eq('id', id);
    await refreshData();
  }

  async function resetTournamentData(tournamentId: string) {
    const { data: tourFixtures } = await supabase.from('fixtures').select('id').eq('tournament_id', tournamentId);
    const fixtureIds = (tourFixtures || []).map((f: any) => f.id);

    if (fixtureIds.length > 0) {
      await supabase.from('match_lineups').delete().in('fixture_id', fixtureIds);
      const { data: tourMatches } = await supabase.from('matches').select('id').in('fixture_id', fixtureIds);
      const matchIds = (tourMatches || []).map((m: any) => m.id);
      if (matchIds.length > 0) {
        await supabase.from('match_events').delete().in('match_id', matchIds);
      }
      await supabase.from('matches').delete().in('fixture_id', fixtureIds);
    }

    await supabase.from('fixtures').delete().eq('tournament_id', tournamentId);
    await supabase.from('standings').delete().eq('tournament_id', tournamentId);

    setFixtures([]);
    setMatches([]);
    setMatchEvents([]);
    setStandings([]);
    setLineups([]);
    await refreshData();
  }

  // Match actions
  async function startMatch(fixtureId: string) {
    const match = matches.find(m => m.fixture_id === fixtureId);
    if (!match) return;
    await supabase.from('matches').update({ status: 'live', timer_running: true }).eq('id', match.id);
    await supabase.from('fixtures').update({ status: 'live' }).eq('id', fixtureId);
    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: 'live' as const, timer_running: true } : m));
    setFixtures(prev => prev.map(f => f.id === fixtureId ? { ...f, status: 'live' as const } : f));
  }

  async function pauseMatch(fixtureId: string) {
    const match = matches.find(m => m.fixture_id === fixtureId);
    if (!match) return;
    await supabase.from('matches').update({ status: 'paused', timer_running: false, timer_seconds: match.timer_seconds }).eq('id', match.id);
    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: 'paused' as const, timer_running: false } : m));
  }

  async function resumeMatch(fixtureId: string) {
    const match = matches.find(m => m.fixture_id === fixtureId);
    if (!match) return;
    await supabase.from('matches').update({ status: 'live', timer_running: true }).eq('id', match.id);
    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: 'live' as const, timer_running: true } : m));
  }

  async function endMatch(fixtureId: string, playerOfMatchId: string | null) {
    const match = matches.find(m => m.fixture_id === fixtureId);
    if (!match) return;
    await supabase.from('matches').update({
      status: 'completed',
      timer_running: false,
      timer_seconds: match.timer_seconds,
      player_of_the_match: playerOfMatchId || null,
    }).eq('id', match.id);
    await supabase.from('fixtures').update({ status: 'completed' }).eq('id', fixtureId);
    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: 'completed' as const, timer_running: false } : m));
    setFixtures(prev => prev.map(f => f.id === fixtureId ? { ...f, status: 'completed' as const } : f));
    await updateStandingsAfterMatch(match);
    await updateSuspensionsAfterMatch(fixtureId);
  }

  async function updateStandingsAfterMatch(match: Match) {
    const fixture = fixtures.find(f => f.id === match.fixture_id);
    if (!fixture || !selectedTournament) return;

    const homeStanding = standings.find(s => s.team_id === fixture.home_team_id);
    const awayStanding = standings.find(s => s.team_id === fixture.away_team_id);

    if (!homeStanding || !awayStanding) return;

    const winPoints = selectedTournament.win_points;
    const drawPoints = selectedTournament.draw_points;
    const lossPoints = selectedTournament.loss_points;

    const homeResultPoints = match.home_score > match.away_score ? winPoints : match.home_score === match.away_score ? drawPoints : lossPoints;
    const awayResultPoints = match.away_score > match.home_score ? winPoints : match.home_score === match.away_score ? drawPoints : lossPoints;

    const homeUpdates = {
      played: homeStanding.played + 1,
      won: homeStanding.won + (match.home_score > match.away_score ? 1 : 0),
      drawn: homeStanding.drawn + (match.home_score === match.away_score ? 1 : 0),
      lost: homeStanding.lost + (match.home_score < match.away_score ? 1 : 0),
      goals_for: homeStanding.goals_for + match.home_score,
      goals_against: homeStanding.goals_against + match.away_score,
      points: homeStanding.points + homeResultPoints,
    };

    const awayUpdates = {
      played: awayStanding.played + 1,
      won: awayStanding.won + (match.away_score > match.home_score ? 1 : 0),
      drawn: awayStanding.drawn + (match.home_score === match.away_score ? 1 : 0),
      lost: awayStanding.lost + (match.away_score < match.home_score ? 1 : 0),
      goals_for: awayStanding.goals_for + match.away_score,
      goals_against: awayStanding.goals_against + match.home_score,
      points: awayStanding.points + awayResultPoints,
    };

    await supabase.from('standings').update(homeUpdates).eq('id', homeStanding.id);
    await supabase.from('standings').update(awayUpdates).eq('id', awayStanding.id);
    await refreshData();
  }

  async function updateSuspensionsAfterMatch(fixtureId: string) {
    if (!selectedTournament) return;
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;

    // Find all active suspensions for both teams in this tournament
    const activeSuspensions = suspensions.filter(s =>
      s.matches_remaining > 0 &&
      (s.team_id === fixture.home_team_id || s.team_id === fixture.away_team_id)
    );

    for (const s of activeSuspensions) {
      const newRemaining = s.matches_remaining - 1;
      await supabase
        .from('player_suspensions')
        .update({ matches_remaining: newRemaining })
        .eq('id', s.id);
    }

    if (activeSuspensions.length > 0) await refreshData();
  }

  async function addMatchEvent(fixtureId: string, eventType: string, playerId: string | null, assistPlayerId: string | null, minute: number, details: string | null) {
    const match = matches.find(m => m.fixture_id === fixtureId);
    if (!match) return;

    const { data: newEvent } = await supabase.from('match_events').insert({
      match_id: match.id,
      event_type: eventType,
      player_id: playerId,
      assist_player_id: assistPlayerId,
      minute,
      details,
    }).select().single();

    // Add enriched event to local state immediately — no refreshData so timer is untouched
    if (newEvent) {
      const enrichedEvent = {
        ...newEvent,
        player: players.find(p => p.id === newEvent.player_id),
        assist_player: players.find(p => p.id === newEvent.assist_player_id),
      };
      setMatchEvents(prev => [...prev, enrichedEvent]);
    }

    // Update score for goals — update local state directly, not via refreshData
    if (eventType === 'goal' || eventType === 'penalty') {
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (!fixture) return;
      const isHomeGoal = players.find(p => p.id === playerId)?.team_id === fixture.home_team_id;
      const scoreUpdates = isHomeGoal
        ? { home_score: match.home_score + 1 }
        : { away_score: match.away_score + 1 };
      await supabase.from('matches').update(scoreUpdates).eq('id', match.id);
      // Patch only the score fields in local state — leave timer_seconds alone
      setMatches(prev => prev.map(m =>
        m.id === match.id ? { ...m, ...scoreUpdates } : m
      ));

      // Recalculate standings after score change
      if (selectedTournament) {
        const updatedMatch = { ...match, ...scoreUpdates };
        const recalculated = recalculateStandingsFromMatches({
          tournament: selectedTournament,
          teams,
          fixtures,
          matches: matches.map(m => m.id === match.id ? updatedMatch : m),
          penalties,
        });
        for (const s of recalculated) {
          const existing = standings.find(st => st.team_id === s.team_id);
          if (existing) {
            await supabase.from('standings').update({
              played: s.played, won: s.won, drawn: s.drawn, lost: s.lost,
              goals_for: s.goals_for, goals_against: s.goals_against,
              penalty_points: s.penalty_points, points: s.points,
            }).eq('id', existing.id);
          }
        }
        setStandings(recalculated);
        saveCachedStandings(selectedTournament.id, recalculated);
      }
    }

    // Auto-add red card suspension
    if (eventType === 'red_card' && playerId) {
      const player = players.find(p => p.id === playerId);
      if (player && selectedTournament) {
        const { data: newSuspension } = await supabase.from('player_suspensions').insert({
          tournament_id: selectedTournament.id,
          player_id: playerId,
          team_id: player.team_id,
          reason: details || 'Kırmızı kart',
          matches_total: 1,
          matches_remaining: 1,
          match_id: match.id,
          is_auto: true,
        }).select().single();
        if (newSuspension) {
          setSuspensions(prev => [...prev, {
            ...newSuspension,
            player,
            team: fixtures.find(f => f.id === fixtureId)?.home_team_id === player.team_id
              ? fixtures.find(f => f.id === fixtureId)?.home_team
              : fixtures.find(f => f.id === fixtureId)?.away_team,
          }]);
        }
      }
    }

    // Auto-add suspension when player reaches 4 yellow cards (or multiples of 4)
    if (eventType === 'yellow_card' && playerId && selectedTournament) {
      const player = players.find(p => p.id === playerId);
      if (player) {
        // Count all yellow cards for this player in the current tournament
        const tournamentFixtures = fixtures.filter(f => f.tournament_id === selectedTournament.id);
        const tournamentFixtureIds = new Set(tournamentFixtures.map(f => f.id));
        const tournamentMatchIds = new Set(
          matches.filter(m => tournamentFixtureIds.has(m.fixture_id)).map(m => m.id)
        );
        // Count existing yellow cards + the one just added (already in matchEvents via setMatchEvents above)
        const playerYellowCards = matchEvents.filter(e =>
          e?.event_type === 'yellow_card' &&
          e?.player_id === playerId &&
          tournamentMatchIds.has(e?.match_id)
        ).length + 1; // +1 because the new event was just added to state

        if (playerYellowCards > 0 && playerYellowCards % 4 === 0) {
          const { data: newSuspension } = await supabase.from('player_suspensions').insert({
            tournament_id: selectedTournament.id,
            player_id: playerId,
            team_id: player.team_id,
            reason: '4 Sarı Kart Limit Cezası',
            matches_total: 1,
            matches_remaining: 1,
            match_id: match.id,
            is_auto: true,
          }).select().single();
          if (newSuspension) {
            setSuspensions(prev => [...prev, {
              ...newSuspension,
              player,
              team: fixtures.find(f => f.id === fixtureId)?.home_team_id === player.team_id
                ? fixtures.find(f => f.id === fixtureId)?.home_team
                : fixtures.find(f => f.id === fixtureId)?.away_team,
            }]);
          }
        }
      }
    }
    // No refreshData() here — that would overwrite timer_seconds from DB
  }

  async function deleteMatchEvent(eventId: string, fixtureId: string) {
    const event = matchEvents.find(e => e.id === eventId);
    if (!event) return;
    const match = matches.find(m => m.fixture_id === fixtureId);
    if (!match) return;

    await supabase.from('match_events').delete().eq('id', eventId);

    setMatchEvents(prev => prev.filter(e => e.id !== eventId));

    if (event.event_type === 'goal' || event.event_type === 'penalty') {
      const fixture = fixtures.find(f => f.id === fixtureId);
      if (!fixture) return;
      const isHomeGoal = (event.player ? players.find(p => p.id === event.player_id)?.team_id : null) === fixture.home_team_id;
      const scoreUpdates = isHomeGoal
        ? { home_score: Math.max(0, match.home_score - 1) }
        : { away_score: Math.max(0, match.away_score - 1) };
      await supabase.from('matches').update(scoreUpdates).eq('id', match.id);
      setMatches(prev => prev.map(m =>
        m.id === match.id ? { ...m, ...scoreUpdates } : m
      ));

      if (selectedTournament) {
        const updatedMatch = { ...match, ...scoreUpdates };
        const recalculated = recalculateStandingsFromMatches({
          tournament: selectedTournament,
          teams,
          fixtures,
          matches: matches.map(m => m.id === match.id ? updatedMatch : m),
          penalties,
        });
        for (const s of recalculated) {
          const existing = standings.find(st => st.team_id === s.team_id);
          if (existing) {
            await supabase.from('standings').update({
              played: s.played, won: s.won, drawn: s.drawn, lost: s.lost,
              goals_for: s.goals_for, goals_against: s.goals_against,
              penalty_points: s.penalty_points, points: s.points,
            }).eq('id', existing.id);
          }
        }
        setStandings(recalculated);
        saveCachedStandings(selectedTournament.id, recalculated);
      }
    }
  }

  async function setYoutubeStream(fixtureId: string, streamId: string | null) {
    const match = matches.find(m => m.fixture_id === fixtureId);
    if (!match) return;
    const value = streamId?.trim() || null;
    await supabase.from('matches').update({ youtube_stream_id: value }).eq('id', match.id);
    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, youtube_stream_id: value } : m));
  }

  async function addPenaltyPoints(teamId: string, points: number, reason: string) {
    if (!selectedTournament) return;
    await supabase.from('penalties').insert({ tournament_id: selectedTournament.id, team_id: teamId, points, reason, created_by: user!.id });
    const standing = standings.find(s => s.team_id === teamId);
    if (standing) {
      await supabase.from('standings').update({
        penalty_points: standing.penalty_points + points,
        points: standing.points + points,
      }).eq('id', standing.id);
    }
    await refreshData();
  }

  async function setForfeit(fixtureId: string, winnerTeamId: string) {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;
    const match = matches.find(m => m.fixture_id === fixtureId);
    if (!match) return;

    const homeWins = winnerTeamId === fixture.home_team_id;
    await supabase.from('matches').update({
      home_score: homeWins ? 3 : 0,
      away_score: homeWins ? 0 : 3,
      status: 'completed',
      timer_running: false,
    }).eq('id', match.id);
    await supabase.from('fixtures').update({ status: 'forfeit' }).eq('id', fixtureId);

    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, home_score: homeWins ? 3 : 0, away_score: homeWins ? 0 : 3, status: 'completed' as const, timer_running: false } : m));
    setFixtures(prev => prev.map(f => f.id === fixtureId ? { ...f, status: 'forfeit' as const } : f));

    await updateStandingsAfterMatch({ ...match, home_score: homeWins ? 3 : 0, away_score: homeWins ? 0 : 3, status: 'completed' });
  }

  async function updateMatchScore(fixtureId: string, updates: { homeScore: number; awayScore: number; status: MatchStatus; timerSeconds?: number; matchDate?: string | null }) {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;
    const match = matches.find(m => m.fixture_id === fixtureId);
    if (!match) return;
    if (!selectedTournament) return;

    const matchUpdate: Record<string, unknown> = {
      home_score: updates.homeScore,
      away_score: updates.awayScore,
      status: updates.status,
      timer_running: updates.status === 'live',
    };
    if (updates.timerSeconds !== undefined) {
      matchUpdate.timer_seconds = updates.timerSeconds;
    }

    await supabase.from('matches').update(matchUpdate).eq('id', match.id);

    const fixtureUpdate: Record<string, unknown> = {};
    if (updates.matchDate !== undefined) {
      fixtureUpdate.match_date = updates.matchDate;
    }
    if (updates.status === 'completed') {
      fixtureUpdate.status = 'completed';
    } else if (updates.status === 'live') {
      fixtureUpdate.status = 'live';
    } else if (updates.status === 'scheduled') {
      fixtureUpdate.status = 'scheduled';
    }
    if (Object.keys(fixtureUpdate).length > 0) {
      await supabase.from('fixtures').update(fixtureUpdate).eq('id', fixtureId);
    }

    const updatedMatch: Match = {
      ...match,
      home_score: updates.homeScore,
      away_score: updates.awayScore,
      status: updates.status,
      timer_seconds: updates.timerSeconds ?? match.timer_seconds,
      timer_running: updates.status === 'live',
    };
    const updatedFixture: Fixture = {
      ...fixture,
      match_date: updates.matchDate !== undefined ? updates.matchDate : fixture.match_date,
      status: (fixtureUpdate.status as FixtureStatus) ?? fixture.status,
      match: updatedMatch,
    };

    setMatches(prev => prev.map(m => m.id === match.id ? updatedMatch : m));
    setFixtures(prev => prev.map(f => f.id === fixtureId ? updatedFixture : f));

    const recalculated = recalculateStandingsFromMatches({
      tournament: selectedTournament,
      teams,
      fixtures: fixtures.map(f => f.id === fixtureId ? updatedFixture : f),
      matches: matches.map(m => m.id === match.id ? updatedMatch : m),
      penalties,
    });

    for (const s of recalculated) {
      const existing = standings.find(st => st.team_id === s.team_id);
      if (existing) {
        await supabase.from('standings').update({
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goals_for: s.goals_for,
          goals_against: s.goals_against,
          penalty_points: s.penalty_points,
          points: s.points,
        }).eq('id', existing.id);
      }
    }

    setStandings(recalculated);
  }

  async function assignRole(targetUserId: string, role: UserRole, teamId?: string | null) {
    const { data: existing } = await supabase.from('user_roles').select('*').eq('user_id', targetUserId).maybeSingle();
    if (existing) {
      await supabase.from('user_roles').update({ role, team_id: teamId || null }).eq('id', existing.id);
    } else {
      await supabase.from('user_roles').insert({ user_id: targetUserId, role, team_id: teamId || null });
    }
    await refreshUsers();
  }

  async function updateUserRole(userId: string, role: UserRole, teamId?: string | null) {
    const { data: existing } = await supabase.from('user_roles').select('*').eq('user_id', userId).maybeSingle();
    if (existing) {
      await supabase.from('user_roles').update({ role, team_id: teamId ?? null }).eq('user_id', userId);
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role, team_id: teamId ?? null });
    }
    setSystemUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, role, team_id: teamId ?? null } : u
    ));
  }

  async function deleteSystemUser(userId: string) {
    await supabase.from('user_roles').delete().eq('user_id', userId);
    setSystemUsers(prev => prev.filter(u => u.id !== userId));
  }

  async function approveUser(userId: string, role: UserRole = 'user') {
    const { data: existing } = await supabase.from('user_roles').select('*').eq('user_id', userId).maybeSingle();
    if (existing) {
      await supabase.from('user_roles').update({ status: 'approved', role }).eq('user_id', userId);
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role, status: 'approved', team_id: null });
    }
    // Optimistic update: move user from pending to approved immediately in local state
    setSystemUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, role, status: 'approved' as const } : u
    ));
  }

  async function rejectUser(userId: string) {
    await supabase.from('user_roles').update({ status: 'rejected' }).eq('user_id', userId);
    setSystemUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, status: 'rejected' as const } : u
    ));
  }

  // Application actions
  async function applyForTeam(tournamentId: string, teamName: string, department?: string, phone?: string, logoUrl?: string | null, jerseyColor?: string | null) {
    if (!user) return;
    await supabase.from('team_applications').insert({
      user_id: user.id,
      tournament_id: tournamentId,
      team_name: teamName,
      department: department || null,
      phone: phone || null,
      logo_url: logoUrl || null,
      jersey_color: jerseyColor || null,
      status: 'pending',
    });
    await refreshApplications();
  }

  async function approveApplication(appId: string) {
    const app = teamApplications.find(a => a.id === appId);
    if (!app || !selectedTournament) return;

    // Create team
    const { data: teamData } = await supabase.from('teams').insert({
      tournament_id: app.tournament_id,
      name: app.team_name,
      manager_name: app.user_email || 'Bilinmiyor',
      status: 'approved',
      logo_url: app.logo_url || null,
      jersey_color: app.jersey_color || '#16a34a',
    }).select().single();

    if (teamData) {
      // Create standing entry
      await supabase.from('standings').insert({
        tournament_id: app.tournament_id,
        team_id: teamData.id,
      });

      // Promote user to team_manager in DB
      await supabase.from('user_roles').update({
        role: 'team_manager',
        team_id: teamData.id,
        status: 'approved',
      }).eq('user_id', app.user_id);

      // Promote user in local state immediately
      setSystemUsers(prev => prev.map(u =>
        u.id === app.user_id
          ? { ...u, role: 'team_manager' as UserRole, team_id: teamData.id, status: 'approved' as const }
          : u
      ));

      // Update application status
      await supabase.from('team_applications').update({ status: 'approved' }).eq('id', appId);
    }

    await refreshData();
    await refreshApplications();
  }

  async function rejectApplication(appId: string) {
    await supabase.from('team_applications').update({ status: 'rejected' }).eq('id', appId);
    await refreshApplications();
  }

  // Suspension actions
  async function addSuspension(playerId: string, teamId: string, reason: string, matchesTotal: number) {
    if (!selectedTournament) return;
    await supabase.from('player_suspensions').insert({
      tournament_id: selectedTournament.id,
      player_id: playerId,
      team_id: teamId,
      reason,
      matches_total: matchesTotal,
      matches_remaining: matchesTotal,
      is_auto: false,
    });
    await refreshData();
  }

  async function reduceSuspension(suspensionId: string, matches: number) {
    const suspension = suspensions.find(s => s.id === suspensionId);
    if (!suspension) return;
    const newRemaining = Math.max(0, suspension.matches_remaining - matches);
    await supabase.from('player_suspensions').update({ matches_remaining: newRemaining }).eq('id', suspensionId);
    await refreshData();
  }

  async function removeSuspension(suspensionId: string) {
    await supabase.from('player_suspensions').delete().eq('id', suspensionId);
    await refreshData();
  }

  async function updateSuspension(suspensionId: string, matchesTotal: number, matchesRemaining: number, reason: string) {
    const safeTotal = Math.max(0, matchesTotal);
    const safeRemaining = Math.max(0, Math.min(matchesRemaining, safeTotal));
    await supabase.from('player_suspensions')
      .update({ matches_total: safeTotal, matches_remaining: safeRemaining, reason })
      .eq('id', suspensionId);
    setSuspensions(prev => prev.map(s => s.id === suspensionId
      ? { ...s, matches_total: safeTotal, matches_remaining: safeRemaining, reason }
      : s));
  }

  function getLineupForFixture(fixtureId: string, teamId: string): MatchLineup[] {
    return lineups.filter(l => l.fixture_id === fixtureId && l.team_id === teamId);
  }

  async function setLineupStatus(fixtureId: string, teamId: string, playerId: string, status: LineupStatus) {
    const existing = lineups.find(l => l.fixture_id === fixtureId && l.player_id === playerId);
    if (existing) {
      const { data } = await supabase.from('match_lineups')
        .update({ status })
        .eq('id', existing.id)
        .select()
        .single();
      setLineups(prev => prev.map(l => l.id === existing.id
        ? { ...l, status, player: players.find(p => p.id === playerId) }
        : l));
    } else {
      const { data } = await supabase.from('match_lineups')
        .insert({ fixture_id: fixtureId, team_id: teamId, player_id: playerId, status })
        .select()
        .single();
      if (data) {
        setLineups(prev => [...prev, { ...data, player: players.find(p => p.id === playerId) }]);
      }
    }
  }

  const refreshSponsors = useCallback(async () => {
    const { data } = await supabase.from('sponsors').select('*').order('created_at', { ascending: false });
    if (data) setSponsors(data);
  }, []);

  const refreshGallery = useCallback(async () => {
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    if (data) setGalleryItems(data);
  }, []);

  async function addGalleryItem(imageUrl: string, caption: string, category: string) {
    const { data } = await supabase.from('gallery').insert({ image_url: imageUrl, caption: caption || null, category }).select().single();
    if (data) setGalleryItems(prev => [data, ...prev]);
  }

  async function deleteGalleryItem(id: string) {
    await supabase.from('gallery').delete().eq('id', id);
    setGalleryItems(prev => prev.filter(g => g.id !== id));
  }

  async function submitSponsorApplication(formData: { company_name: string; logo_url: string; sponsor_amount: number; contact_name: string; contact_email: string; contact_phone: string }) {
    const { error } = await supabase.from('sponsors').insert({ ...formData, status: 'pending' });
    if (error) throw error;
  }

  async function approveSponsor(id: string, category: SponsorCategory) {
    await supabase.from('sponsors').update({ status: 'approved', category }).eq('id', id);
    setSponsors(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' as const, category } : s));
  }

  async function rejectSponsor(id: string) {
    await supabase.from('sponsors').update({ status: 'rejected' }).eq('id', id);
    setSponsors(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' as const } : s));
  }

  async function deleteSponsor(id: string) {
    await supabase.from('sponsors').delete().eq('id', id);
    setSponsors(prev => prev.filter(s => s.id !== id));
  }

  // Password management
  const refreshPasswordResetRequests = useCallback(async () => {
    const { data } = await supabase
      .from('password_reset_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPasswordResetRequests(data);
  }, []);

  async function requestPasswordReset(email: string) {
    await supabase.from('password_reset_requests').insert({ email, status: 'pending' });
  }

  async function changeUserPassword(userId: string, newPassword: string): Promise<{ error: string | null }> {
    // Calls Supabase Admin API via an Edge Function or uses the service-role client.
    // Since client-side JS cannot use admin.updateUserById, we call the dedicated edge function.
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { error: 'Oturum bulunamadı.' };

    const supabaseUrl = (supabase as any).supabaseUrl as string;
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, newPassword }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.error || 'Şifre güncellenemedi.' };
    }
    return { error: null };
  }

  async function resolvePasswordResetRequest(id: string) {
    await supabase
      .from('password_reset_requests')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id);
    setPasswordResetRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'resolved' as const, resolved_at: new Date().toISOString() } : r)
    );
  }

  async function deletePasswordResetRequest(id: string) {
    await supabase.from('password_reset_requests').delete().eq('id', id);
    setPasswordResetRequests(prev => prev.filter(r => r.id !== id));
  }

  return (
    <AppContext.Provider value={{
      user, loading, isDataLoading, userApprovalStatus, signIn, signUp, signOut,
      userRole, managedTeamId, isSuperAdmin, isScorekeeper, isTeamManager, canManageSuspensions,
      tournaments, selectedTournament, setSelectedTournament,
      teams, fixtures, matches, matchEvents, standings, players, penalties, suspensions, lineups, systemUsers, teamApplications, sponsors, galleryItems,
      refreshData, refreshUsers, refreshApplications, refreshSponsors, refreshGallery,
      addTournament, archiveTournament, activateTournament, deleteTournament, updateTournamentRules,
      addTeam, approveTeam, rejectTeam, deleteTeam,
      addPlayer, updatePlayer, deletePlayer,
      generateAutoFixture, addManualFixture, updateFixtureDate, deleteFixture, resetTournamentData,
      startMatch, pauseMatch, resumeMatch, endMatch,
      addMatchEvent, deleteMatchEvent, setYoutubeStream, addPenaltyPoints, setForfeit, updateMatchScore, assignRole, updateUserRole, deleteSystemUser,
      approveUser, rejectUser,
      addSuspension, reduceSuspension, removeSuspension, updateSuspension, getLineupForFixture, setLineupStatus,
      applyForTeam, approveApplication, rejectApplication,
      submitSponsorApplication, approveSponsor, rejectSponsor, deleteSponsor,
      addGalleryItem, deleteGalleryItem,
      passwordResetRequests, refreshPasswordResetRequests, requestPasswordReset,
      changeUserPassword, resolvePasswordResetRequest, deletePasswordResetRequest,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
