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
    </div>
  );
}

export default App;