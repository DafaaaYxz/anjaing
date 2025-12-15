import React from 'react';
import { Page, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  user: User | null;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, user, onNavigate, onLogout }) => {
  if (currentPage === Page.BOOT) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col bg-core-black text-gray-200 selection:bg-core-blue selection:text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-core-black/90 backdrop-blur border-b border-core-blue/30 shadow-lg shadow-blue-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold font-mono text-core-blue tracking-tighter cursor-pointer" onClick={() => onNavigate(Page.HOME)}>
                DevCORE<span className="animate-pulse">_</span>
              </span>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4 font-mono text-sm">
                <button 
                  onClick={() => onNavigate(Page.HOME)}
                  className={`px-3 py-2 rounded-md transition-colors ${currentPage === Page.HOME ? 'text-white bg-core-blue/20' : 'text-gray-400 hover:text-core-blue'}`}
                >
                  HOME
                </button>
                
                {user ? (
                   <>
                     <button 
                      onClick={() => onNavigate(Page.TERMINAL)}
                      className={`px-3 py-2 rounded-md transition-colors ${currentPage === Page.TERMINAL ? 'text-white bg-core-blue/20' : 'text-gray-400 hover:text-core-blue'}`}
                    >
                      TERMINAL
                    </button>
                    <button 
                      onClick={() => onNavigate(Page.HISTORY)}
                      className={`px-3 py-2 rounded-md transition-colors ${currentPage === Page.HISTORY ? 'text-white bg-core-blue/20' : 'text-gray-400 hover:text-core-blue'}`}
                    >
                      HISTORY
                    </button>
                    {user.isAdmin && (
                      <button 
                        onClick={() => onNavigate(Page.ADMIN)}
                        className={`px-3 py-2 rounded-md transition-colors text-red-400 hover:text-red-300 border border-red-900/50 bg-red-950/20`}
                      >
                        DEV_CONSOLE
                      </button>
                    )}
                   </>
                ) : null}

                <button 
                  onClick={() => onNavigate(Page.ABOUT)}
                  className={`px-3 py-2 rounded-md transition-colors ${currentPage === Page.ABOUT ? 'text-white bg-core-blue/20' : 'text-gray-400 hover:text-core-blue'}`}
                >
                  ABOUT
                </button>
                 <button 
                  onClick={() => onNavigate(Page.TESTIMONI)}
                  className={`px-3 py-2 rounded-md transition-colors ${currentPage === Page.TESTIMONI ? 'text-white bg-core-blue/20' : 'text-gray-400 hover:text-core-blue'}`}
                >
                  TESTIMONI
                </button>

                {user ? (
                  <button onClick={onLogout} className="px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-md border border-red-500/30 ml-4">
                    LOGOUT
                  </button>
                ) : (
                   <button onClick={() => onNavigate(Page.LOGIN)} className="px-3 py-2 text-core-blue hover:bg-core-blue/10 rounded-md border border-core-blue/30 ml-4">
                    LOGIN
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8 relative">
        {children}
      </main>
    </div>
  );
};
