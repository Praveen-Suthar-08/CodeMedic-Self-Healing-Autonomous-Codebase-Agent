import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeartbeatMonitor } from './components/HeartbeatMonitor';
import { DashboardView } from './components/DashboardView';
import { IncidentDetailView } from './components/IncidentDetailView';
import { AdminAnalytics } from './components/AdminAnalytics';
import { AndroidCompanion } from './components/AndroidCompanion';
import { RepoSettings } from './components/RepoSettings';
import { IngestModal } from './components/IngestModal';
import { Incident, Repository } from './types';
import { SEED_INCIDENTS, SEED_REPOSITORIES } from './data/seedData';

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>(SEED_INCIDENTS);
  const [repositories, setRepositories] = useState<Repository[]>(SEED_REPOSITORIES);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(SEED_INCIDENTS[0]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'detail' | 'analytics' | 'android' | 'settings'>('dashboard');
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isHealing, setIsHealing] = useState(false);

  // Load from API on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [incRes, repoRes] = await Promise.all([
        fetch('/api/incidents'),
        fetch('/api/repos'),
      ]);
      const incData = await incRes.json();
      const repoData = await repoRes.json();

      if (incData.success && incData.incidents) {
        setIncidents(incData.incidents);
        if (selectedIncident) {
          const updatedSelected = incData.incidents.find((i: Incident) => i.id === selectedIncident.id);
          if (updatedSelected) setSelectedIncident(updatedSelected);
        }
      }
      if (repoData.success && repoData.repositories) {
        setRepositories(repoData.repositories);
      }
    } catch (err) {
      console.warn('API server load fallback to initial state:', err);
    }
  };

  const handleSelectIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setCurrentView('detail');
  };

  const handleRunPipeline = async (id: string) => {
    setIsHealing(true);
    try {
      const res = await fetch(`/api/incidents/${id}/pipeline/run`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.incident) {
        setIncidents((prev) => prev.map((inc) => (inc.id === id ? data.incident : inc)));
        if (selectedIncident?.id === id) {
          setSelectedIncident(data.incident);
        }
      }
    } catch (err) {
      console.error('Failed to run pipeline:', err);
    } finally {
      setIsHealing(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer: 'Arjun (On-Call Engineer)', autoMerged: false }),
      });
      const data = await res.json();
      if (data.success && data.incident) {
        setIncidents((prev) => prev.map((inc) => (inc.id === id ? data.incident : inc)));
        if (selectedIncident?.id === id) {
          setSelectedIncident(data.incident);
        }
        // refresh repo stats
        fetch('/api/repos')
          .then((r) => r.json())
          .then((d) => d.success && setRepositories(d.repositories));
      }
    } catch (err) {
      console.error('Failed to approve incident:', err);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, reviewer: 'Dev (On-Call Engineer)' }),
      });
      const data = await res.json();
      if (data.success && data.incident) {
        setIncidents((prev) => prev.map((inc) => (inc.id === id ? data.incident : inc)));
        if (selectedIncident?.id === id) {
          setSelectedIncident(data.incident);
        }
        // refresh repo stats to reflect calibrated risk penalty
        fetch('/api/repos')
          .then((r) => r.json())
          .then((d) => d.success && setRepositories(d.repositories));
      }
    } catch (err) {
      console.error('Failed to reject incident:', err);
    }
  };

  const handleBulkApprove = async (ids: string[]) => {
    try {
      const res = await fetch('/api/incidents/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentIds: ids, reviewer: 'Dev (Bulk Action)' }),
      });
      const data = await res.json();
      if (data.success && data.incidents) {
        const updatedMap = new Map<string, Incident>(data.incidents.map((i: Incident) => [i.id, i]));
        setIncidents((prev) => prev.map((inc) => updatedMap.get(inc.id) || inc));
        fetch('/api/repos')
          .then((r) => r.json())
          .then((d) => d.success && setRepositories(d.repositories));
      }
    } catch (err) {
      console.error('Failed to bulk approve:', err);
    }
  };

  const handleBulkArchive = async (ids: string[]) => {
    try {
      const res = await fetch('/api/incidents/bulk-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentIds: ids, reviewer: 'Dev (Bulk Action)' }),
      });
      const data = await res.json();
      if (data.success && data.incidents) {
        const updatedMap = new Map<string, Incident>(data.incidents.map((i: Incident) => [i.id, i]));
        setIncidents((prev) => prev.map((inc) => updatedMap.get(inc.id) || inc));
      }
    } catch (err) {
      console.error('Failed to bulk archive:', err);
    }
  };

  const handleReRunSandbox = async (id: string) => {
    setIsHealing(true);
    try {
      const inc = incidents.find((i) => i.id === id);
      if (!inc) return;

      const res = await fetch('/api/sandbox/run-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId: id, repoId: inc.repoId, proposedFix: inc.proposedFix }),
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      }
    } catch (err) {
      console.error('Failed to re-run sandbox:', err);
    } finally {
      setIsHealing(false);
    }
  };

  const handleReDiagnose = async (id: string) => {
    handleRunPipeline(id);
  };

  const handleIngestSuccess = (newIncident: Incident) => {
    setIncidents((prev) => [newIncident, ...prev]);
    setSelectedIncident(newIncident);
    setCurrentView('detail');
    // Automatically trigger autonomous diagnosis & pipeline for the newly ingested bug!
    handleRunPipeline(newIncident.id);
  };

  const handleUpdateRepo = (id: string, updates: Partial<Repository>) => {
    setRepositories((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const activeIncidents = incidents.filter(
    (i) => i.status !== 'merged' && i.status !== 'rejected' && i.status !== 'auto_pr_created'
  );

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#C9D1D9] flex flex-col selection:bg-blue-500/30">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenIngest={() => setIsIngestOpen(true)}
        activeIncidentCount={activeIncidents.length}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 space-y-6">
        {/* Heartbeat Status Bar */}
        <HeartbeatMonitor
          isHealing={isHealing}
          incidentCount={incidents.length}
          statusText={
            isHealing
              ? 'Agent Surgery in Progress: Executing Isolated Docker Sandbox Tests...'
              : activeIncidents.length > 0
              ? `${activeIncidents.length} incidents awaiting autonomous resolution`
              : 'All connected repositories healthy & nominal'
          }
        />

        {/* View Switcher Routing */}
        {currentView === 'dashboard' && (
          <DashboardView
            incidents={incidents}
            repositories={repositories}
            onSelectIncident={handleSelectIncident}
            onOpenIngest={() => setIsIngestOpen(true)}
            onRunPipeline={handleRunPipeline}
            onBulkApprove={handleBulkApprove}
            onBulkArchive={handleBulkArchive}
          />
        )}

        {currentView === 'detail' && selectedIncident && (
          <IncidentDetailView
            incident={selectedIncident}
            repository={repositories.find((r) => r.id === selectedIncident.repoId)}
            onBack={() => setCurrentView('dashboard')}
            onApprove={handleApprove}
            onReject={handleReject}
            onRunPipeline={handleRunPipeline}
            onReRunSandbox={handleReRunSandbox}
            onReDiagnose={handleReDiagnose}
          />
        )}

        {currentView === 'analytics' && (
          <AdminAnalytics repositories={repositories} />
        )}

        {currentView === 'android' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 flex justify-center">
              <AndroidCompanion
                incident={selectedIncident || incidents[0]}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            </div>

            <div className="lg:col-span-7 space-y-5 p-6 bg-[#161B22] border border-[#21262D] rounded-2xl">
              <div>
                <h3 className="text-base font-semibold text-[#F0F6FC]">
                  📱 Android On-Call Mobile Companion Mode
                </h3>
                <p className="text-xs text-[#8B949E] mt-1">
                  Engineers on-call receive instant FCM high-priority push notifications at 2 AM with complete root cause diagnoses and verified diff patches.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-[#0D1117] border border-[#21262D] rounded-xl space-y-1">
                  <span className="font-semibold text-emerald-400 block">
                    ✓ Swipe-Right-to-Approve Gesture
                  </span>
                  <p className="text-[#8B949E]">
                    Approves the patch and immediately opens a verified GitHub PR or auto-merges into main branch with zero friction.
                  </p>
                </div>

                <div className="p-3.5 bg-[#0D1117] border border-[#21262D] rounded-xl space-y-1">
                  <span className="font-semibold text-red-400 block">
                    ✓ Swipe-Left-to-Reject Gesture
                  </span>
                  <p className="text-[#8B949E]">
                    Rejects the fix, logs reason, and triggers CodeMedic's <strong className="text-[#C9D1D9]">Learning Loop calibration</strong> to dynamically adjust confidence in that file path.
                  </p>
                </div>

                <div className="p-3.5 bg-[#0D1117] border border-[#21262D] rounded-xl space-y-1">
                  <span className="font-semibold text-amber-400 block">
                    ✓ Offline Queue & Resilient Sync
                  </span>
                  <p className="text-[#8B949E]">
                    Decisions made in low-connectivity environments are safely queued in local Room DB and synchronized upon reconnection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'settings' && (
          <RepoSettings
            repositories={repositories}
            onUpdateRepo={handleUpdateRepo}
            onIngestSuccess={handleIngestSuccess}
          />
        )}
      </main>

      {/* Ingest Error Modal */}
      <IngestModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        repositories={repositories}
        onIngestSuccess={handleIngestSuccess}
      />
    </div>
  );
}
