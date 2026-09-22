import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { AppShell, type Screen } from './components/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AdminPage } from './pages/AdminPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { LeavePage } from './pages/LeavePage'
import { AttendancePage } from './pages/AttendancePage'
import { PayrollPage } from './pages/PayrollPage'
import { ReportsPage } from './pages/ReportsPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() { const { user } = useAuth(); const [screen, setScreen] = useState<Screen>('dashboard'); const isAdmin = user?.roles.includes('ADMIN') ?? false; useEffect(() => { setScreen(isAdmin ? 'admin' : 'dashboard') }, [user?.username, isAdmin]); if (!user) return <LoginPage />; const activeScreen: Screen = isAdmin ? 'admin' : screen === 'admin' ? 'dashboard' : screen; const page = activeScreen === 'dashboard' ? <DashboardPage onNavigate={setScreen} /> : activeScreen === 'admin' ? <AdminPage /> : activeScreen === 'employees' ? <EmployeesPage /> : activeScreen === 'leave' ? <LeavePage /> : activeScreen === 'attendance' ? <AttendancePage /> : activeScreen === 'payroll' ? <PayrollPage /> : activeScreen === 'reports' ? <ReportsPage /> : <ProfilePage />; return <AppShell screen={activeScreen} onNavigate={setScreen}>{page}</AppShell> }
