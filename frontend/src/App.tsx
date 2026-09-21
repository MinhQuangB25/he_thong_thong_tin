import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { AppShell, type Screen } from './components/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { LeavePage } from './pages/LeavePage'
import { AttendancePage } from './pages/AttendancePage'
import { PayrollPage } from './pages/PayrollPage'

export default function App() { const { user } = useAuth(); const [screen, setScreen] = useState<Screen>('dashboard'); if (!user) return <LoginPage />; const page = screen === 'dashboard' ? <DashboardPage onNavigate={setScreen} /> : screen === 'employees' ? <EmployeesPage /> : screen === 'leave' ? <LeavePage /> : screen === 'attendance' ? <AttendancePage /> : <PayrollPage />; return <AppShell screen={screen} onNavigate={setScreen}>{page}</AppShell> }
