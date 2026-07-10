import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchGlobalInteractions, deleteInteraction, setFormForEdit } from '../../store/interactionSlice';
import { loadHCPList } from '../../store/hcpSlice';
import { 
  History, 
  Calendar, 
  MapPin, 
  Search, 
  Users, 
  ChevronRight,
  TrendingUp,
  Clock,
  Trash2,
  Edit
} from 'lucide-react';

const InteractionHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { history, loading } = useSelector((state) => state.interaction);
  const { allHCPs } = useSelector((state) => state.hcp);

  const [selectedHcpId, setSelectedHcpId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchGlobalInteractions());
    dispatch(loadHCPList());
  }, [dispatch]);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this interaction? This action cannot be undone.")) {
      dispatch(deleteInteraction(id));
    }
  };

  const handleEdit = (visit) => {
    dispatch(setFormForEdit(visit));
    navigate('/log');
  };


  // Filtering Logic
  const filteredHistory = history.filter((visit) => {
    // 1. Doctor Filter
    if (selectedHcpId && visit.hcp_id !== selectedHcpId) {
      return false;
    }
    // 2. Keyword Search (Fuzzy on Doctor, Hospital, Summary, Products)
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchDoc = visit.doctor_name.toLowerCase().includes(s);
      const matchHosp = visit.hospital_name.toLowerCase().includes(s);
      const matchSummary = (visit.summary || '').toLowerCase().includes(s);
      const matchProd = visit.products_discussed.some(p => p.toLowerCase().includes(s));
      
      return matchDoc || matchHosp || matchSummary || matchProd;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight sm:text-3xl">Interaction History</h1>
        <p className="mt-1 text-sm text-slate-400">
          Chronological record of all client engagements, sample distributions, and representative notes.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 glass-panel">
        {/* Search Term input */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Filter history by keyword, summary, or product discussed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/80 transition text-xs"
          />
        </div>

        {/* Doctor Filter Select */}
        <div>
          <select
            value={selectedHcpId}
            onChange={(e) => setSelectedHcpId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-400 focus:outline-none focus:border-indigo-500 text-xs"
          >
            <option value="">-- All Doctors / HCPs --</option>
            {allHCPs.map((hcp) => (
              <option key={hcp.id} value={hcp.id}>
                Dr. {hcp.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History Lists */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            <span className="text-xs text-slate-400">Fetching records...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-850 rounded-2xl">
            <span className="text-xs text-slate-500">No matching interactions logged in logs.</span>
          </div>
        ) : (
          filteredHistory.map((visit) => (
            <div 
              key={visit.id}
              className="glass-card p-5 flex flex-col md:flex-row md:items-start justify-between gap-6"
            >
              {/* Visit Details */}
              <div className="space-y-3 flex-1">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{visit.doctor_name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {visit.hospital_name}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-350 leading-relaxed pl-13">
                  {visit.summary || visit.feedback || "No summary provided."}
                </p>

                {visit.outcome && (
                  <div className="pl-13 flex items-start gap-1.5 text-xs">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px] mt-0.5 shrink-0">Outcome:</span>
                    <p className="text-slate-400">{visit.outcome}</p>
                  </div>
                )}

                {/* Badges/Tags footer */}
                <div className="flex flex-wrap items-center gap-2 pl-13 pt-2">
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Discussed:</span>
                  {visit.products_discussed.map(p => (
                    <span key={p} className="text-[9px] bg-slate-800 border border-slate-750 text-slate-300 px-2 py-0.5 rounded">
                      {p}
                    </span>
                  ))}
                  {Object.keys(visit.samples_distributed).length > 0 && (
                    <>
                      <span className="text-[9px] text-slate-500 font-semibold uppercase mx-1">|</span>
                      <span className="text-[9px] text-slate-500 font-semibold uppercase">Samples:</span>
                      {Object.entries(visit.samples_distributed).map(([prod, qty]) => (
                        <span key={prod} className="text-[9px] bg-purple-950/50 border border-purple-900/35 text-purple-400 px-2 py-0.5 rounded font-mono">
                          {prod} ({qty})
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Timestamp block */}
              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2 border-t md:border-t-0 border-slate-850/60 pt-3 md:pt-0 shrink-0 text-right min-w-[120px]">
                <div className="bg-slate-900/50 border border-slate-850 px-3 py-1.5 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-400" /> {visit.meeting_date}
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-1">
                  <Clock className="h-3.5 w-3.5 text-slate-600" /> {visit.meeting_time} ({visit.meeting_type})
                </div>
                {visit.follow_up_date && (
                  <div className="text-[9px] text-indigo-400 font-semibold mt-3 flex items-center gap-1 uppercase tracking-wider">
                    Follow-up: {visit.follow_up_date}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3 justify-end w-full">
                  <button
                    onClick={() => handleEdit(visit)}
                    className="text-indigo-400 hover:text-indigo-300 p-1.5 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-950/20 hover:bg-indigo-950/40 transition duration-150 flex items-center gap-1 text-[10px]"
                    title="Edit Interaction"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(visit.id)}
                    className="text-red-500 hover:text-red-400 p-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 bg-red-950/20 hover:bg-red-950/40 transition duration-150 flex items-center gap-1 text-[10px]"
                    title="Delete Interaction"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InteractionHistory;
