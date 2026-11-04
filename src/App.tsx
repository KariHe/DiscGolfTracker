import { Outlet, Route, Routes } from 'react-router'
import Box from '@mui/material/Box'
import Home from './views/Home.tsx'
import Round from './views/Round.tsx'
import RoundStart from './views/RoundStart.tsx'
import Courses from './views/Courses.tsx'
import CourseDetail from './views/CourseDetail.tsx'
import Players from './views/Players.tsx'
import History from './views/History.tsx'
import HistoryDetail from './views/HistoryDetail.tsx'
import { TabBar } from './components/TabBar.tsx'
import { AppThemeProvider } from './theme/AppThemeProvider.tsx'
import { I18nProvider } from './i18n/I18nProvider.tsx'

function Layout() {
  return (
    // Fixed-height shell: only the content area scrolls, the tab bar stays put.
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          px: 2,
          pt: 2,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Outlet />
      </Box>
      <TabBar />
    </Box>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AppThemeProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/players" element={<Players />} />
            <Route path="/history" element={<History />} />
            <Route path="/round/new" element={<RoundStart />} />
            <Route path="/round" element={<Round />} />
            <Route path="/history/:roundId" element={<HistoryDetail />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
          </Route>
        </Routes>
      </AppThemeProvider>
    </I18nProvider>
  )
}
