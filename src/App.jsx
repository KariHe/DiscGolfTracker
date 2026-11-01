import { Link, Outlet, Route, Routes } from 'react-router'
import Home from './views/Home.jsx'
import Round from './views/Round.jsx'
import RoundStart from './views/RoundStart.jsx'
import Courses from './views/Courses.jsx'
import CourseDetail from './views/CourseDetail.jsx'
import Players from './views/Players.jsx'
import History from './views/History.jsx'
import HistoryDetail from './views/HistoryDetail.jsx'

function Layout() {
  return (
    <>
      <nav className="app-nav">
        <Link to="/">Home</Link>
        <Link to="/courses">Courses</Link>
        <Link to="/players">Players</Link>
        <Link to="/history">History</Link>
      </nav>
      <Outlet />
    </>
  )
}

export default function App() {
  return (
    <div id="root-app">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/round/new" element={<RoundStart />} />
          <Route path="/round" element={<Round />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/players" element={<Players />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:roundId" element={<HistoryDetail />} />
        </Route>
      </Routes>
    </div>
  )
}
