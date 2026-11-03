import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Home from "./pages/Dashboard/Home";
import TicketsPage from "./pages/Tickets";
import UsersPage from "./pages/Users";
import MembersPage from "./pages/Members";
import PlayersPage from "./pages/Players";
import TeamsPage from "./pages/Teams";
import WarsPage from "./pages/Wars";
import SeasonsPage from "./pages/Seasons";
import SettingsPage from "./pages/Settings";
import BotMonitorPage from "./pages/BotMonitor";
import ChannelsPage from "./pages/Channels";
import RolesPage from "./pages/Roles";
import RecordsPage from "./pages/Records";
import ShipsPage from "./pages/Ships";
import StandaloneTranscriptPage from "./pages/Transcript";
import { NotificationProvider } from "./context/NotificationContext";

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ScrollToTop />
        <Routes>
          {/* Protected Dashboard Layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index path="/" element={<Home />} />
            <Route path="/bot-monitor" element={<BotMonitorPage />} />
            <Route path="/channels" element={<ChannelsPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/ships" element={<ShipsPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/wars" element={<WarsPage />} />
            <Route path="/seasons" element={<SeasonsPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Public Standalone Transcript Page */}
          <Route path="/transcript/:ticketId" element={<StandaloneTranscriptPage />} />

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
