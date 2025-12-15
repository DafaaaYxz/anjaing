import React, { useState } from 'react';
import { User, GlobalSettings } from '../types';
import { Terminal, Shield, Key, Users, Activity, Save, ToggleLeft, ToggleRight, Trash } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  settings: GlobalSettings;
  onUpdateSettings: (s: GlobalSettings) => void;
  onUpdateUser: (u: User) => void;
  onDeleteUser: (username: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, settings, onUpdateSettings, onUpdateUser, onDeleteUser }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'persona' | 'api' | 'control'>('users');
  const [newKey, setNewKey] = useState('');
  const [personaInput, setPersonaInput] = useState(settings.customPersona);

  const toggleUserApproval = (user: User) => {
    onUpdateUser({ ...user, isNameApproved: !user.isNameApproved });
  };

  const addApiKey = () => {
    if (!newKey.trim()) return;
    onUpdateSettings({
      ...settings,
      apiKeys: [...settings.apiKeys, newKey.trim()]
    });
    setNewKey('');
  };

  const removeApiKey = (index: number) => {
    const newKeys = [...settings.apiKeys];
    newKeys.splice(index, 1);
    onUpdateSettings({ ...settings, apiKeys: newKeys });
  };

  const savePersona = () => {
    onUpdateSettings({ ...settings, customPersona: personaInput });
    alert("Persona Updated in CORE.");
  };

  return (
    <div className="max-w-6xl mx-auto border border-core-blue/30 bg-slate-900/90 min-h-[80vh] flex flex-col shadow-2xl">
      <div className="bg-core-black p-4 border-b border-core-blue/50 flex items-center justify-between">
        <h1 className="text-2xl font-mono text-core-blue font-bold flex items-center gap-2">
          <Terminal className="animate-pulse" /> DEV_CONSOLE :: ADMIN_PANEL
        </h1>
        <div className="text-xs font-mono text-red-500 border border-red-900 bg-red-950/30 px-2 py-1 rounded">
          ROOT ACCESS
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-core-black/50 border-r border-core-blue/20">
          <nav className="flex flex-col p-2 space-y-1">
            <button 
              onClick={() => setActiveTab('users')}
              className={`p-3 text-left font-mono flex items-center gap-2 border border-transparent hover:border-core-blue/30 hover:bg-core-blue/10 transition-all ${activeTab === 'users' ? 'bg-core-blue/20 text-core-blue border-core-blue/50' : 'text-gray-500'}`}
            >
              <Users size={16} /> User Management
            </button>
            <button 
              onClick={() => setActiveTab('persona')}
              className={`p-3 text-left font-mono flex items-center gap-2 border border-transparent hover:border-core-blue/30 hover:bg-core-blue/10 transition-all ${activeTab === 'persona' ? 'bg-core-blue/20 text-core-blue border-core-blue/50' : 'text-gray-500'}`}
            >
              <Shield size={16} /> Persona Injection
            </button>
            <button 
              onClick={() => setActiveTab('api')}
              className={`p-3 text-left font-mono flex items-center gap-2 border border-transparent hover:border-core-blue/30 hover:bg-core-blue/10 transition-all ${activeTab === 'api' ? 'bg-core-blue/20 text-core-blue border-core-blue/50' : 'text-gray-500'}`}
            >
              <Key size={16} /> API Manager
            </button>
            <button 
              onClick={() => setActiveTab('control')}
              className={`p-3 text-left font-mono flex items-center gap-2 border border-transparent hover:border-core-blue/30 hover:bg-core-blue/10 transition-all ${activeTab === 'control' ? 'bg-core-blue/20 text-core-blue border-core-blue/50' : 'text-gray-500'}`}
            >
              <Activity size={16} /> Global Controls
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950">
          
          {/* USER TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-xl font-mono text-white border-b border-gray-800 pb-2">Registered Users</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-sm">
                  <thead className="text-gray-500 border-b border-gray-800">
                    <tr>
                      <th className="p-3">Username</th>
                      <th className="p-3">Req. AI Name</th>
                      <th className="p-3">Req. Dev Name</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {users.map(u => (
                      <tr key={u.username} className="hover:bg-white/5">
                        <td className="p-3 text-core-blue">{u.username}</td>
                        <td className="p-3">{u.requestedAiName}</td>
                        <td className="p-3">{u.requestedDevName}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-xs rounded border ${u.isNameApproved ? 'border-emerald-500 text-emerald-500' : 'border-gray-600 text-gray-500'}`}>
                            {u.isNameApproved ? 'APPROVED' : 'DEFAULT'}
                          </span>
                        </td>
                        <td className="p-3 flex items-center gap-2">
                          <button 
                            onClick={() => toggleUserApproval(u)}
                            className={`p-1 rounded hover:bg-white/10 ${u.isNameApproved ? 'text-emerald-400' : 'text-gray-600'}`}
                            title="Toggle Approval"
                          >
                             {u.isNameApproved ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                          </button>
                          {!u.isAdmin && (
                            <button onClick={() => onDeleteUser(u.username)} className="text-red-500 hover:text-red-300 p-1">
                              <Trash size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PERSONA TAB */}
          {activeTab === 'persona' && (
             <div className="space-y-6 h-full flex flex-col">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <h2 className="text-xl font-mono text-white">System Persona</h2>
                <button onClick={savePersona} className="flex items-center gap-2 bg-core-blue/20 text-core-blue px-4 py-2 rounded hover:bg-core-blue/30 border border-core-blue/50">
                  <Save size={16} /> SAVE TO CORE
                </button>
              </div>
              <textarea 
                className="w-full flex-1 bg-slate-900 border border-gray-700 text-gray-300 font-mono text-xs p-4 focus:border-core-blue focus:outline-none rounded"
                value={personaInput}
                onChange={(e) => setPersonaInput(e.target.value)}
                spellCheck={false}
              />
              <p className="text-xs text-gray-500">
                Use {'{{AI_NAME}}'} and {'{{DEV_NAME}}'} as placeholders.
              </p>
             </div>
          )}

          {/* API MANAGER */}
          {activeTab === 'api' && (
             <div className="space-y-6">
              <h2 className="text-xl font-mono text-white border-b border-gray-800 pb-2">API Key Manager (Multi-key Rotation)</h2>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Paste Gemini API Key here..."
                  className="flex-1 bg-slate-900 border border-gray-700 text-white px-4 py-2 font-mono text-sm focus:border-core-blue outline-none"
                />
                <button onClick={addApiKey} className="bg-core-blue text-slate-950 font-bold px-4 py-2 font-mono hover:bg-blue-400">ADD KEY</button>
              </div>

              <div className="space-y-2">
                {settings.apiKeys.length === 0 && <p className="text-red-500 font-mono">WARNING: NO API KEYS CONFIGURED.</p>}
                {settings.apiKeys.map((k, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-900 p-3 border border-gray-800 rounded">
                    <span className="font-mono text-sm text-emerald-500">
                      {k.substring(0, 8)}...{k.substring(k.length - 4)}
                    </span>
                    <button onClick={() => removeApiKey(i)} className="text-red-500 hover:text-red-300">
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 font-mono mt-4">
                Keys are stored in local storage. If Key 1 fails, the system automatically attempts Key 2, etc.
              </p>
             </div>
          )}

          {/* GLOBAL CONTROLS */}
          {activeTab === 'control' && (
             <div className="space-y-6">
              <h2 className="text-xl font-mono text-white border-b border-gray-800 pb-2">Global Feature Controls</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-6 border border-gray-700 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="text-core-blue font-bold font-mono text-lg mb-2">Maintenance Mode</h3>
                    <p className="text-gray-400 text-sm mb-4">When active, only Admins can access the system. Public sees Maintenance page.</p>
                  </div>
                  <button 
                    onClick={() => onUpdateSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                    className={`w-full py-2 font-mono font-bold border ${settings.maintenanceMode ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-emerald-500/20 border-emerald-500 text-emerald-500'}`}
                  >
                    {settings.maintenanceMode ? 'ACTIVE (SYSTEM LOCKDOWN)' : 'INACTIVE (NORMAL OPS)'}
                  </button>
                </div>

                <div className="bg-slate-900 p-6 border border-gray-700 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="text-core-blue font-bold font-mono text-lg mb-2">Image Generator</h3>
                    <p className="text-gray-400 text-sm mb-4">Enable/Disable image upload capability in Terminal.</p>
                  </div>
                  <button 
                    onClick={() => onUpdateSettings({...settings, featureImageGen: !settings.featureImageGen})}
                    className={`w-full py-2 font-mono font-bold border ${!settings.featureImageGen ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-emerald-500/20 border-emerald-500 text-emerald-500'}`}
                  >
                    {settings.featureImageGen ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};
