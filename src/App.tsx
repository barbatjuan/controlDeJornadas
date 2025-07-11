import React, { useEffect } from 'react';
import Calendar from './components/Calendar';

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-tokyo-bgDark font-sans">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <main className="py-8">
          <Calendar />
        </main>
        </div>

        {/* Calendar */}
        <Calendar />

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-12 text-gray-500 dark:text-tokyo-comment">
          <p className="text-sm">
            Desarrollado con <span className="text-red-500 dark:text-tokyo-red animate-pulse">❤️</span> para profesionales independientes
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;