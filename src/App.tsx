import React, { useEffect } from 'react';
import Calendar from './components/Calendar';

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-tokyo-bgDark font-sans">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center py-8 sm:py-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-tokyo-blue to-tokyo-cyan">
            Control de Jornadas
          </h1>
        </header>
        <main>
          <Calendar />
        </main>
      </div>
    </div>
  );
}

export default App;