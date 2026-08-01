import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Standings } from './pages/Standings';
import { Fixtures } from './pages/Fixtures';
import { Live } from './pages/Live';
import { Stats } from './pages/Stats';
import { AdminTeams } from './pages/AdminTeams';
import { AdminFixtures } from './pages/AdminFixtures';
import { AdminPenalties } from './pages/AdminPenalties';
import { AdminTournaments } from './pages/AdminTournaments';
import { TeamPlayers } from './pages/TeamPlayers';
import { Suspensions } from './pages/Suspensions';
import { AdminUsers } from './pages/AdminUsers';
import { TournamentApplication } from './pages/TournamentApplication';
import { Sponsors } from './pages/Sponsors';
import { Gallery } from './pages/Gallery';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Standings />} />
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/live" element={<Live />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/teams" element={<AdminTeams />} />
            <Route path="/admin/fixtures" element={<AdminFixtures />} />
            <Route path="/admin/penalties" element={<AdminPenalties />} />
            <Route path="/admin/tournaments" element={<AdminTournaments />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/team/players" element={<TeamPlayers />} />
            <Route path="/suspensions" element={<Suspensions />} />
            <Route path="/apply" element={<TournamentApplication />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
