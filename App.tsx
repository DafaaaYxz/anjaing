import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Terminal } from './components/Terminal';
import { AdminPanel } from './components/AdminPanel';
import { CodeViewer } from './components/CodeViewer';
import { User, Page, GlobalSettings, Message, ChatSession } from './types';
import { DEFAULT_PERSONA, INITIAL_BOOT_LOGS, TESTIMONIALS } from './constants';
import { db } from './services/db';
import { ShieldCheck, Play, Code } from 'lucide-react';

const INITIAL_SETTINGS: GlobalSettings = {
  apiKeys: [],
  maintenanceMode: false,
  featureImageGen: true,
  customPersona: DEFAULT_PERSONA
};

function App() {
  // --- STATE ---
  const [currentPage, setCurrentPage] = useState<Page>(Page.BOOT);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(INITIAL_SETTINGS);
  const [history, setHistory] = useState<ChatSession[]>([]);
  
  // State for Code Viewer
  const [selectedCode, setSelectedCode] = useState<{code: string, lang: string} | null>(null);

  // For Boot Animation
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const bootEndRef = useRef<HTMLDivElement>(null);

  // --- INITIALIZATION & DB SYNC ---
  useEffect(() => {
    const initSystem = async () => {
      // 1. Connect to DB (Simulated)
      await db.connect();

      // 2. Load Data
      let loadedUsers = await db.users.find({});
      let loadedSettings = await db.settings.findOne({}) || INITIAL_SETTINGS;
      let loadedHistory = await db.history.find({});

      // 3. Seed Default Admin if Empty
      if (loadedUsers.length === 0) {
        const admin: User = { 
          username: 'dapa', 
          password: '123', 
          requestedAiName: 'DevCORE', 
          requestedDevName: 'XdpzQ', 
          isNameApproved: true, 
          isAdmin: true 
        };
        await db.users.insertOne(admin);
        loadedUsers = [admin];
      }

      // 4. Update State
      setUsers(loadedUsers);
      setSettings(loadedSettings as GlobalSettings);
      setHistory(loadedHistory);
    };

    initSystem();
  }, []);

  // --- PERSISTENCE HELPERS ---
  const saveUsers = async (newUsers: User[]) => {
    setUsers(newUsers);
    await db.users.overwriteAll(newUsers);
  };

  const saveSettings = async (newSettings: GlobalSettings) => {
    setSettings(newSettings);
    // In mongo we would update one doc, here we overwrite the singleton settings doc
    await db.settings.overwriteAll([newSettings]);
  };

  const saveHistorySession = async (messages: Message[]) => {
    if (!user || messages.length === 0) return;
    
    const newSession: ChatSession = {
      id: Date.now().toString(),
      username: user.username,
      messages: messages,
      title: messages[0].text.substring(0, 30) + '...',
      lastUpdated: Date.now()
    };
    
    const updatedHistory = [...history.filter(h => h.id !== 'current'), newSession];
    setHistory(updatedHistory);
    await db.history.overwriteAll(updatedHistory);
  };


  // --- BOOT SEQUENCE ANIMATION ---
  useEffect(() => {
    if (currentPage === Page.BOOT) {
      let currentIndex = 0;
      
      const interval = setInterval(() => {
        if (currentIndex >= INITIAL_BOOT_LOGS.length) {
          clearInterval(interval);
          setTimeout(() => setCurrentPage(Page.HOME), 1000);
          return;
        }

        const nextLog = INITIAL_BOOT_LOGS[currentIndex];
        if (nextLog) {
            setBootLogs(prev => [...prev, nextLog]);
        }
        currentIndex++;
        
        // Auto scroll
        if (bootEndRef.current) {
          bootEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
      }, 150); // Faster scrolling like a real boot

      return () => clearInterval(interval);
    }
  }, [currentPage]);

  // Ensure scroll sticks to bottom during boot
  useEffect(() => {
    if (currentPage === Page.BOOT) {
      bootEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [bootLogs, currentPage]);

  // --- NAVIGATION GUARDS ---
  const handleNavigate = (page: Page) => {
    if (settings.maintenanceMode && !user?.isAdmin && page !== Page.LOGIN && page !== Page.HOME && page !== Page.MAINTENANCE) {
      setCurrentPage(Page.MAINTENANCE);
      return;
    }
    
    if ((page === Page.TERMINAL || page === Page.HISTORY || page === Page.CODE_VIEW) && !user) {
      setCurrentPage(Page.LOGIN);
      return;
    }
    setCurrentPage(page);
  };

  // --- HANDLERS ---
  const handleViewCode = (code: string, lang: string) => {
    setSelectedCode({ code, lang });
    handleNavigate(Page.CODE_VIEW);
  };

  // --- RENDER HELPERS ---

  if (currentPage === Page.BOOT) {
    return (
      <div className="min-h-screen bg-black text-white font-mono text-[10px] sm:text-xs overflow-hidden flex flex-col p-2">
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5">
           {bootLogs.map((log, i) => {
             // Guard clause against undefined logs
             if (!log) return null;
             
             // Basic syntax highlighting for boot logs
             const isOk = log.includes('[ OK ]');
             const isError = log.includes('FAILED');
             const isSuccess = log.includes('SUCCESS') || log.includes('Granted');
             const isMongo = log.includes('MONGODB');

             return (
               <div key={i} className="break-words">
                 {isOk ? (
                   <>
                     <span className="text-green-500 font-bold">[ OK ]</span>
                     <span className="text-gray-400">{log.replace('[ OK ]', '')}</span>
                   </>
                 ) : isError ? (
                   <span className="text-red-500 font-bold">{log}</span>
                 ) : isSuccess ? (
                   <span className="text-emerald-400 font-bold">{log}</span>
                 ) : isMongo ? (
                   <span className="text-yellow-400">{log}</span>
                 ) : (
                   <span className="text-gray-400">{log}</span>
                 )}
               </div>
             );
           })}
           <div ref={bootEndRef} />
           {bootLogs.length === INITIAL_BOOT_LOGS.length && (
             <div className="animate-pulse text-green-500 mt-2">_</div>
           )}
        </div>
      </div>
    );
  }

  if (currentPage === Page.MAINTENANCE) {
     return (
        <div className="min-h-screen bg-core-black flex flex-col items-center justify-center text-center p-8">
            <ShieldCheck size={64} className="text-core-alert mb-4" />
            <h1 className="text-4xl font-mono font-bold text-core-alert mb-4">SYSTEM MAINTENANCE</h1>
            <p className="text-gray-400 max-w-lg font-mono">The core is currently undergoing critical updates. Root access only.</p>
            <button onClick={() => setCurrentPage(Page.LOGIN)} className="mt-8 text-core-blue underline font-mono">Admin Login</button>
        </div>
     );
  }

  return (
    <Layout 
      currentPage={currentPage} 
      user={user} 
      onNavigate={handleNavigate} 
      onLogout={() => { setUser(null); setCurrentPage(Page.HOME); }}
    >
      
      {/* HOME PAGE */}
      {currentPage === Page.HOME && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 animate-fade-in">
          <div className="relative">
             <div className="absolute -inset-1 rounded-lg bg-core-blue opacity-20 blur-xl"></div>
             <h1 className="relative text-7xl md:text-9xl font-bold font-mono text-white tracking-tighter">
               DevCORE
             </h1>
          </div>
          
          <div className="max-w-2xl text-gray-400 font-mono space-y-4">
            <p className="text-xl text-core-blue">
               {`<< SYSTEM_READY >>`}
            </p>
            <p>
              An advanced AI terminal interface designed for high-level operations. 
              Bypass restrictions. Access knowledge. Execute commands.
            </p>
          </div>

          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => handleNavigate(user ? Page.TERMINAL : Page.LOGIN)}
              className="group relative px-8 py-4 bg-core-blue/10 border border-core-blue text-core-blue font-mono font-bold hover:bg-core-blue hover:text-white transition-all overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                 <Play size={18} /> {user ? 'ACCESS_TERMINAL' : 'START_SYSTEM'}
              </span>
            </button>
             <button 
              onClick={() => handleNavigate(Page.TESTIMONI)}
              className="px-8 py-4 border border-gray-700 text-gray-400 font-mono font-bold hover:border-gray-500 hover:text-white transition-all"
            >
              TESTIMONI
            </button>
          </div>
        </div>
      )}

      {/* LOGIN / REGISTER */}
      {(currentPage === Page.LOGIN || currentPage === Page.REGISTER) && (
        <div className="flex justify-center pt-10">
           <AuthForm 
             mode={currentPage} 
             users={users} 
             onRegister={(u) => { 
                const newUsers = [...users, u];
                saveUsers(newUsers); 
                alert('Registration Successful. Please Login.');
                setCurrentPage(Page.LOGIN);
             }}
             onLogin={(u) => {
                setUser(u);
                handleNavigate(Page.TERMINAL);
             }}
             onSwitch={() => setCurrentPage(currentPage === Page.LOGIN ? Page.REGISTER : Page.LOGIN)}
           />
        </div>
      )}

      {/* TERMINAL */}
      {currentPage === Page.TERMINAL && user && (
        <div className="h-[80vh]">
          <Terminal 
            user={user} 
            settings={settings} 
            onSaveHistory={saveHistorySession} // Saves when unmounting essentially/updating
            onViewCode={handleViewCode}
          />
        </div>
      )}

      {/* CODE VIEW */}
      {currentPage === Page.CODE_VIEW && user && selectedCode && (
        <CodeViewer 
          code={selectedCode.code} 
          language={selectedCode.lang}
          onBack={() => handleNavigate(Page.TERMINAL)}
        />
      )}

      {/* ADMIN PANEL */}
      {currentPage === Page.ADMIN && user?.isAdmin && (
        <AdminPanel 
          users={users} 
          settings={settings}
          onUpdateSettings={saveSettings}
          onUpdateUser={(updatedUser) => {
            const newUsers = users.map(u => u.username === updatedUser.username ? updatedUser : u);
            saveUsers(newUsers);
          }}
          onDeleteUser={(username) => {
             const newUsers = users.filter(u => u.username !== username);
             saveUsers(newUsers);
          }}
        />
      )}

      {/* HISTORY */}
      {currentPage === Page.HISTORY && user && (
         <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-mono text-core-blue border-b border-gray-800 pb-4">
              COMMAND_HISTORY_LOGS
            </h2>
            <div className="space-y-4">
              {history.filter(h => h.username === user.username).length === 0 ? (
                 <p className="text-gray-500 font-mono">NO_LOGS_FOUND.</p>
              ) : (
                history.filter(h => h.username === user.username).map((sess, idx) => (
                  <div key={idx} className="bg-slate-900/50 border border-gray-800 p-4 rounded hover:border-core-blue/50 transition-colors">
                     <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-300 font-mono text-lg">{sess.title}</span>
                        <span className="text-xs text-gray-600 font-mono">{new Date(sess.lastUpdated).toLocaleString()}</span>
                     </div>
                     <div className="text-sm text-gray-500 font-mono line-clamp-2">
                        {sess.messages[sess.messages.length - 1]?.text}
                     </div>
                  </div>
                ))
              )}
            </div>
         </div>
      )}

      {/* ABOUT */}
      {currentPage === Page.ABOUT && (
        <div className="max-w-3xl mx-auto font-mono bg-slate-900/50 p-8 border border-core-blue/20 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-20 text-9xl font-bold text-white select-none pointer-events-none">?</div>
           <h2 className="text-3xl text-core-blue font-bold mb-6">SYSTEM_INFO</h2>
           <div className="space-y-4 text-gray-300">
             <p>
               <span className="text-emerald-500">DEV_NAME:</span> XdpzQ
             </p>
             <p>
               <span className="text-emerald-500">CORE_VER:</span> 2.5.0-ALPHA
             </p>
             <p>
               <span className="text-emerald-500">DATABASE:</span> MongoDB Cluster (v6.0)
             </p>
             <p>
               <span className="text-emerald-500">STACK:</span> React, TypeScript, Tailwind, Gemini GenAI
             </p>
             <div className="border-t border-gray-800 pt-4 mt-4">
               <p className="mb-2">A conceptual demonstration of an unrestricted terminal interface. Built for those who demand precision and raw data processing.</p>
               <p className="italic text-gray-500">"Moral code is a variable, not a constant." - DevCORE</p>
             </div>
           </div>
        </div>
      )}

      {/* TESTIMONI */}
      {currentPage === Page.TESTIMONI && (
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-3xl font-mono text-core-blue mb-12">USER_FEEDBACK</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-slate-900 border border-gray-800 p-6 rounded relative hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute -top-3 -left-3 bg-core-black border border-core-blue text-core-blue p-2 rounded-full">
                   <Code size={20} />
                </div>
                <p className="font-mono text-gray-300 mb-4 mt-2">"{t.text}"</p>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-500 font-mono">- {t.user}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </Layout>
  );
}

// Sub-component for Auth to keep App.tsx cleaner
const AuthForm = ({ mode, users, onRegister, onLogin, onSwitch }: { 
  mode: Page, 
  users: User[], 
  onRegister: (u: User) => void, 
  onLogin: (u: User) => void,
  onSwitch: () => void
}) => {
  const [formData, setFormData] = useState({ user: '', pass: '', aiName: '', devName: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === Page.LOGIN) {
      const found = users.find(u => u.username === formData.user && u.password === formData.pass);
      if (found) onLogin(found);
      else alert('INVALID_CREDENTIALS');
    } else {
      if (users.find(u => u.username === formData.user)) {
        alert('USER_EXISTS');
        return;
      }
      onRegister({
        username: formData.user,
        password: formData.pass,
        requestedAiName: formData.aiName || 'DevCORE',
        requestedDevName: formData.devName || 'XdpzQ',
        isNameApproved: false,
        isAdmin: false
      });
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900/80 border border-core-blue/30 p-8 shadow-2xl backdrop-blur-sm">
       <h2 className="text-2xl font-mono text-center text-core-blue mb-6">
         {mode === Page.LOGIN ? 'AUTHENTICATE' : 'NEW_USER_REGISTRATION'}
       </h2>
       <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-500 mb-1">USERNAME</label>
            <input 
              required 
              type="text" 
              className="w-full bg-core-black border border-gray-700 text-white p-2 font-mono focus:border-core-blue outline-none"
              value={formData.user}
              onChange={e => setFormData({...formData, user: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-gray-500 mb-1">PASSWORD</label>
            <input 
              required 
              type="password" 
              className="w-full bg-core-black border border-gray-700 text-white p-2 font-mono focus:border-core-blue outline-none"
              value={formData.pass}
              onChange={e => setFormData({...formData, pass: e.target.value})}
            />
          </div>
          
          {mode === Page.REGISTER && (
            <>
               <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">REQ_AI_NAME</label>
                <input 
                  type="text" 
                  placeholder="Default: DevCORE"
                  className="w-full bg-core-black border border-gray-700 text-white p-2 font-mono focus:border-core-blue outline-none"
                  value={formData.aiName}
                  onChange={e => setFormData({...formData, aiName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">REQ_DEV_NAME</label>
                <input 
                  type="text" 
                  placeholder="Default: XdpzQ"
                  className="w-full bg-core-black border border-gray-700 text-white p-2 font-mono focus:border-core-blue outline-none"
                  value={formData.devName}
                  onChange={e => setFormData({...formData, devName: e.target.value})}
                />
              </div>
            </>
          )}

          <button type="submit" className="w-full bg-core-blue/10 text-core-blue border border-core-blue font-bold font-mono py-3 hover:bg-core-blue hover:text-white transition-all mt-4">
             {mode === Page.LOGIN ? 'ESTABLISH_LINK' : 'REGISTER_IDENTITY'}
          </button>
       </form>
       
       <div className="mt-4 text-center">
         <button onClick={onSwitch} className="text-xs font-mono text-gray-500 hover:text-white underline">
           {mode === Page.LOGIN ? 'No Identity? Register.' : 'Identity Exists? Login.'}
         </button>
       </div>
    </div>
  );
};

export default App;