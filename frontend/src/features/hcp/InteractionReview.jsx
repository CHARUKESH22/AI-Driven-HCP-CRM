import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchGlobalInteractions, deleteInteraction, setFormForEdit } from '../../store/interactionSlice';
import { 
  FileText, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckSquare, 
  Gift, 
  MessageSquareCode,
  UserCheck2,
  ListRestart,
  Trash2,
  Edit
} from 'lucide-react';

const InteractionReview = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { history, loading } = useSelector((state) => state.interaction);
  const [selectedVisit, setSelectedVisit] = useState(null);

  useEffect(() => {
    dispatch(fetchGlobalInteractions());
  }, [dispatch]);

  // Set the first visit as selected by default when history loads
  useEffect(() => {
    if (history.length > 0 && !selectedVisit) {
      setSelectedVisit(history[0]);
    }
  }, [history, selectedVisit]);

  const handleSelectVisit = (visit) => {
    setSelectedVisit(visit);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this interaction? This action cannot be undone.")) {
      dispatch(deleteInteraction(id))
        .unwrap()
        .then(() => {
          setSelectedVisit(null);
        })
        .catch((err) => {
          alert(err || "Failed to delete interaction.");
        });
    }
  };

  const handleEdit = (visit) => {
    dispatch(setFormForEdit(visit));
    navigate('/log');
  };


  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight sm:text-3xl">Interaction Review</h1>
        <p className="mt-1 text-sm text-slate-400">
          Inspect and audit logged interactions, clinical discussions, and sample audits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Recent logs selector list */}
        <div className="lg:col-span-1 glass-panel p-4 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-2">Logged Interactions</h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
          ) : history.length === 0 ? (
            <span className="text-xs text-slate-600 block text-center py-6">No records found.</span>
          ) : (
            <div className="space-y-2">
              {history.map((visit) => {
                const isSelected = selectedVisit && selectedVisit.id === visit.id;
                return (
                  <button
                    key={visit.id}
                    onClick={() => handleSelectVisit(visit)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs transition duration-150 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/20 text-indigo-300'
                        : 'border-slate-850 bg-slate-900/10 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <h4 className="font-bold text-slate-200">{visit.doctor_name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">{visit.hospital_name}</p>
                    <div className="flex justify-between items-center mt-2.5 text-[9px] text-slate-500">
                      <span>{visit.meeting_date}</span>
                      <span className="font-mono">{visit.meeting_time}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed report card */}
        <div className="lg:col-span-2 space-y-4">
          {selectedVisit ? (
            <div className="glass-panel p-6 shadow-2xl space-y-6">
              
              {/* Doctor Header */}
              <div className="flex items-start justify-between pb-5 border-b border-slate-800">
                <div className="space-y-1.5">
                  <span className="inline-block text-[9px] bg-indigo-950/60 border border-indigo-900/50 text-indigo-400 font-semibold px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                    Interaction Record Details
                  </span>
                  <h2 className="text-xl font-bold text-slate-100">{selectedVisit.doctor_name}</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" /> {selectedVisit.hospital_name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-300 justify-end">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" /> {selectedVisit.meeting_date}
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-slate-500 justify-end">
                    <Clock className="h-3.5 w-3.5 text-slate-600" /> {selectedVisit.meeting_time} ({selectedVisit.meeting_type})
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => handleEdit(selectedVisit)}
                      className="text-indigo-400 hover:text-indigo-300 p-1.5 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-950/20 hover:bg-indigo-950/40 transition duration-150 flex items-center gap-1 text-[10px]"
                      title="Edit Interaction"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit Record
                    </button>
                    <button
                      onClick={() => handleDelete(selectedVisit.id)}
                      className="text-red-500 hover:text-red-400 p-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 bg-red-950/20 hover:bg-red-950/40 transition duration-150 flex items-center gap-1 text-[10px]"
                      title="Delete Interaction"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Record
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left section: products & samples */}
                <div className="space-y-4">
                  {/* Products Discussed */}
                  <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare className="h-4 w-4 text-indigo-400" /> Products Discussed
                    </h4>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedVisit.products_discussed.length === 0 ? (
                        <span className="text-xs text-slate-600">No products recorded.</span>
                      ) : (
                        selectedVisit.products_discussed.map(p => (
                          <span key={p} className="text-xs bg-indigo-950/50 border border-indigo-900/30 text-indigo-400 px-2.5 py-1 rounded-lg">
                            {p}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Samples Distributed */}
                  <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Gift className="h-4 w-4 text-purple-400" /> Samples Audited
                    </h4>
                    <div className="space-y-1.5 pt-1">
                      {Object.keys(selectedVisit.samples_distributed).length === 0 ? (
                        <span className="text-xs text-slate-600">No samples distributed.</span>
                      ) : (
                        Object.entries(selectedVisit.samples_distributed).map(([prod, qty]) => (
                          <div key={prod} className="flex justify-between items-center text-xs text-slate-300 font-mono py-1 border-b border-slate-850/50">
                            <span>{prod}</span>
                            <span className="bg-purple-950 text-purple-300 border border-purple-900/40 px-2 py-0.5 rounded text-[10px] font-bold">
                              QTY: {qty}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right section: Feedback & follow up */}
                <div className="space-y-4">
                  {/* Doctor Feedback */}
                  <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck2 className="h-4 w-4 text-emerald-400" /> HCP Feedback & Response
                    </h4>
                    <p className="text-xs text-slate-350 leading-relaxed">
                      {selectedVisit.feedback || "No feedback recorded."}
                    </p>
                  </div>

                  {/* Next Step follow up */}
                  <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-blue-400" /> Planned Follow-up
                    </h4>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">Suggested Date:</span>
                      <span className="bg-blue-950 text-blue-300 border border-blue-900/40 px-2.5 py-0.5 rounded font-bold font-mono">
                        {selectedVisit.follow_up_date || 'No follow-up scheduled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI summary banner */}
              <div className="p-4 bg-indigo-950/15 border border-indigo-900/40 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquareCode className="h-4 w-4 text-indigo-400" /> AI Executive Summary
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{selectedVisit.summary || "No executive summary available. Complete visit notes to automatically generate a summary."}"
                </p>
              </div>

              {/* Action notes */}
              {selectedVisit.notes && (
                <div className="p-4 border border-slate-850 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-slate-400" /> Representative Notes
                  </h4>
                  <p className="text-xs text-slate-350 leading-relaxed">
                    {selectedVisit.notes}
                  </p>
                </div>
              )}

            </div>
          ) : (
            <div className="glass-panel border border-slate-800/80 rounded-2xl p-12 text-center shadow-xl">
              <span className="text-sm text-slate-650">Select a visit log from the sidebar to inspect.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractionReview;
