import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchHCPs, selectHCP } from '../../store/hcpSlice';
import { fetchInteractionHistory, updateFormField } from '../../store/interactionSlice';
import { HCPCard } from './HCPComponents';
import { 
  Search, 
  Plus, 
  CheckCircle2
} from 'lucide-react';

const HCPSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { searchResults, loading: hcpLoading } = useSelector((state) => state.hcp);
  const { history, loading: historyLoading } = useSelector((state) => state.interaction);

  const [query, setQuery] = useState('');
  const [expandedHcpId, setExpandedHcpId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (location.state?.newlyAdded) {
      const name = location.state.newlyAdded;
      setQuery(name);
      dispatch(searchHCPs(name));
      setSuccessMessage('HCP Registered Successfully');
      
      // Clear navigation state so reload doesn't trigger toast again
      navigate(location.pathname, { replace: true, state: {} });
      
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      // Default initial query on mount
      dispatch(searchHCPs(''));
    }
  }, [dispatch, location.state, navigate, location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(searchHCPs(query));
  };

  const handleToggleHistory = async (hcp) => {
    if (expandedHcpId === hcp.id) {
      setExpandedHcpId(null);
    } else {
      setExpandedHcpId(hcp.id);
      dispatch(fetchInteractionHistory(hcp.id));
    }
  };

  const handleLogVisit = (hcp) => {
    const docName = hcp.doctor_name || `Dr. ${hcp.first_name} ${hcp.last_name}`;
    const hospName = hcp.hospital || hcp.hospital_name;
    dispatch(selectHCP(hcp));
    dispatch(updateFormField({ field: 'hcp_id', value: hcp.id }));
    dispatch(updateFormField({ field: 'doctor_name', value: docName }));
    dispatch(updateFormField({ field: 'hospital_name', value: hospName }));
    navigate('/log');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight sm:text-3xl">HCP Lookup</h1>
          <p className="mt-1 text-sm text-slate-400">
            Find registered Healthcare Professionals and review previous discussion histories before scheduling new visits.
          </p>
        </div>
        <button
          onClick={() => navigate('/add-hcp')}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs transition duration-150 active:scale-95 shadow-lg shadow-indigo-600/20 text-white cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add New HCP
        </button>
      </div>

      {/* Success alert message */}
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-800 bg-emerald-950/40 text-emerald-400 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <Search className="h-5 w-5" />
          </span>
          <input
            type="text"
            placeholder="Search by Doctor Name, Specialization, or Hospital..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-850 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition duration-200 text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition duration-150 active:scale-95 shadow-lg shadow-indigo-600/10 cursor-pointer text-white"
        >
          Search
        </button>
      </form>

      {/* Results Container */}
      <div className="space-y-4">
        {hcpLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            <span className="text-sm text-slate-400">Querying database...</span>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-850 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4">
            <span className="text-sm text-slate-500 block">No matching Healthcare Professional found.</span>
            <button
              type="button"
              onClick={() => navigate('/add-hcp')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs transition text-white active:scale-95 shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add New HCP
            </button>
          </div>
        ) : (
          searchResults.map((hcp) => {
            const isExpanded = expandedHcpId === hcp.id;
            return (
              <HCPCard
                key={hcp.id}
                hcp={hcp}
                isExpanded={isExpanded}
                onToggleHistory={handleToggleHistory}
                onLogVisit={handleLogVisit}
                history={history}
                historyLoading={historyLoading}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default HCPSearch;
