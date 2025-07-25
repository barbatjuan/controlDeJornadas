import React, { useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { BarChart2, Calendar, Users, FolderKanban, RefreshCw, LogIn, LogOut } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import CalendarPage from './pages/CalendarPage';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import RecurringInvoices from './pages/RecurringInvoices';

function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ` +
    (isActive
      ? 'bg-tokyo-blue text-white'
      : 'text-tokyo-fgDark hover:bg-tokyo-bgHighlight hover:text-tokyo-fg');


  if (isLoading) {
    return (
      <div className="min-h-screen bg-tokyo-bgDark font-sans flex items-center justify-center text-white">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tokyo-bgDark font-sans">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center pt-8 sm:pt-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-tokyo-blue to-tokyo-cyan">
            Gestión de Proyectos
          </h1>
        </header>

        <nav className="mt-6 sm:mt-8 mb-8 flex justify-center items-center gap-4">
          {isAuthenticated && (
            <div className="flex flex-wrap justify-center space-x-2 sm:space-x-4 bg-tokyo-bg p-2 rounded-xl border border-tokyo-border">
              <NavLink to="/calendar" className={navLinkClasses}>
                <Calendar size={18} />
                <span className="hidden sm:inline">Calendario</span>
              </NavLink>
              <NavLink to="/dashboard" className={navLinkClasses}>
                <BarChart2 size={18} />
                <span className="hidden sm:inline">Dashboard</span>
              </NavLink>
              <NavLink to="/projects" className={navLinkClasses}>
                <FolderKanban size={18} />
                <span className="hidden sm:inline">Proyectos</span>
              </NavLink>
              <NavLink to="/recurring" className={navLinkClasses}>
                <RefreshCw size={18} />
                <span className="hidden sm:inline">Recurrentes</span>
              </NavLink>
              <NavLink to="/clients" className={navLinkClasses}>
                <Users size={18} />
                <span className="hidden sm:inline">Clientes</span>
              </NavLink>
            </div>
          )}
          {!isAuthenticated ? (
            <button onClick={() => loginWithRedirect()} className={`${navLinkClasses({ isActive: false })} bg-tokyo-bg p-2 rounded-xl border border-tokyo-border`}>
              <LogIn size={18} />
              <span className="hidden sm:inline">Iniciar Sesión</span>
            </button>
          ) : (
            <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} className={`${navLinkClasses({ isActive: false })} bg-tokyo-bg p-2 rounded-xl border border-tokyo-border`}>
              <LogOut size={18} />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          )}
        </nav>

        <main className="pb-8">
          {isAuthenticated ? (
            <Routes>
              <Route path="/" element={<Navigate to="/calendar" replace />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/recurring" element={<RecurringInvoices />} />
              <Route path="/clients" element={<Clients />} />
            </Routes>
          ) : (
            <div className="text-center text-tokyo-fg p-8 bg-tokyo-bg rounded-xl border border-tokyo-border">
              <h2 class="text-2xl font-bold mb-4">Bienvenido a la Gestión de Proyectos</h2>
              <p>Por favor, inicia sesión para acceder a tus herramientas de gestión.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;