import { Link, Outlet, Route, Routes } from 'react-router'
import Home from './views/Home.tsx'
import Round from './views/Round.tsx'
import RoundStart from './views/RoundStart.tsx'
import Courses from './views/Courses.tsx'
import CourseDetail from './views/CourseDetail.tsx'
import Players from './views/Players.tsx'
import History from './views/History.tsx'
import HistoryDetail from './views/HistoryDetail.tsx'

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
