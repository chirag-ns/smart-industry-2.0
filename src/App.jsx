import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  Shield, ShieldAlert, ShieldCheck, Activity, Wifi, Cpu, Database, Network,
  AlertTriangle, Play, RefreshCw, Sliders, XCircle, Terminal, Info,
  Lock, Unlock, TrendingUp, Radio, Eye, Brain, HelpCircle, HardDrive
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

// Mapping devices to their specific symbols
const deviceIconMap = {
  'node-cloud-ai': Shield,
  'node-gateway': Network,
  'node-edge-ai': Cpu,
  'node-operator': Terminal,
  'node-access': Lock,
  'node-db': Database,
  'node-cache': Cpu,
  'node-cctv': Eye,
  'node-sensor': Radio,
  'node-wifi': Wifi
};

export default function App() {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('node-cctv');
  const [selectedDeviceData, setSelectedDeviceData] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [attackPath, setAttackPath] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [mapSelectedDevice, setMapSelectedDevice] = useState(null);
  
  // Tab states: 'devices' (IoT Devices Hub), 'topology' (Network Topology), 'ai' (AI Security Engine)
  const [activeTab, setActiveTab] = useState('devices');
  const [isSimPanelOpen, setIsSimPanelOpen] = useState(false);
  const [dismissedAlertId, setDismissedAlertId] = useState(null);

  // Reset alert dismissed status if no compromised devices exist
  useEffect(() => {
    const hasCompromised = devices.some(d => d.status === 'compromised' && !d.isolated);
    if (!hasCompromised) {
      setDismissedAlertId(null);
    }
  }, [devices]);


  // Structured Symmetrical Hierarchical Coordinates for Center Map (600x440 space)
  const nodePositions = {
    // Layer 1: Cloud AI Ingestion
    'node-cloud-ai': { x: 300, y: 40, label: 'Cloud AI Engine', layer: 'Cloud' },
    
    // Layer 2: Core Network Router
    'node-gateway': { x: 300, y: 110, label: 'Edge Gateway', layer: 'Gateway' },
    
    // Layer 3: Controls & Analytics Core
    'node-edge-ai': { x: 100, y: 190, label: 'Edge AI Analyzer', layer: 'Local Analytics' },
    'node-operator': { x: 300, y: 190, label: 'Operator Terminal', layer: 'Terminal' },
    'node-access': { x: 500, y: 190, label: 'Access Controller', layer: 'Authentication' },
    
    // Layer 4: Storage DB & Local Cache
    'node-db': { x: 190, y: 270, label: 'Data Storage Node', layer: 'Database' },
    'node-cache': { x: 410, y: 270, label: 'Edge Cache', layer: 'Resource Cache' },
    
    // Layer 5: Edge IoT Devices
    'node-cctv': { x: 100, y: 360, label: 'CCTV Camera', layer: 'Edge' },
    'node-sensor': { x: 300, y: 360, label: 'Smart Sensor', layer: 'Edge' },
    'node-wifi': { x: 500, y: 360, label: 'Enterprise WiFi AP', layer: 'Edge' }
  };

  // Sync state feeds from backend
  const fetchGlobalData = useCallback(async () => {
    try {
      const [devsRes, aiRes, pathRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/devices`),
        fetch(`${API_BASE}/ai/insights`),
        fetch(`${API_BASE}/attack/attack-path`),
        fetch(`${API_BASE}/alerts/history`)
      ]);

      if (!devsRes.ok) throw new Error('API server offline');

      const devsData = await devsRes.json();
      setDevices(devsData);

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAiInsights(aiData);
      }

      if (pathRes.ok) {
        const pathData = await pathRes.json();
        setAttackPath(Object.keys(pathData).length > 0 ? pathData : null);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlertHistory(alertsData);
      }

      setError(null);
    } catch (err) {
      console.error('Data sync failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch telemetry details for selected node
  const fetchDeviceDetails = useCallback(async (deviceId) => {
    if (!deviceId) return;
    try {
      const res = await fetch(`${API_BASE}/device/investigation/${deviceId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDeviceData(data);
      }
    } catch (err) {
      console.error('Device stats query failed:', err);
    }
  }, []);

  // Set sync loops
  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 3000);
    return () => clearInterval(interval);
  }, [fetchGlobalData]);

  useEffect(() => {
    fetchDeviceDetails(selectedDeviceId);
    const interval = setInterval(() => fetchDeviceDetails(selectedDeviceId), 3000);
    return () => clearInterval(interval);
  }, [selectedDeviceId, fetchDeviceDetails]);

  // Inject attack anomalies
  const handleSimulateAttack = async (deviceId, type) => {
    setActionLoading(`${deviceId}-${type}`);
    try {
      const endpoint = type === 'compromise' 
        ? `${API_BASE}/attack/simulate` 
        : `${API_BASE}/simulate_attack`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });

      if (res.ok) {
        await fetchGlobalData();
        await fetchDeviceDetails(deviceId);
      }
    } catch (err) {
      console.error('Simulation triggers failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Quarantines/Isolates a device
  const handleIsolateDevice = async (deviceId) => {
    setActionLoading(`${deviceId}-isolate`);
    try {
      const res = await fetch(`${API_BASE}/security/isolate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });

      if (res.ok) {
        await fetchGlobalData();
        await fetchDeviceDetails(deviceId);
        if (mapSelectedDevice && mapSelectedDevice.deviceId === deviceId) {
          setMapSelectedDevice(prev => ({ ...prev, status: 'isolated', isolated: true, trustScore: 10 }));
        }
      }
    } catch (err) {
      console.error('Firewall override failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Restore Security Baselines
  const handleResetSystem = async () => {
    setActionLoading('reset');
    try {
      const res = await fetch(`${API_BASE}/attack/reset`, { method: 'POST' });
      if (res.ok) {
        setSelectedDeviceId('node-cctv');
        setMapSelectedDevice(null);
        await fetchGlobalData();
        await fetchDeviceDetails('node-cctv');
      }
    } catch (err) {
      console.error('Clear states failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-cyber-black text-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyber-cyan mb-4"></div>
        <h1 className="text-xl font-mono tracking-widest text-cyber-cyan animate-pulse">BOOTING SOC OPERATIONS CONSOLE...</h1>
        <p className="text-xs text-slate-500 mt-2 font-mono">Bypassing MongoDB | Activating Simulation Threads</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-cyber-black text-slate-100 p-6 text-center">
        <ShieldAlert className="h-16 w-16 text-cyber-red mb-4 animate-bounce" />
        <h1 className="text-2xl font-mono tracking-widest text-cyber-red">ORBITGUARD API OFFLINE</h1>
        <div className="max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 mt-4 text-left">
          <p className="text-sm font-mono text-slate-400">Error: {error}</p>
          <div className="text-xs text-slate-500 mt-3 font-mono">
            Start the local API backend:
            <code className="text-cyber-cyan bg-black px-1.5 py-0.5 rounded mt-1.5 inline-block">node backend/api/server.js</code>
          </div>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchGlobalData(); }}
          className="mt-6 px-4 py-2 bg-cyber-cyan hover:bg-cyan-400 text-black font-mono font-bold rounded flex items-center transition-all"
        >
          <RefreshCw className="mr-2 h-4 w-4 animate-spin-slow" /> REBOOT AGENT
        </button>
      </div>
    );
  }

  // Active uncontained compromise alert popup (Works globally on any active tab, checks dismissed status)
  const compromisedDevice = devices.find(
    d => d.status === 'compromised' && !d.isolated && d.deviceId !== dismissedAlertId
  );
  const TargetSymbolIcon = compromisedDevice ? (deviceIconMap[compromisedDevice.deviceId] || ShieldAlert) : ShieldAlert;

  const averageTrust = devices.length > 0 
    ? Math.round(devices.reduce((acc, d) => acc + d.trustScore, 0) / devices.length)
    : 100;
  const activeNodesCount = devices.filter(d => d.status !== 'isolated').length;
  const compromisedCount = devices.filter(d => d.status === 'compromised').length;
  const driftCount = devices.filter(d => d.status === 'drift').length;

  const systemStatus = compromisedCount > 0 
    ? 'CRITICAL_ALERT' 
    : driftCount > 0 
    ? 'ANOMALY_DETECTED' 
    : 'SYSTEM_SECURE';

  // Calculate cumulative bandwidth ingestion (excluding isolated nodes)
  const cumulativeTraffic = devices
    .filter(d => d.status !== 'isolated')
    .reduce((acc, d) => acc + (d.currentFeatures?.traffic_rate || 0), 0);

  return (
    <div className="min-h-screen bg-cyber-black text-slate-200 flex flex-col antialiased">
      
      {/* 🚨 THREAT FLOATING CARD (Non-blocking alert panel in top-right) */}
      {compromisedDevice && (
        <div className="fixed top-24 right-6 z-40 w-96 bg-slate-950 border-2 border-red-500 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.4)] overflow-hidden animate-glow-red animate-fadeIn">
          {/* Blinking header */}
          <div className="bg-red-950/40 border-b border-red-900/40 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 text-black rounded-lg">
                <ShieldAlert className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest leading-none">Security Incident Alert</h3>
                <span className="text-[9px] text-red-500/70 font-mono tracking-wider">Device Compromised</span>
              </div>
            </div>
            {/* Option to acknowledge/dismiss alert banner to view graph */}
            <button 
              onClick={() => setDismissedAlertId(compromisedDevice.deviceId)}
              className="text-slate-500 hover:text-slate-200 text-xs font-mono font-bold"
              title="Acknowledge Alert"
            >
              ✕
            </button>
          </div>
          
          <div className="p-5 flex flex-col gap-4">
            {/* Device Specific Icon */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-full border border-red-500/30 relative animate-bounce">
                <TargetSymbolIcon className="h-8 w-8" />
                <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 blur-md animate-ping"></div>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white leading-tight truncate">{compromisedDevice.deviceName}</h4>
                <span className="text-[9px] font-mono text-slate-500 block mt-1">{compromisedDevice.ipAddress}</span>
              </div>
            </div>

            <p className="text-[10px] font-mono text-slate-400 leading-relaxed bg-slate-900 border border-slate-850 p-3 rounded-xl">
              ⚠️ Behavior anomaly warning: High traffic volumes combined with unauthorized protocol patterns (e.g. lateral scans) detected on node {compromisedDevice.deviceId}.
            </p>

            {/* Containment action overrides */}
            <div className="flex gap-2">
              <button
                onClick={() => handleIsolateDevice(compromisedDevice.deviceId)}
                disabled={actionLoading !== null}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-mono text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
              >
                <Lock className="h-3.5 w-3.5" /> FIREWALL ISOLATE NOW
              </button>
              <button
                onClick={() => setDismissedAlertId(compromisedDevice.deviceId)}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 font-mono text-[10px] rounded-xl transition-all"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER SECTION */}
      <header className="border-b border-slate-800 bg-cyber-gray px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg relative overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-50"></div>
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 relative">
            <Shield className="h-7 w-7 text-cyber-cyan" />
            <div className="absolute inset-0 bg-cyber-cyan rounded-xl opacity-20 blur-sm"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider font-mono text-white">ORBIT<span className="text-cyber-cyan">GUARD</span></h1>
              <span className="text-[10px] bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 px-1.5 py-0.5 rounded font-mono">SOC SECURE</span>
            </div>
            <p className="text-xs text-slate-500 font-mono">Zero Trust Real-time Threat Containment Console</p>
          </div>
        </div>

        {/* Global Security State indicators */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950 border border-slate-850 px-3 py-1 rounded-lg flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-cyber-cyan" />
            <div>
              <div className="text-[8px] text-slate-500 font-mono uppercase">Avg Trust</div>
              <div className="text-xs font-bold font-mono text-cyber-cyan">{averageTrust}%</div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-850 px-3 py-1 rounded-lg flex items-center gap-1.5">
            <Network className="h-3.5 w-3.5 text-cyber-cyan" />
            <div>
              <div className="text-[8px] text-slate-500 font-mono uppercase">Active Nodes</div>
              <div className="text-xs font-bold font-mono text-white">{activeNodesCount} / 10</div>
            </div>
          </div>

          <div className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border tracking-wider flex items-center gap-1.5 ${
            systemStatus === 'CRITICAL_ALERT' 
              ? 'bg-red-500/10 border-red-500/50 text-red-400 animate-glow-red' 
              : systemStatus === 'ANOMALY_DETECTED'
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 animate-glow-amber'
              : 'bg-green-500/10 border-green-500/50 text-green-400 animate-glow-cyan'
          }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
            {systemStatus.replace('_', ' ')}
          </div>

          <button
            onClick={handleResetSystem}
            disabled={actionLoading === 'reset'}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all active:scale-95"
            title="Global System Reset"
          >
            <RefreshCw className={`h-4 w-4 ${actionLoading === 'reset' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* NEON TAB NAVIGATION */}
      <div className="bg-slate-950/80 backdrop-blur border-b border-slate-900 px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex-1 sm:flex-none px-4 py-2 font-mono text-[11px] font-bold rounded-lg border transition-all flex items-center justify-center gap-2 ${
              activeTab === 'devices'
                ? 'bg-cyber-cyan/15 text-cyber-neon border-cyber-neon/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" /> [1] IoT DEVICES HUB
          </button>
          <button
            onClick={() => setActiveTab('topology')}
            className={`flex-1 sm:flex-none px-4 py-2 font-mono text-[11px] font-bold rounded-lg border transition-all flex items-center justify-center gap-2 ${
              activeTab === 'topology'
                ? 'bg-cyber-cyan/15 text-cyber-neon border-cyber-neon/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Network className="h-3.5 w-3.5" /> [2] NETWORK TOPOLOGY
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 sm:flex-none px-4 py-2 font-mono text-[11px] font-bold rounded-lg border transition-all flex items-center justify-center gap-2 ${
              activeTab === 'ai'
                ? 'bg-cyber-cyan/15 text-cyber-neon border-cyber-neon/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Brain className="h-3.5 w-3.5" /> [3] AI THREAT ENGINE
          </button>
        </div>
        <div className="text-[10px] text-slate-500 font-mono tracking-wider">
          LIVE FEED: SECURE ENCRYPTED PROXY INGESTION ACTIVE
        </div>
      </div>

      {/* MAIN SCREEN DISPATCHER */}
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto animate-fadeIn flex flex-col gap-6">
        
        {/* ==============================================
            PAGE 1: IoT DEVICES HUB (DEFAULT LANDING VIEW)
            ============================================== */}
        {activeTab === 'devices' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            
            {/* Left 8 Columns: High Level Overview & IoT Device Cards Grid */}
            <div className="xl:col-span-8 flex flex-col gap-5">
              
              {/* Metrics Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-cyber-gray border border-slate-850 rounded-2xl p-4 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-cyber-green/5 rounded-bl-full flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-cyber-green/40" />
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Avg trust factor</span>
                  <span className="text-xl font-bold text-white mt-1 font-mono">{averageTrust}%</span>
                  <div className="h-1 w-full bg-slate-850 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-cyber-green" style={{ width: `${averageTrust}%` }}></div>
                  </div>
                </div>

                <div className="bg-cyber-gray border border-slate-850 rounded-2xl p-4 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-red-500/5 rounded-bl-full flex items-center justify-center">
                    <ShieldAlert className="h-5 w-5 text-cyber-red/40" />
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Active threats</span>
                  <span className={`text-xl font-bold mt-1 font-mono ${compromisedCount > 0 ? 'text-cyber-red animate-pulse' : 'text-slate-300'}`}>
                    {compromisedCount} Alerts
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono mt-2">Requires quarantine</span>
                </div>

                <div className="bg-cyber-gray border border-slate-850 rounded-2xl p-4 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-cyber-cyan/5 rounded-bl-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-cyber-cyan/40" />
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Telemetry Ingestion</span>
                  <span className="text-xl font-bold text-white mt-1 font-mono">{Math.round(cumulativeTraffic / 1000)} KB/s</span>
                  <span className="text-[9px] text-slate-500 font-mono mt-2">Combined bandwidth throughput</span>
                </div>

                <div className="bg-cyber-gray border border-slate-850 rounded-2xl p-4 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-bl-full flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-cyber-amber/40" />
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Drift Anomalies</span>
                  <span className={`text-xl font-bold mt-1 font-mono ${driftCount > 0 ? 'text-cyber-amber' : 'text-slate-300'}`}>
                    {driftCount} Flagged
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono mt-2">Pattern deviations detected</span>
                </div>
              </div>

              {/* IoT Device Grid Container */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <h2 className="text-xs font-bold tracking-wider font-mono text-slate-400 uppercase flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-cyber-neon" /> SYSTEM DEVICE REPOSITORY ({devices.length} Nodes)
                  </h2>
                  <span className="text-[9px] text-slate-500 font-mono">Select investigate to load diagnostic trends</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {devices.map(device => {
                    const isSelected = device.deviceId === selectedDeviceId;
                    const DeviceIcon = deviceIconMap[device.deviceId] || HardDrive;
                    
                    let statusColor = 'border-slate-850 hover:border-slate-800 bg-cyber-gray/70';
                    let badgeColor = 'bg-slate-950 text-slate-400 border-slate-800';
                    let scoreColor = 'text-cyber-green';
                    let scoreCircle = 'stroke-cyber-green';
                    let glowClass = '';
                    
                    if (device.status === 'compromised') {
                      statusColor = isSelected ? 'border-red-500 bg-red-950/20' : 'border-red-500/40 hover:border-red-500/60 bg-red-950/5';
                      badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse';
                      scoreColor = 'text-red-500';
                      scoreCircle = 'stroke-red-500';
                      glowClass = 'animate-glow-red';
                    } else if (device.status === 'isolated') {
                      statusColor = isSelected ? 'border-amber-500 bg-amber-950/20' : 'border-amber-500/30 hover:border-amber-500/60 bg-amber-950/5';
                      badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                      scoreColor = 'text-amber-500';
                      scoreCircle = 'stroke-amber-500';
                    } else if (device.status === 'drift') {
                      statusColor = isSelected ? 'border-amber-500 bg-amber-950/20' : 'border-amber-500/30 hover:border-amber-500/60 bg-amber-950/5';
                      badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                      scoreColor = 'text-amber-500';
                      scoreCircle = 'stroke-amber-500';
                      glowClass = 'animate-glow-amber';
                    } else {
                      if (isSelected) {
                        statusColor = 'border-cyber-cyan bg-cyber-cyan/5';
                        glowClass = 'animate-glow-cyan';
                      }
                    }

                    // Circle Progress Calculations
                    const radius = 18;
                    const strokeWidth = 2.5;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (device.trustScore / 100) * circumference;

                    return (
                      <div
                        key={device.deviceId}
                        className={`border rounded-xl p-4 flex flex-col justify-between transition-all duration-300 relative ${statusColor} ${glowClass}`}
                      >
                        {/* Device Info */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg bg-slate-950/80 border ${device.status === 'compromised' ? 'border-red-500/50 text-red-500' : 'border-slate-800 text-cyber-cyan'}`}>
                              <DeviceIcon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <h3 className="text-xs font-bold text-white truncate leading-tight">{device.deviceName}</h3>
                              <span className="text-[8px] font-mono text-slate-500 mt-0.5">{device.deviceId}</span>
                            </div>
                          </div>

                          {/* Radial Score */}
                          <div className="relative flex items-center justify-center h-10 w-10 flex-shrink-0">
                            <svg className="h-full w-full transform -rotate-90">
                              <circle cx="20" cy="20" r={radius} className="stroke-slate-850" strokeWidth={strokeWidth} fill="transparent" />
                              <circle
                                cx="20"
                                cy="20"
                                r={radius}
                                className={`transition-all duration-500 ${scoreCircle}`}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className={`absolute text-[9px] font-bold font-mono ${scoreColor}`}>
                              {Math.round(device.trustScore)}
                            </span>
                          </div>
                        </div>

                        {/* Status elements & Quick Telemetry values */}
                        <div className="mt-4 border-t border-slate-900 pt-3 flex justify-between items-center text-[10px] font-mono">
                          <div>
                            <span className="text-slate-500 block text-[8px] uppercase">IP Address</span>
                            <span className="text-slate-300">{device.ipAddress}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 block text-[8px] uppercase">Throughput</span>
                            <span className="text-white font-bold">
                              {device.status === 'isolated' ? '0 KB/s' : `${Math.round((device.currentFeatures?.traffic_rate || 0) / 1000)} KB/s`}
                            </span>
                          </div>
                        </div>

                        {/* Device card action toolbar */}
                        <div className="mt-4 flex gap-1.5">
                          <button
                            onClick={() => setSelectedDeviceId(device.deviceId)}
                            className={`flex-1 py-1.5 font-mono text-[9px] font-bold rounded border transition-all ${
                              isSelected 
                                ? 'bg-cyber-cyan text-black border-cyber-cyan' 
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            Investigate
                          </button>
                          
                          {device.status === 'isolated' || device.isolated ? (
                            <div className="py-1.5 px-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold font-mono rounded text-center">
                              CONTAINED
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleIsolateDevice(device.deviceId)}
                                className="py-1.5 px-2.5 bg-amber-500/15 text-amber-400 hover:bg-amber-500 hover:text-black border border-amber-500/20 text-[9px] font-bold font-mono rounded transition-all"
                                title="Isolate and sever routing paths"
                              >
                                Isolate
                              </button>
                              <button
                                onClick={() => handleSimulateAttack(device.deviceId, 'compromise')}
                                className="py-1.5 px-2 bg-red-950 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/20 text-[9px] font-mono rounded transition-all"
                                title="Simulate compromise injection"
                              >
                                Hack
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 4 Columns: Detailed Selected Device Diagnostics Sidebar */}
            <div className="xl:col-span-4 flex flex-col gap-4">
              {selectedDeviceData ? (
                <div className="bg-cyber-gray border border-slate-850 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-950 rounded-lg text-cyber-cyan border border-slate-900">
                        {React.createElement(deviceIconMap[selectedDeviceData.device?.deviceId] || HardDrive, { className: 'h-5 w-5' })}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white leading-none">{selectedDeviceData.device?.deviceName}</h3>
                        <span className="text-[9px] font-mono text-slate-500 block mt-1">{selectedDeviceData.device?.deviceId}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded border font-mono uppercase font-bold tracking-wider ${
                      selectedDeviceData.device?.status === 'compromised'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                        : selectedDeviceData.device?.status === 'isolated'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                      {selectedDeviceData.device?.status}
                    </span>
                  </div>

                  {/* Feature Baselines comparison */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900">
                      <span className="text-slate-500 block text-[8px] uppercase">Live protocol entropy</span>
                      <span className="text-white font-bold text-xs mt-0.5 inline-block">
                        {parseFloat(selectedDeviceData.device?.currentFeatures?.protocol_entropy || 0).toFixed(2)}
                      </span>
                      <span className="text-[8px] text-slate-500 block mt-0.5">Base: {parseFloat(selectedDeviceData.device?.baselineFeatures?.protocol_entropy || 0).toFixed(2)}</span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900">
                      <span className="text-slate-500 block text-[8px] uppercase">Unique Endpoints</span>
                      <span className="text-white font-bold text-xs mt-0.5 inline-block">
                        {selectedDeviceData.device?.currentFeatures?.unique_endpoints || 0} active
                      </span>
                      <span className="text-[8px] text-slate-500 block mt-0.5">Base: {selectedDeviceData.device?.baselineFeatures?.unique_endpoints || 0}</span>
                    </div>
                  </div>

                  {/* Throughput line graph */}
                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-3">
                    <h4 className="text-[9px] font-bold tracking-wider font-mono text-slate-500 uppercase mb-2.5 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-cyber-cyan" /> REAL-TIME THROUGHPUT HISTORY (BYTES)
                    </h4>
                    <div className="h-[140px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={
                            selectedDeviceData.communication?.length > 0 
                              ? [...selectedDeviceData.communication].reverse().map(c => ({
                                  time: new Date(c.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                                  rate: c.bytes,
                                  baseRate: selectedDeviceData.device?.baselineFeatures?.traffic_rate || 0
                                }))
                              : [{ time: '00:00', rate: 0, baseRate: 0 }]
                          }
                          margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="time" stroke="#475569" fontSize={8} />
                          <YAxis stroke="#475569" fontSize={8} />
                          <Tooltip contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#334155' }} />
                          <Line type="monotone" dataKey="rate" stroke="#00f0ff" strokeWidth={1.5} dot={false} />
                          <Line type="monotone" dataKey="baseRate" stroke="#475569" strokeDasharray="4 4" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Security Policy Rules Info */}
                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex flex-col gap-2 font-mono text-[9px]">
                    <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1.5 mb-0.5">
                      <Info className="h-3.5 w-3.5 text-cyber-cyan" />
                      <span className="font-bold text-slate-400 uppercase tracking-wider">Ingress firewall policies</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Allowed Subnet:</span>
                      <span className="text-slate-300">{selectedDeviceData.device?.policyRules?.allowed_subnet || 'ANY'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Allowed Protocols:</span>
                      <span className="text-slate-300">{(selectedDeviceData.device?.policyRules?.allowed_protocols || []).join(', ') || 'ANY'}</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-slate-500">Allowed Ingress IPs:</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {(selectedDeviceData.device?.policyRules?.allowed_ips || []).length > 0 ? (
                          (selectedDeviceData.device?.policyRules?.allowed_ips || []).map((ip, idx) => (
                            <span key={idx} className="bg-slate-900 px-1.5 py-0.5 rounded text-[8px] text-slate-400 border border-slate-800">{ip}</span>
                          ))
                        ) : (
                          <span className="text-slate-600">None (Zero-Trust)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Localized simulation triggers */}
                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex flex-col gap-2.5">
                    <h4 className="text-[9px] font-bold tracking-wider font-mono text-slate-500 uppercase flex items-center gap-1">
                      <Sliders className="h-3 w-3 text-cyber-cyan" /> ENDPOINT SIMULATOR CONTROLS
                    </h4>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSimulateAttack(selectedDeviceData.device?.deviceId, 'drift')}
                        disabled={actionLoading !== null || selectedDeviceData.device?.status === 'isolated'}
                        className="flex-1 py-1.5 bg-slate-900 border border-slate-850 hover:border-slate-800 text-amber-500 font-mono text-[9px] font-bold rounded-lg transition-all"
                      >
                        Drift Spikes
                      </button>
                      <button
                        onClick={() => handleSimulateAttack(selectedDeviceData.device?.deviceId, 'compromise')}
                        disabled={actionLoading !== null || selectedDeviceData.device?.status === 'isolated'}
                        className="flex-1 py-1.5 bg-slate-900 border border-slate-850 hover:border-slate-800 text-red-500 font-mono text-[9px] font-bold rounded-lg transition-all"
                      >
                        Force Anomaly
                      </button>
                    </div>

                    {selectedDeviceData.device?.status === 'isolated' || selectedDeviceData.device?.isolated ? (
                      <div className="w-full py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono text-[10px] font-bold text-center rounded-xl">
                        🔒 ENDPOINT CONTAINED BY LOCAL FIREWALL
                      </div>
                    ) : (
                      <button
                        onClick={() => handleIsolateDevice(selectedDeviceData.device?.deviceId)}
                        disabled={actionLoading !== null}
                        className="w-full py-2 bg-amber-500 text-black hover:bg-amber-400 font-mono text-[10px] font-bold rounded-xl transition-all active:scale-95 shadow-md"
                      >
                        Activate Firewall Quarantine
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-cyber-gray border border-slate-850 rounded-2xl p-6 text-center shadow-lg font-mono text-xs text-slate-500 flex flex-col items-center justify-center h-[300px]">
                  <HelpCircle className="h-8 w-8 text-slate-600 mb-3 animate-pulse" />
                  <span>Select any IoT device from the repository grid to inspect its real-time analytics stream.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==============================================
            PAGE 2: NETWORK TOPOLOGY MAP VIEW
            ============================================== */}
        {activeTab === 'topology' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            
            {/* SVG Diagram Canvas (Left 8 Columns) */}
            <div className="xl:col-span-8 bg-cyber-gray border border-slate-805 rounded-2xl p-5 shadow-lg relative flex flex-col gap-4">
              <div>
                <h2 className="text-xs font-bold tracking-wider font-mono text-white uppercase flex items-center gap-2">
                  <Network className="h-4 w-4 text-cyber-cyan" /> Network Interconnect topology map
                </h2>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Click nodes on the structured graph. Uplinks to gateway <span className="text-amber-500 font-bold">DISAPPEAR</span> upon quarantine.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-850 rounded-xl relative flex justify-center items-center p-2 overflow-hidden min-h-[440px]">
                <svg className="w-full h-[400px] select-none" viewBox="0 0 600 400">
                  
                  {/* Uplink routing lines (Sparsely layered, disappear if isolated) */}
                  {Object.keys(nodePositions).map(nodeId => {
                    const pos = nodePositions[nodeId];
                    const device = devices.find(d => d.deviceId === nodeId) || {};
                    
                    // Severe links if quarantined
                    if (device.status === 'isolated' || device.isolated) return null;

                    let parentId = null;
                    if (pos.layer === 'Gateway') parentId = 'node-cloud-ai';
                    else if (pos.layer === 'Local Analytics' || pos.layer === 'Terminal' || pos.layer === 'Authentication') parentId = 'node-gateway';
                    else if (pos.layer === 'Database' || pos.layer === 'Resource Cache') parentId = 'node-gateway';
                    else if (pos.layer === 'Edge') parentId = 'node-gateway';

                    if (!parentId) return null;
                    const parent = nodePositions[parentId];

                    const isLinkCompromised = attackPath && 
                      (attackPath.source === nodeId || attackPath.path?.some(p => p.to === nodeId));

                    return (
                      <line
                        key={`link-${nodeId}-${parentId}`}
                        x1={pos.x} y1={pos.y}
                        x2={parent.x} y2={parent.y}
                        className={`stroke-2 transition-all duration-700 ${
                          isLinkCompromised 
                            ? 'stroke-red-500 stroke-[2.5px] animate-pulse' 
                            : 'stroke-slate-800'
                        }`}
                      />
                    );
                  })}

                  {/* Red lateral attack paths (dashed links, disappear if isolated) */}
                  {attackPath && attackPath.path && attackPath.path.map((pathEdge, idx) => {
                    const fromDevice = devices.find(d => d.deviceId === pathEdge.from) || {};
                    const toDevice = devices.find(d => d.deviceId === pathEdge.to) || {};
                    
                    // Infection link is severed if either node is quarantined
                    if (fromDevice.status === 'isolated' || fromDevice.isolated ||
                        toDevice.status === 'isolated' || toDevice.isolated) {
                      return null;
                    }

                    const fromPos = nodePositions[pathEdge.from];
                    const toPos = nodePositions[pathEdge.to];
                    if (!fromPos || !toPos) return null;
                    return (
                      <line
                        key={`attack-link-${idx}`}
                        x1={fromPos.x} y1={fromPos.y}
                        x2={toPos.x} y2={toPos.y}
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="5 3"
                        className="animate-pulse"
                      />
                    );
                  })}

                  {/* Nodes circles/symbols */}
                  {Object.keys(nodePositions).map(nodeId => {
                    const pos = nodePositions[nodeId];
                    const device = devices.find(d => d.deviceId === nodeId) || {};
                    const NodeIcon = deviceIconMap[nodeId] || Shield;
                    
                    const isSelected = selectedDeviceId === nodeId;
                    const isCompromised = device.status === 'compromised';
                    const isIsolated = device.status === 'isolated';

                    let strokeColor = '#1e293b';
                    let fillColor = '#020617';
                    let iconColor = 'text-slate-400';

                    if (isCompromised) {
                      strokeColor = '#ef4444';
                      fillColor = '#ef4444'; // Hacked node gets colored full red
                      iconColor = 'text-white';
                    } else if (isIsolated) {
                      strokeColor = '#f59e0b';
                      fillColor = '#78350f';
                      iconColor = 'text-amber-300';
                    } else if (device.status === 'drift') {
                      strokeColor = '#f59e0b';
                      fillColor = '#1e1b4b';
                      iconColor = 'text-amber-300';
                    } else {
                      strokeColor = isSelected ? '#00f0ff' : '#1e293b';
                      iconColor = isSelected ? 'text-cyber-cyan' : 'text-slate-400';
                    }

                    return (
                      <g
                        key={nodeId}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => {
                          setSelectedDeviceId(nodeId);
                          setMapSelectedDevice(device);
                        }}
                        className="cursor-pointer group"
                      >
                        {/* Selector ring */}
                        {isSelected && (
                          <circle r="23" fill="none" stroke="#00f0ff" strokeWidth="1" strokeDasharray="3 3" className="animate-spin-slow" />
                        )}

                        {isIsolated && (
                          <circle r="21" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 2" />
                        )}

                        {isCompromised && (
                          <circle r="21" fill="none" stroke="#ef4444" strokeWidth="2" className="animate-ping" />
                        )}

                        {/* Base Node */}
                        <circle
                          r="16"
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth="2"
                          className={`transition-all duration-300 ${isCompromised ? 'animate-glow-red' : ''}`}
                        />
                        
                        {/* Lucide Icon */}
                        <g transform="translate(-7, -7)" className={iconColor}>
                          <NodeIcon size={14} />
                        </g>

                        {/* Label */}
                        <text
                          y="28"
                          textAnchor="middle"
                          fill={isCompromised ? '#ef4444' : isSelected ? '#00f0ff' : '#64748b'}
                          className="text-[8px] font-mono font-bold select-none group-hover:fill-white transition-colors"
                        >
                          {pos.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Topology selected node drawer controller (Right 4 Columns) */}
            <div className="xl:col-span-4 flex flex-col gap-4">
              {mapSelectedDevice ? (
                <div className="bg-cyber-gray border border-slate-850 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-white">{mapSelectedDevice.deviceName}</h4>
                      <span className="text-[9px] font-mono text-slate-500 block mt-1">{mapSelectedDevice.deviceId}</span>
                    </div>
                    <button 
                      onClick={() => setMapSelectedDevice(null)} 
                      className="text-slate-500 hover:text-slate-300 text-sm font-bold font-mono"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-2 text-[10px] font-mono">
                    <div className="flex justify-between border-b border-slate-900 py-1.5">
                      <span className="text-slate-500">IP ADDRESS:</span>
                      <span className="text-slate-300">{mapSelectedDevice.ipAddress}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 py-1.5">
                      <span className="text-slate-500">BEHAVIORAL STATE:</span>
                      <span className={`uppercase font-bold ${
                        mapSelectedDevice.status === 'compromised' ? 'text-cyber-red animate-pulse' :
                        mapSelectedDevice.status === 'isolated' ? 'text-cyber-amber' : 'text-cyber-green'
                      }`}>{mapSelectedDevice.status}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 py-1.5">
                      <span className="text-slate-500">TRUST SCORE:</span>
                      <span className="text-white font-bold">{Math.round(mapSelectedDevice.trustScore)}%</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 py-1.5">
                      <span className="text-slate-500">DEVICE TYPE:</span>
                      <span className="text-slate-400 capitalize">{mapSelectedDevice.deviceType || 'IoT Endpoint'}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {(mapSelectedDevice.status === 'isolated' || mapSelectedDevice.isolated) ? (
                      <div className="w-full py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-center text-xs rounded-xl font-mono">
                        QUARANTINED (COMMUNICATION BLOCKED)
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleIsolateDevice(mapSelectedDevice.deviceId)}
                          disabled={actionLoading !== null}
                          className="w-full py-2 bg-amber-500 text-black hover:bg-amber-400 font-bold text-center text-xs rounded-xl font-mono transition-all active:scale-95"
                        >
                          Execute Firewall Isolation
                        </button>
                        <button
                          onClick={() => handleSimulateAttack(mapSelectedDevice.deviceId, 'compromise')}
                          disabled={actionLoading !== null}
                          className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-center text-xs rounded-xl font-mono transition-all"
                        >
                          Trigger Simulated Attack
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-cyber-gray border border-slate-850 rounded-2xl p-6 text-center shadow-lg font-mono text-xs text-slate-500 flex flex-col items-center justify-center h-[300px]">
                  <Network className="h-8 w-8 text-slate-600 mb-3 animate-pulse" />
                  <span>Click any node in the topology layout to examine routing state or override local connection lines.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==============================================
            PAGE 3: AI SECURITY ENGINE DIAGNOSTICS VIEW
            ============================================== */}
        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            
            {/* Left 6 Columns: Scrollable AI Inference Logs Feed */}
            <div className="xl:col-span-6 bg-cyber-gray border border-slate-850 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
              <div>
                <h2 className="text-xs font-bold tracking-wider font-mono text-white uppercase flex items-center gap-2">
                  <Brain className="h-4 w-4 text-cyber-cyan" /> COGNITIVE AI INFERENCE ANALYSIS TIMELINE
                </h2>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Live reports updated by JavaScript simulation drift assessor every 5 seconds.
                </p>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-2">
                {devices.map(device => {
                  const hasAnomaly = device.status === 'compromised' || device.status === 'drift';
                  const reasoning = device.aiReasoning || {};
                  
                  return (
                    <div 
                      key={device.deviceId} 
                      className={`p-4 border rounded-xl font-mono text-[11px] ${
                        device.status === 'compromised'
                          ? 'border-red-500/40 bg-red-950/5'
                          : device.status === 'drift'
                          ? 'border-amber-500/40 bg-amber-950/5'
                          : 'border-slate-900 bg-slate-950'
                      }`}
                    >
                      <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{device.deviceName}</span>
                          <span className="text-[9px] text-slate-600">({device.deviceId})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500">Conf: <strong className="text-white">{reasoning.confidence || 95}%</strong></span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            reasoning.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                            reasoning.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                            'bg-slate-900 text-slate-400'
                          }`}>{reasoning.severity || 'INFO'}</span>
                        </div>
                      </div>
                      
                      <div className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-line">
                        {reasoning.analysis || 'Analyzing telemetries packet variance...'}
                      </div>

                      <div className="mt-3 flex justify-between items-center text-[9px] text-slate-500 pt-2 border-t border-slate-900/60">
                        <span>Threat Classifier: <strong className="text-slate-300">{reasoning.threat_type || 'None'}</strong></span>
                        <span>Last Checked: {device.lastUpdated ? new Date(device.lastUpdated).toLocaleTimeString() : 'Active'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 6 Columns: AI Diagnostics Charts & Overall Metrics */}
            <div className="xl:col-span-6 flex flex-col gap-4">
              
              {/* Overall AI metrics card */}
              <div className="bg-cyber-gray border border-slate-850 rounded-2xl p-5 shadow-lg grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Classifier Accuracy</span>
                  <span className="text-lg font-bold text-cyber-cyan font-mono mt-1">98.42%</span>
                  <span className="text-[8px] text-slate-600 mt-1 font-mono">Convolutional Drift Engine</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Classification Lag</span>
                  <span className="text-lg font-bold text-white font-mono mt-1">14ms</span>
                  <span className="text-[8px] text-slate-600 mt-1 font-mono">Real-time edge polling</span>
                </div>
              </div>

              {/* Protocol Entropy Drift Deviation chart */}
              <div className="bg-cyber-gray border border-slate-850 rounded-2xl p-4 shadow-lg flex-1 flex flex-col gap-3">
                <div>
                  <h3 className="text-xs font-bold tracking-wider font-mono text-white uppercase flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-cyber-cyan" /> PROTOCOL ENTROPY DEVANCE (LIVE VS BASELINE)
                  </h3>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                    Bar levels match policy entropy. Anomalous protocol drifts trigger spikes above base values.
                  </p>
                </div>
                
                <div className="h-[240px] w-full flex-1 min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={devices.map(d => ({
                        name: d.deviceName.substring(0, 10),
                        current: parseFloat(d.currentFeatures?.protocol_entropy || 0),
                        baseline: parseFloat(d.baselineFeatures?.protocol_entropy || 0)
                      }))}
                      margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#475569" fontSize={8} />
                      <YAxis stroke="#475569" fontSize={8} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0e17', borderColor: '#334155' }} />
                      <Bar dataKey="baseline" fill="#475569" name="Baseline" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="current" fill="#00f0ff" name="Live Entropy" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex flex-col gap-1.5 font-mono text-[9px] text-slate-400">
                  <span className="font-bold text-slate-500 uppercase text-[8px]">Diagnostics rule check</span>
                  <div className="flex justify-between items-center"><span className="text-slate-500">Anomaly Drift Trigger Level:</span><span className="text-white">Entropy Dev &gt; 0.40</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500">Classifier confidence trigger:</span><span className="text-white">Confidence &gt; 85%</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER INCIDENT LOGS TICKER (Always visible at the bottom) */}
      <footer className="mt-auto border-t border-slate-800 bg-cyber-gray p-4 flex flex-col sm:flex-row gap-4 justify-between items-stretch">
        <div className="flex items-center gap-2 text-slate-400 font-mono text-xs min-w-[200px]">
          <Terminal className="h-4 w-4 text-cyber-cyan animate-pulse" />
          <span>[CYBER SECURITY ALERTS TICKER]</span>
        </div>
        
        <div className="flex-1 bg-slate-950 border border-slate-850 rounded px-4 py-2 font-mono text-[10px] max-h-[80px] overflow-y-auto flex flex-col gap-1 pr-2">
          {alertHistory && alertHistory.length > 0 ? (
            alertHistory.map((alert, idx) => {
              let alertClass = 'text-slate-400';
              if (alert.severity === 'CRITICAL') alertClass = 'text-red-400 font-bold';
              else if (alert.severity === 'WARNING') alertClass = 'text-amber-400';
              
              const time = new Date(alert.timestamp).toLocaleTimeString([], { hour12: false });
              return (
                <div key={idx} className={`flex items-start gap-2 ${alertClass}`}>
                  <span className="text-slate-600">[{time}]</span>
                  <span className="text-cyber-cyan">[{alert.type}]</span>
                  <span>{alert.description}</span>
                </div>
              );
            })
          ) : (
            <div className="text-slate-600 text-center py-2">System monitoring active. Network telemetry packets ingestion normal...</div>
          )}
        </div>
      </footer>

      {/* ⚡ FLOATING DEMO PANEL TRIGGERS */}
      <div className="fixed bottom-20 right-6 z-40">
        <button
          onClick={() => setIsSimPanelOpen(prev => !prev)}
          className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full font-mono text-xs font-bold tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.5)] border border-red-500 animate-pulse active:scale-95 transition-all"
        >
          <Sliders className="h-4 w-4" /> ⚡ DEMO PANEL
        </button>
      </div>

      {/* 🎛️ DEMO CONTROLS DRAWER (Slide-out Panel) */}
      {isSimPanelOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-slate-950/95 backdrop-blur-md border-l border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-5 flex flex-col gap-4 animate-slideIn">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">Demo Control Station</h3>
                <span className="text-[8px] text-slate-500 font-mono">Live exploit triggers</span>
              </div>
            </div>
            <button 
              onClick={() => setIsSimPanelOpen(false)}
              className="text-slate-500 hover:text-slate-200 font-bold font-mono text-xs"
            >
              ✕
            </button>
          </div>

          <p className="text-[10px] font-mono text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-900">
            ⚠️ Trigger attacks on devices in real-time. Watch their topology nodes blink, alert tickers update, and sever connection paths.
          </p>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
            {devices.map(dev => {
              const isCompromised = dev.status === 'compromised';
              const isIsolated = dev.status === 'isolated' || dev.isolated;
              const DeviceIcon = deviceIconMap[dev.deviceId] || Shield;

              return (
                <div key={dev.deviceId} className="bg-slate-900/80 border border-slate-850 p-2.5 rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <DeviceIcon className={`h-3.5 w-3.5 flex-shrink-0 ${isCompromised ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-bold text-white truncate">{dev.deviceName}</span>
                    </div>
                    <span className={`text-[8px] font-mono uppercase px-1 rounded ${
                      isCompromised ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                      isIsolated ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                      'bg-slate-950 text-slate-500 border border-slate-900'
                    }`}>{dev.status}</span>
                  </div>

                  <div className="flex gap-1.5">
                    {!isIsolated ? (
                      <>
                        <button
                          onClick={() => handleSimulateAttack(dev.deviceId, 'compromise')}
                          disabled={actionLoading !== null}
                          className={`flex-1 py-1 text-[8px] font-mono font-bold rounded ${
                            isCompromised
                              ? 'bg-red-600/20 text-red-500 border border-red-500/30'
                              : 'bg-red-600 hover:bg-red-500 text-white'
                          }`}
                        >
                          {isCompromised ? 'Compromised' : 'Simulate Hack'}
                        </button>
                        <button
                          onClick={() => handleIsolateDevice(dev.deviceId)}
                          disabled={actionLoading !== null}
                          className="py-1 px-2.5 bg-amber-500 text-black hover:bg-amber-400 text-[8px] font-mono font-bold rounded"
                        >
                          Isolate
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-mono font-bold rounded">
                        Isolated Firewall Quarantine
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-900 pt-3 flex gap-2">
            <button
              onClick={handleResetSystem}
              disabled={actionLoading === 'reset'}
              className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white font-mono text-[9.5px] rounded border border-slate-800 transition-all text-center font-bold"
            >
              RESET ALL SIMULATIONS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
