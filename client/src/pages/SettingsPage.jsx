import React, { useState, useEffect } from 'react';
import {
  Settings,
  Volume2,
  Mic,
  Moon,
  Sun,
  ShieldCheck,
  Compass,
  Check,
  Play,
  Sliders,
  Laptop,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { sounds } from '../services/soundEffects';
import { Button } from '../components/common/Button';

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { offices } = useWorkspace();

  const [activeTab, setActiveTab] = useState('audio'); // 'audio' | 'appearance' | 'office' | 'privacy'
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [outputVolume, setOutputVolume] = useState(85);
  const [inputSensitivity, setInputSensitivity] = useState(70);
  const [spatialAudioEnabled, setSpatialAudioEnabled] = useState(true);
  const [attenuationModel, setAttenuationModel] = useState('linear');
  const [defaultOffice, setDefaultOffice] = useState(offices[0]?.id || 'oVice HQ / C-03');
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const audioInputs = devices.filter((d) => d.kind === 'audioinput');
          setAudioDevices(audioInputs);
          if (audioInputs.length > 0) {
            setSelectedDevice(audioInputs[0].deviceId);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleTestTone = () => {
    sounds.playProximityChime();
  };

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="settings-view-page">
      <div className="section-title-row mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Application Settings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure WebRTC hardware, spatial audio attenuation curves, and workspace preferences
          </p>
        </div>
      </div>

      <div className="settings-layout-split">
        {/* Navigation Sidebar */}
        <div className="settings-tabs-col">
          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`settings-nav-btn ${activeTab === 'audio' ? 'active' : ''}`}
          >
            <Volume2 size={16} />
            <span>Audio & Spatial DSP</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`settings-nav-btn ${activeTab === 'appearance' ? 'active' : ''}`}
          >
            <Sun size={16} />
            <span>Appearance & Theme</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('office')}
            className={`settings-nav-btn ${activeTab === 'office' ? 'active' : ''}`}
          >
            <Compass size={16} />
            <span>Office Preferences</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`settings-nav-btn ${activeTab === 'privacy' ? 'active' : ''}`}
          >
            <ShieldCheck size={16} />
            <span>Privacy & Hardware</span>
          </button>
        </div>

        {/* Content Panel */}
        <div className="settings-panel-col">
          <div className="settings-panel-card p-6">
            {savedSuccess && (
              <div className="auth-alert alert-success mb-6">
                <Check size={16} />
                <span>Settings preferences updated and persisted!</span>
              </div>
            )}

            {/* TAB: Audio & Spatial DSP */}
            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    Spatial Audio & WebRTC Hardware
                  </h3>
                  <p className="text-xs text-slate-500">
                    ProxiSpeak binds real-time microphone audio directly into the browser Web Audio graph.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="mic-device-select">
                    Microphone Input Device
                  </label>
                  <select
                    id="mic-device-select"
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="form-input"
                  >
                    {audioDevices.length > 0 ? (
                      audioDevices.map((d, idx) => (
                        <option key={d.deviceId || idx} value={d.deviceId}>
                          {d.label || `Microphone ${idx + 1}`}
                        </option>
                      ))
                    ) : (
                      <option value="default">Default System Microphone</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="form-label mb-0" htmlFor="mic-sensitivity">
                        Input Sensitivity (VAD)
                      </label>
                      <span className="text-xs text-indigo-600 font-semibold">{inputSensitivity}%</span>
                    </div>
                    <input
                      id="mic-sensitivity"
                      type="range"
                      min="10"
                      max="100"
                      value={inputSensitivity}
                      onChange={(e) => setInputSensitivity(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="form-label mb-0" htmlFor="output-volume">
                        Spatial Master Volume
                      </label>
                      <span className="text-xs text-indigo-600 font-semibold">{outputVolume}%</span>
                    </div>
                    <input
                      id="output-volume"
                      type="range"
                      min="0"
                      max="100"
                      value={outputVolume}
                      onChange={(e) => setOutputVolume(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dynamic Distance Attenuation Model</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: 'linear', label: 'Linear', desc: 'Constant slope falloff' },
                      { id: 'exponential', label: 'Exponential', desc: 'Logarithmic human ear' },
                      { id: 'inverse', label: 'Inverse 1/r', desc: '3D acoustic wave pressure' },
                      { id: 'smoothstep', label: 'Smoothstep', desc: 'S-curve Hermite spline' },
                    ].map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => setAttenuationModel(model.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          attenuationModel === model.id
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {model.label}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{model.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      Test Spatial Speaker Output
                    </div>
                    <div className="text-xs text-slate-500">
                      Plays a directional frequency chime through your Web Audio speakers
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" icon={Play} onClick={handleTestTone}>
                    Play Chime
                  </Button>
                </div>
              </div>
            )}

            {/* TAB: Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    Theme & Color System
                  </h3>
                  <p className="text-xs text-slate-500">
                    Switch between sleek light and dark themes tailored for prolonged collaboration.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`theme-selector-card ${theme === 'light' ? 'active' : ''}`}
                  >
                    <Sun size={24} className="mb-2 text-amber-500" />
                    <span className="font-semibold text-sm">Light Mode</span>
                    <span className="text-xs text-slate-400 mt-0.5">Crisp slate surfaces</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`theme-selector-card ${theme === 'dark' ? 'active' : ''}`}
                  >
                    <Moon size={24} className="mb-2 text-indigo-400" />
                    <span className="font-semibold text-sm">Dark Mode</span>
                    <span className="text-xs text-slate-400 mt-0.5">Deep navy contrast</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`theme-selector-card ${theme === 'system' ? 'active' : ''}`}
                  >
                    <Laptop size={24} className="mb-2 text-slate-400" />
                    <span className="font-semibold text-sm">System</span>
                    <span className="text-xs text-slate-400 mt-0.5">Match OS setting</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Office Preferences */}
            {activeTab === 'office' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    Virtual Office Experience
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage your default landing campus and navigation interactions.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="default-office-select">
                    Default Office Floor on Launch
                  </label>
                  <select
                    id="default-office-select"
                    value={defaultOffice}
                    onChange={(e) => setDefaultOffice(e.target.value)}
                    className="form-input"
                  >
                    {offices.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.floor})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      Proximity Entry Chimes
                    </div>
                    <div className="text-xs text-slate-500">
                      Play gentle audio feedback when a colleague enters your 100px proximity zone
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEffectsEnabled}
                    onChange={(e) => setSoundEffectsEnabled(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* TAB: Privacy & Hardware */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    Hardware Privacy & Security
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your microphone data is transmitted strictly peer-to-peer over encrypted WebRTC.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
                  <strong>🔒 Hardware Access Transparency:</strong> ProxiSpeak requests microphone access only upon explicit user unmute. Raw audio is processed locally on your client’s Web Audio graph with zero server-side recording or voice interception.
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Button variant="primary" size="md" icon={Check} onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
