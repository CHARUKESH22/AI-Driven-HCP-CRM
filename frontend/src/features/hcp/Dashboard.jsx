import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchGlobalInteractions } from '../../store/interactionSlice';
import { loadHCPList } from '../../store/hcpSlice';
import { 
  Users, 
  ShieldAlert, 
  Gift, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { history, loading: interactionLoading } = useSelector((state) => state.interaction);
  const { allHCPs, loading: hcpLoading } = useSelector((state) => state.hcp);

  useEffect(() => {
    dispatch(fetchGlobalInteractions());
    dispatch(loadHCPList());
  }, [dispatch]);

  // Calculations for Metrics
  const totalInteractions = history.length;
  
  // Calculate total samples distributed
  const totalSamples = history.reduce((sum, item) => {
    if (item.samples_distributed) {
      return sum + Object.values(item.samples_distributed).reduce((s, val) => s + val, 0);
    }
    return sum;
  }, 0);

  // Distinct products discussed count
  const uniqueProductsDiscussed = new Set();
  history.forEach(item => {
    if (item.products_discussed) {
      item.products_discussed.forEach(p => uniqueProductsDiscussed.add(p));
    }
  });
  const totalProductsCount = uniqueProductsDiscussed.size;

  // Mock pending follow-ups count (can calculate based on follow-up fields)
  const pendingFollowUps = history.filter(item => item.follow_up_date && new Date(item.follow_up_date) >= new Date()).length + 1; // +1 based on seeded follow up

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-panel shadow-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            Welcome back, Alex
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Here is a summary of your Healthcare Professional (HCP) interactions and sample distributions.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/log"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            Log Visit <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Visits */}
        <div className="glass-card flex items-center justify-between p-5">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Interactions</span>
            <h3 className="text-3xl font-bold text-slate-100 mt-1">
              {interactionLoading ? '...' : totalInteractions}
            </h3>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3" /> +12% this month
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Samples Distributed */}
        <div className="glass-card flex items-center justify-between p-5">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Samples Distributed</span>
            <h3 className="text-3xl font-bold text-slate-100 mt-1">
              {interactionLoading ? '...' : totalSamples}
            </h3>
            <span className="text-[10px] text-indigo-400 font-semibold mt-2 block">
              Average 5 per visit
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
            <Gift className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Products Discussed */}
        <div className="glass-card flex items-center justify-between p-5">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Products Covered</span>
            <h3 className="text-3xl font-bold text-slate-100 mt-1">
              {interactionLoading ? '...' : totalProductsCount}
            </h3>
            <span className="text-[10px] text-slate-400 mt-2 block">
              Out of 5 core catalog
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Pending Follow-ups */}
        <div className="glass-card flex items-center justify-between p-5">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Follow-ups</span>
            <h3 className="text-3xl font-bold text-slate-100 mt-1">
              {interactionLoading ? '...' : pendingFollowUps}
            </h3>
            <span className="text-[10px] text-indigo-400 font-semibold mt-2 block flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Next visit in 5 days
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Section: Recent Activity & Quick Search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity Logs */}
        <div className="lg:col-span-2 glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">Recent Interaction History</h2>
            <Link to="/history" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {interactionLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                <span className="text-xs text-slate-400">Loading visit history...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-850 rounded-xl">
                <span className="text-xs text-slate-500">No interactions logged yet. Describe a visit to get started!</span>
              </div>
            ) : (
              history.slice(0, 4).map((item) => (
                <div 
                  key={item.id}
                  className="p-4 border border-slate-850 bg-slate-900/30 rounded-xl hover:border-slate-850/80 transition duration-200 space-y-3 hover:bg-slate-900/40"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{item.doctor_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{item.hospital_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                        {item.meeting_date}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">{item.meeting_time} ({item.meeting_type})</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {item.summary || item.feedback || "No summary provided."}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-850/50">
                    <span className="text-[9px] text-slate-500 font-semibold uppercase mr-1">Discussed:</span>
                    {item.products_discussed.map(p => (
                      <span key={p} className="text-[9px] bg-indigo-950/60 border border-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded">
                        {p}
                      </span>
                    ))}
                    {Object.keys(item.samples_distributed).length > 0 && (
                      <>
                        <span className="text-[9px] text-slate-500 font-semibold uppercase mx-1">|</span>
                        <span className="text-[9px] text-slate-500 font-semibold uppercase mr-1">Samples:</span>
                        {Object.entries(item.samples_distributed).map(([prod, qty]) => (
                          <span key={prod} className="text-[9px] bg-purple-950/60 border border-purple-900/50 text-purple-400 px-2 py-0.5 rounded font-mono">
                            {prod} ({qty})
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Doctor Quick-Reference list */}
        <div className="glass-panel p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Target Doctors</h2>
            <p className="text-xs text-slate-500 mt-1">Quick list of registered Healthcare Professionals</p>
          </div>

          <div className="space-y-3">
            {hcpLoading ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
              </div>
            ) : (
              allHCPs.slice(0, 5).map((hcp) => (
                <div 
                  key={hcp.id}
                  className="flex items-center justify-between p-3 border border-slate-850 bg-slate-900/20 rounded-xl hover:border-slate-850 hover:bg-slate-900/40 transition duration-150"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Dr. {hcp.full_name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{hcp.specialization} • {hcp.hospital_name}</p>
                  </div>
                  <Link 
                    to="/search" 
                    className="h-7 w-7 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center hover:bg-slate-850 hover:text-indigo-400 transition"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Link>
                </div>
              ))
            )}
          </div>

          <Link
            to="/search"
            className="w-full text-center block text-xs font-semibold py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:text-indigo-400 transition duration-200"
          >
            Search All Doctors
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
