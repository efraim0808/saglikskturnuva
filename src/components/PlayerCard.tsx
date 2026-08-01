import { useEffect } from 'react';
import { useApp } from '../AppContext';
import { X, User } from 'lucide-react';
import { cn } from '../lib/utils';

const POSITION_ABBR: Record<string, string> = {
  'Kaleci': 'KL',
  'Defans': 'DF',
  'Orta Saha': 'OS',
  'Forvet': 'FV',
};

function calcRating(goals: number, assists: number, potm: number, yellows: number, reds: number): number {
  const r = 50 + Math.min(goals * 4, 32) + Math.min(assists * 2, 12) + potm * 6 - yellows * 2 - reds * 8;
  return Math.max(40, Math.min(99, r));
}

type Tier = 'gold' | 'silver' | 'bronze';

function getTier(rating: number): Tier {
  if (rating >= 80) return 'gold';
  if (rating >= 65) return 'silver';
  return 'bronze';
}

const TIER_STYLES: Record<Tier, {
  card: string;
  text: string;
  subtext: string;
  stat: string;
  statBorder: string;
  shine: string;
  badge: string;
  divider: string;
  glow: string;
  photoBorder: string;
  photoBg: string;
}> = {
  gold: {
    card: 'from-amber-300 via-yellow-100 to-amber-400',
    text: 'text-amber-950',
    subtext: 'text-amber-800',
    stat: 'bg-amber-500/10',
    statBorder: 'border-amber-600/25',
    shine: 'from-white/50 via-white/10 to-transparent',
    badge: 'bg-amber-600 text-amber-50',
    divider: 'bg-amber-600/20',
    glow: 'bg-amber-400',
    photoBorder: 'border-amber-600/50',
    photoBg: 'bg-amber-200/40',
  },
  silver: {
    card: 'from-slate-300 via-slate-100 to-slate-400',
    text: 'text-slate-800',
    subtext: 'text-slate-600',
    stat: 'bg-slate-500/10',
    statBorder: 'border-slate-500/25',
    shine: 'from-white/50 via-white/10 to-transparent',
    badge: 'bg-slate-500 text-slate-50',
    divider: 'bg-slate-500/20',
    glow: 'bg-slate-400',
    photoBorder: 'border-slate-500/40',
    photoBg: 'bg-slate-300/40',
  },
  bronze: {
    card: 'from-orange-400 via-amber-200 to-orange-600',
    text: 'text-orange-950',
    subtext: 'text-orange-800',
    stat: 'bg-orange-600/10',
    statBorder: 'border-orange-700/25',
    shine: 'from-white/40 via-white/10 to-transparent',
    badge: 'bg-orange-700 text-orange-50',
    divider: 'bg-orange-800/20',
    glow: 'bg-orange-500',
    photoBorder: 'border-orange-700/50',
    photoBg: 'bg-orange-300/40',
  },
};

interface PlayerCardProps {
  playerId: string;
  onClose: () => void;
}

export function PlayerCard({ playerId, onClose }: PlayerCardProps) {
  const { players, matchEvents, matches, teams } = useApp();

  const player = players.find(p => p.id === playerId);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!player) return null;

  const team = teams.find(t => t.id === player.team_id);

  const goals   = matchEvents.filter(e => e.event_type === 'goal'        && e.player_id === playerId).length;
  const assists  = matchEvents.filter(e => e.event_type === 'goal'        && e.assist_player_id === playerId).length;
  const potm    = matches.filter(m => m.player_of_the_match === playerId).length;
  const yellows  = matchEvents.filter(e => e.event_type === 'yellow_card' && e.player_id === playerId).length;
  const reds    = matchEvents.filter(e => e.event_type === 'red_card'     && e.player_id === playerId).length;

  const rating  = calcRating(goals, assists, potm, yellows, reds);
  const tier    = getTier(rating);
  const s       = TIER_STYLES[tier];
  const posAbbr = player.position
    ? (POSITION_ABBR[player.position] ?? player.position.substring(0, 2).toUpperCase())
    : 'FK';

  const stats = [
    { label: 'GOL',  value: goals },
    { label: 'AST',  value: assists },
    { label: 'POTM', value: potm },
    { label: 'KRT',  value: yellows + reds },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative" onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── FIFA CARD ──────────────────────────────────────── */}
        <div
          className={cn(
            'relative w-80 rounded-3xl bg-gradient-to-br shadow-2xl overflow-hidden select-none',
            s.card
          )}
        >
          {/* Shine */}
          <div className={cn(
            'absolute inset-0 bg-gradient-to-br pointer-events-none',
            s.shine
          )} />

          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 0)', backgroundSize: '18px 18px' }}
          />

          <div className="relative flex flex-col gap-0 p-5">

            {/* ── TOP ROW: rating + tier badge ───────────────── */}
            <div className="flex items-start justify-between mb-1">
              <div className="flex flex-col items-center leading-none">
                <span className={cn('text-6xl font-black tabular-nums leading-none', s.text)}>
                  {rating}
                </span>
                <span className={cn('text-sm font-bold tracking-widest mt-1', s.subtext)}>
                  {posAbbr}
                </span>
              </div>
              <span className={cn('text-xs font-black px-3 py-1 rounded-full tracking-widest uppercase shadow-sm', s.badge)}>
                {tier === 'gold' ? 'GOLD' : tier === 'silver' ? 'SILVER' : 'BRONZE'}
              </span>
            </div>

            {/* ── PHOTO ──────────────────────────────────────── */}
            <div className="flex justify-center my-3">
              <div className={cn(
                'w-36 h-36 rounded-full border-4 overflow-hidden flex items-center justify-center shadow-lg',
                s.photoBorder,
                s.photoBg,
              )}>
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className={cn('w-20 h-20 opacity-40', s.text)} strokeWidth={1} />
                )}
              </div>
            </div>

            {/* ── NAME + TEAM ─────────────────────────────────── */}
            <div className="text-center px-2 mb-4">
              <div className={cn('text-2xl font-black tracking-wider leading-tight uppercase', s.text)}>
                {player.name}
              </div>
              {(team || player.position) && (
                <div className={cn('text-sm font-semibold mt-1.5 flex items-center justify-center gap-2', s.subtext)}>
                  {team?.name}
                  {team && player.position && <span className="opacity-40">·</span>}
                  {player.position && <span>{player.position}</span>}
                </div>
              )}
            </div>

            {/* ── DIVIDER ─────────────────────────────────────── */}
            <div className={cn('h-px mx-0 mb-4', s.divider)} />

            {/* ── STATS ROW ───────────────────────────────────── */}
            <div className="flex items-stretch">
              {stats.map((stat, i) => (
                <div key={stat.label} className="flex-1 flex flex-col items-center gap-1 relative">
                  {/* Vertical divider (between columns) */}
                  {i > 0 && (
                    <div className={cn('absolute left-0 top-1 bottom-1 w-px', s.divider)} />
                  )}
                  <span className={cn('text-4xl font-black tabular-nums leading-none', s.text)}>
                    {stat.value}
                  </span>
                  <span className={cn('text-[11px] font-bold tracking-widest', s.subtext)}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Glow behind card */}
        <div className={cn(
          'absolute inset-4 -z-10 blur-3xl opacity-50 rounded-3xl',
          s.glow
        )} />
      </div>
    </div>
  );
}

/** Inline clickable player name that triggers the FIFA card */
export function PlayerName({ playerId, name, className }: { playerId: string; name: string; className?: string }) {
  return (
    <button
      className={cn(
        'underline decoration-dotted underline-offset-2 decoration-current/40 hover:decoration-solid cursor-pointer transition-all font-medium',
        className
      )}
      onClick={e => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('open-player-card', { detail: { playerId } }));
      }}
    >
      {name}
    </button>
  );
}
