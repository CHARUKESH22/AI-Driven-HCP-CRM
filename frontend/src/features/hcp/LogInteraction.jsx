import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  loadProductsList, 
  updateFormField, 
  toggleProductDiscussed, 
  updateSampleQuantity, 
  resetForm, 
  saveInteraction,
  editInteraction,
  clearSuccess
} from '../../store/interactionSlice';
import { loadHCPList } from '../../store/hcpSlice';
import { addLocalUserMessage, sendChatMessage, clearChat } from '../../store/chatSlice';
import { 
  Sparkles, 
  Send, 
  RotateCcw, 
  Save, 
  Calendar, 
  Clock, 
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Gift,
  Bot
} from 'lucide-react';

const LogInteraction = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Form & Catalog State
  const { form, productsList, loading: dbLoading, error: dbError, success: dbSuccess } = useSelector((state) => state.interaction);
  const { allHCPs } = useSelector((state) => state.hcp);

  const isEditMode = !!form.id;

  // AI Chat State
  const { messages, loading: chatLoading, error: chatError } = useSelector((state) => state.chat);
  const [chatInput, setChatInput] = useState('');
  
  // Local Notifications state
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    dispatch(loadProductsList());
    dispatch(loadHCPList());
  }, [dispatch]);

  // Autoscroll chat history
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Form Save Success Banner
  useEffect(() => {
    if (dbSuccess) {
      setNotification({ 
        type: 'success', 
        message: isEditMode 
          ? 'HCP Interaction updated successfully!' 
          : 'HCP Interaction saved successfully to database!' 
      });
      const timer = setTimeout(() => {
        setNotification(null);
        dispatch(clearSuccess());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [dbSuccess, dispatch, isEditMode]);

  // Doctor Select Change: Updates Doctor and autofills Hospital mapping
  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    dispatch(updateFormField({ field: 'hcp_id', value: doctorId }));
    
    const hcp = allHCPs.find(h => h.id === doctorId);
    if (hcp) {
      dispatch(updateFormField({ field: 'doctor_name', value: `Dr. ${hcp.full_name}` }));
      dispatch(updateFormField({ field: 'hospital_name', value: hcp.hospital_name }));
    } else {
      dispatch(updateFormField({ field: 'doctor_name', value: '' }));
      dispatch(updateFormField({ field: 'hospital_name', value: '' }));
    }
  };

  const handleInputChange = (field, value) => {
    dispatch(updateFormField({ field, value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.hcp_id) {
      setNotification({ type: 'error', message: 'Please select a Doctor/HCP first.' });
      return;
    }
    if (isEditMode) {
      dispatch(editInteraction({ id: form.id, data: form }));
    } else {
      dispatch(saveInteraction(form));
    }
  };

  const handleFormReset = () => {
    dispatch(resetForm());
    setNotification(null);
  };

  // AI Chat Submit Handler
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setChatInput('');
    
    // 1. Append user message to UI
    dispatch(addLocalUserMessage(userMessage));
    
    // 2. Dispatch thunk to query AI and sync form state
    dispatch(sendChatMessage(userMessage));
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            {isEditMode ? 'Edit Interaction' : 'Log Interaction'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isEditMode 
              ? `Modifying interaction record for ${form.doctor_name || 'HCP'}. Make changes below and click Update.`
              : 'Log visit details manually using the traditional form, or describe the interaction to the AI assistant to autofill the record.'}
          </p>
        </div>
      </div>

      {/* Local Notification banner */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fadeIn ${
          notification.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' 
            : 'bg-red-950/40 border-red-800 text-red-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Main Workspace Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* LEFT COLUMN: Traditional Form */}
        <div className="glass-panel p-6 shadow-2xl space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {isEditMode ? 'Edit Mode' : 'Structured Form'}
            </h2>
            <div className="flex gap-2">
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    dispatch(resetForm());
                    navigate(-1); // Go back to history or review
                  }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 hover:bg-red-950/20 border border-red-900/35 px-2 py-1 rounded"
                >
                  Cancel Edit
                </button>
              )}
              <button 
                type="button" 
                onClick={handleFormReset}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 hover:bg-slate-900 border border-slate-850 px-2 py-1 rounded"
              >
                <RotateCcw className="h-3 w-3" /> {isEditMode ? 'Clear changes' : 'Reset'}
              </button>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {/* Doctor Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Doctor / HCP</label>
              <select
                value={form.hcp_id}
                onChange={handleDoctorChange}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
              >
                <option value="">-- Select HCP Profile --</option>
                {allHCPs.map(h => (
                  <option key={h.id} value={h.id}>
                    Dr. {h.full_name} ({h.specialization})
                  </option>
                ))}
              </select>
            </div>

            {/* Hospital (Disabled - auto derived from doctor) */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hospital</label>
              <input
                type="text"
                value={form.hospital_name}
                disabled
                placeholder="Derived from selected HCP profile"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-850 text-slate-500 text-sm cursor-not-allowed"
              />
            </div>

            {/* Date & Time Picker */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Visit Date
                </label>
                <input
                  type="date"
                  value={form.meeting_date}
                  onChange={(e) => handleInputChange('meeting_date', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Visit Time
                </label>
                <input
                  type="time"
                  value={form.meeting_time}
                  onChange={(e) => handleInputChange('meeting_time', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            {/* Meeting Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Meeting Type</label>
              <div className="grid grid-cols-4 gap-2">
                {['In-Person', 'Virtual', 'Phone', 'Email'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange('meeting_type', type)}
                    className={`py-2 text-center rounded-lg text-xs font-semibold border transition ${
                      form.meeting_type === type
                        ? 'border-indigo-500 bg-indigo-950/20 text-indigo-400'
                        : 'border-slate-850 bg-slate-950/40 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Discussed Checkbox Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Products Discussed</label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/50 rounded-xl border border-slate-850">
                {productsList.map((p) => {
                  const isChecked = form.products_discussed.includes(p.name);
                  return (
                    <label key={p.id} className="flex items-center gap-2.5 p-1 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => dispatch(toggleProductDiscussed(p.name))}
                        className="rounded border-slate-800 bg-slate-900 text-indigo-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                      />
                      <span>{p.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Samples Distributed Counter (Enabled only for discussed products) */}
            {form.products_discussed.length > 0 && (
              <div className="p-3 bg-purple-950/10 border border-purple-900/30 rounded-xl space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5" /> Sample Distribution Logs
                </span>
                <div className="space-y-2">
                  {form.products_discussed.map((name) => {
                    const qty = form.samples_distributed[name] || 0;
                    return (
                      <div key={name} className="flex items-center justify-between bg-slate-950/50 p-2.5 rounded-lg border border-purple-900/10 text-xs">
                        <span className="font-medium text-slate-300">{name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => dispatch(updateSampleQuantity({ productName: name, quantity: qty - 1 }))}
                            className="h-6 w-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-400 hover:text-white"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold font-mono text-purple-300">{qty}</span>
                          <button
                            type="button"
                            onClick={() => dispatch(updateSampleQuantity({ productName: name, quantity: qty + 1 }))}
                            className="h-6 w-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-400 hover:text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback & Outcome Inputs */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Doctor Feedback</label>
              <textarea
                value={form.doctor_feedback}
                onChange={(e) => handleInputChange('doctor_feedback', e.target.value)}
                placeholder="Doctor's response to products discussed, questions raised, etc."
                rows="2"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Actionable Outcome</label>
              <textarea
                value={form.outcome}
                onChange={(e) => handleInputChange('outcome', e.target.value)}
                placeholder="Target outcomes, doctor commitments, or goals set for next visit."
                rows="2"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Suggested Follow-up Date
              </label>
              <input
                type="date"
                value={form.follow_up_date}
                onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Representative Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes (e.g. availability, staff guidelines, office hours)"
                rows="2"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            {/* AI Generated Summary (Derives from AI, editable by user) */}
            {form.summary && (
              <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl space-y-1 animate-slideDown">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">AI Generated Meeting Summary</span>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{form.summary}"
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={dbLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition duration-150 flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-indigo-600/10 disabled:opacity-50 text-white"
            >
              <Save className="h-4 w-4" /> 
              {dbLoading 
                ? isEditMode ? 'Updating visit log...' : 'Saving visit log...' 
                : isEditMode ? 'Update Interaction' : 'Save Interaction to DB'}
            </button>

          </form>
        </div>

        {/* RIGHT COLUMN: AI Chat Assistant */}
        <div className="bg-darkslate-900 border border-darkslate-800 rounded-2xl shadow-2xl h-[670px] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-darkslate-800 flex items-center justify-between shrink-0 bg-darkslate-950/40">
            <div className="flex items-center gap-2.5">
              <div className="h-8.5 w-8.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <Bot className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-darkslate-100 flex items-center gap-1.5">
                  AI CRM Assistant <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 status-glow-green"></span>
                </h3>
                <p className="text-[10px] text-darkslate-400 mt-0.5">LangGraph Extraction Agent</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => dispatch(clearChat())}
              className="text-[10px] text-darkslate-400 hover:text-darkslate-200"
            >
              Clear Logs
            </button>
          </div>

          {/* Conversation Feed */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar bg-darkslate-950/30">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div 
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${isAssistant ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'}`}
                >
                  {/* Avatar */}
                  <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 ${
                    isAssistant 
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                      : 'bg-darkslate-800 border-darkslate-700 text-darkslate-400'
                  }`}>
                    {isAssistant ? <Bot className="h-4 w-4" /> : 'U'}
                  </div>

                  {/* Bubble */}
                  <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                    isAssistant
                      ? msg.isError
                        ? 'bg-red-950/30 border-red-900/50 text-red-300'
                        : 'bg-darkslate-900 border-darkslate-850 text-darkslate-300'
                      : 'bg-indigo-600 border-indigo-550 text-white'
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                    
                    {/* Intent Tag (for debug / proof of graph) */}
                    {isAssistant && msg.intent && (
                      <span className="inline-block text-[9px] bg-darkslate-800 text-indigo-400 font-semibold px-2 py-0.5 rounded font-mono">
                        Intent: {msg.intent}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {chatLoading && (
              <div className="flex gap-3 max-w-[80%] self-start mr-auto">
                <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-darkslate-900 border border-darkslate-850 flex items-center gap-1 shadow-inner shadow-darkslate-950/30">
                  <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form Input */}
          <form onSubmit={handleChatSubmit} className="p-4 border-t border-darkslate-800 bg-darkslate-950/40 shrink-0">
            <div className="flex items-center gap-2 bg-darkslate-950 border border-darkslate-850 rounded-xl p-1.5 focus-within:border-indigo-500 transition duration-200">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type narrative (e.g. 'I met Dr Sarah today at grace clinic. discussed cardio...')"
                className="flex-1 bg-transparent px-3 py-2 text-xs text-darkslate-200 placeholder:text-darkslate-500 focus:outline-none resize-none h-11.5 custom-scrollbar"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="h-10 w-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition active:scale-90 disabled:opacity-40 shadow shadow-indigo-600/10 shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-2 px-1 text-[10px] text-darkslate-500">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              <span>AI will extract fields, calculate follow-ups, and auto-populate the form.</span>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};

export default LogInteraction;
