import React from 'react';
import Calendar from './components/Calendar';
import { Calendar as CalendarIcon, Moon, Sun } from 'lucide-react';
import { useDarkMode } from './hooks/useDarkMode';

function App() {
  const { isDark, toggleDark } = useDarkMode();

  return (
    <div className="min-h-screen transition-all duration-300 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-tokyo-bg dark:via-tokyo-bgDark dark:to-tokyo-terminal">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-blue-600 dark:bg-tokyo-blue rounded-full shadow-lg dark:shadow-tokyo-blue/20">
                <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            <button
              onClick={toggleDark}
              className="mt-2 sm:mt-0 sm:ml-4 p-2 sm:p-3 rounded-full bg-gray-200 dark:bg-tokyo-bgHighlight hover:bg-gray-300 dark:hover:bg-tokyo-borderBright transition-all duration-200 group"
            >
              {isDark ? (
                <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-tokyo-yellow group-hover:animate-pulse" />
              ) : (
                <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-blue-600" />
              )}
            </button>
          </div>
          <p className="text-gray-600 dark:text-tokyo-fgDark text-sm sm:text-lg max-w-2xl mx-auto px-4">
            Gestiona tus días de trabajo, controla tus ingresos y realiza el seguimiento de pagos de forma sencilla y visual.
          </p>
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