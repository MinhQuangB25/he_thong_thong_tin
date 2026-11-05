import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { AppShell, type Screen } from './components/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AdminPage } from './pages/AdminPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { ContractsPage } from './pages/ContractsPage'
import { LeavePage } from './pages/LeavePage'
import { AttendancePage } from './pages/AttendancePage'
import { PayrollPage } from './pages/PayrollPage'
import { ReportsPage } from './pages/ReportsPage'
import { ProfilePage } from './pages/ProfilePage'
import { AssistantPage } from './pages/AssistantPage'

export default function App() {
  const { user } = useAuth()
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [openEmployeeForm, setOpenEmployeeForm] = useState(false)
  const isAdmin = user?.roles.includes('ADMIN') ?? false
  useEffect(() => { setScreen(isAdmin ? 'admin' : 'dashboard'); setOpenEmployeeForm(false) }, [user?.username, isAdmin])
  if (!user) return <LoginPage />
  const navigate = (next: Screen) => { setOpenEmployeeForm(false); setScreen(next) }
  const addEmployee = () => { setOpenEmployeeForm(true); setScreen('employees') }
  const activeScreen: Screen = isAdmin && screen === 'dashboard' ? 'admin' : !isAdmin && screen === 'admin' ? 'dashboard' : screen
  const page = activeScreen === 'dashboard' ? <DashboardPage onNavigate={navigate} onAddEmployee={addEmployee} />
    : activeScreen === 'admin' ? <AdminPage />
    : activeScreen === 'employees' ? <EmployeesPage openForm={openEmployeeForm} />
    : activeScreen === 'contracts' ? <ContractsPage />
    : activeScreen === 'leave' ? <LeavePage />
    : activeScreen === 'attendance' ? <AttendancePage />
    : activeScreen === 'payroll' ? <PayrollPage />
    : activeScreen === 'reports' ? <ReportsPage />
    : activeScreen === 'assistant' ? <AssistantPage />
    : <ProfilePage />
  return <AppShell screen={activeScreen} onNavigate={navigate}>{page}</AppShell>
}
