export type TournamentStatus = 'active' | 'archived';

export interface Tournament {
  id: string;
  name: string;
  season: string;
  status: TournamentStatus;
  win_points: number;
  draw_points: number;
  loss_points: number;
  rules_text: string;
  created_at: string;
}

export type TeamStatus = 'pending' | 'approved' | 'rejected';

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  manager_name: string | null;
  status: TeamStatus;
  logo_url?: string | null;
  jersey_color?: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  jersey_number: number | null;
  position: string | null;
  hospital: string | null;
  department: string | null;
  phone: string | null;
  photo_url: string | null;
  tc_no: string | null;
  created_at: string;
}

export type FixtureStatus = 'scheduled' | 'live' | 'completed' | 'cancelled' | 'forfeit';

export interface Fixture {
  id: string;
  tournament_id: string;
  week: number;
  home_team_id: string;
  away_team_id: string;
  match_date: string | null;
  venue: string | null;
  status: FixtureStatus;
  created_at: string;
  home_team?: Team;
  away_team?: Team;
  match?: Match;
}

export type MatchStatus = 'scheduled' | 'live' | 'paused' | 'completed' | 'cancelled';

export interface Match {
  id: string;
  fixture_id: string;
  home_score: number;
  away_score: number;
  status: MatchStatus;
  timer_seconds: number;
  timer_running: boolean;
  youtube_stream_id: string | null;
  player_of_the_match: string | null;
  created_at: string;
}

export type EventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'var_review' | 'penalty' | 'penalty_missed';

export interface MatchEvent {
  id: string;
  match_id: string;
  event_type: EventType;
  player_id: string | null;
  assist_player_id: string | null;
  minute: number;
  details: string | null;
  created_at: string;
  player?: Player;
  assist_player?: Player;
}

export interface Standing {
  id: string;
  tournament_id: string;
  team_id: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  penalty_points: number;
  points: number;
  created_at: string;
  team?: Team;
}

export type UserRole = 'super_admin' | 'scorekeeper' | 'team_manager' | 'user';

export type UserApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  team_id: string | null;
  status: UserApprovalStatus;
  created_at: string;
}

export interface Penalty {
  id: string;
  tournament_id: string;
  team_id: string;
  points: number;
  reason: string;
  created_by: string;
  created_at: string;
  team?: Team;
}

export interface PlayerSuspension {
  id: string;
  tournament_id: string;
  player_id: string;
  team_id: string;
  reason: string;
  matches_total: number;
  matches_remaining: number;
  match_id: string | null;
  is_auto: boolean;
  created_at: string;
  player?: Player;
  team?: Team;
}

export type LineupStatus = 'starter' | 'substitute' | 'unavailable';

export interface MatchLineup {
  id: string;
  fixture_id: string;
  team_id: string;
  player_id: string;
  status: LineupStatus;
  created_at: string;
  player?: Player;
}

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  team_id: string | null;
}

export interface SystemUser {
  id: string;
  email: string;
  role: UserRole | null;
  team_id: string | null;
  status: UserApprovalStatus;
  created_at: string;
}

export interface TeamApplication {
  id: string;
  user_id: string;
  tournament_id: string;
  team_name: string;
  department: string | null;
  phone: string | null;
  logo_url?: string | null;
  jersey_color?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_email?: string;
}

export type SponsorCategory = 'Ana Sponsor' | 'Altın Sponsor' | 'Gümüş Sponsor' | 'Destek Sponsoru';
export type SponsorStatus = 'pending' | 'approved' | 'rejected';

export interface Sponsor {
  id: string;
  company_name: string;
  logo_url: string;
  sponsor_amount: number;
  contact_name: string | null;
  contact_email: string;
  contact_phone: string;
  status: SponsorStatus;
  category: SponsorCategory | null;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  image_url: string;
  caption: string | null;
  category: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface PasswordResetRequest {
  id: string;
  email: string;
  status: 'pending' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}
