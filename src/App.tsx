import React, { useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { BarChart2, Calendar, Users } from 'lucide-react';
import CalendarPage from './pages/CalendarPage';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ` +
    (isActive
      ? 'bg-tokyo-blue text-white'
      : 'text-tokyo-fgDark hover:bg-tokyo-bgHighlight hover:text-tokyo-fg');


  return (
    <div className="min-h-screen bg-tokyo-bgDark font-sans">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center pt-8 sm:pt-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-tokyo-blue to-tokyo-cyan">
            Control de Jornadas
          </h1>
        </header>

        <nav className="mt-6 sm:mt-8 mb-8 flex justify-center">
          <div className="flex space-x-2 sm:space-x-4 bg-tokyo-bg p-2 rounded-xl border border-tokyo-border">
            <NavLink to="/calendar" className={navLinkClasses}>
              <Calendar size={18} />
              Calendario
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClasses}>
              <BarChart2 size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/clients" className={navLinkClasses}>
              <Users size={18} />
              Clientes
            </NavLink>
          </div>
        </nav>

        <main className="pb-8">
          <Routes>
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;