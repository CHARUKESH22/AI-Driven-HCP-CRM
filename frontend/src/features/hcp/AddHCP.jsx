import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createHCP } from '../../store/hcpSlice';
import { HCPForm } from './HCPComponents';
import { CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function AddHCP() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleSave = async (data) => {
    setSubmitting(true);
    setNotification(null);
    try {
      const result = await dispatch(createHCP(data)).unwrap();
      setNotification({
        type: 'success',
        message: 'HCP Registered Successfully'
      });
      // Delay redirect slightly so user can view success banner
      setTimeout(() => {
        navigate('/search', { state: { newlyAdded: result.doctor_name } });
      }, 1000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err || 'Failed to register Healthcare Professional'
      });
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/search');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Back Button */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-4">
        <div className="space-y-1">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-semibold mb-2 focus:outline-none cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Search
          </button>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight sm:text-3xl">
            Register Healthcare Professional
          </h1>
          <p className="text-sm text-slate-400">
            Create a new Healthcare Professional profile before logging interactions.
          </p>
        </div>
      </div>

      {/* Notification banner */}
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

      {/* Form Container Card */}
      <div className="glass-panel p-6 shadow-2xl">
        <HCPForm
          onSubmit={handleSave}
          onCancel={handleCancel}
          isLoading={submitting}
        />
      </div>
    </div>
  );
}
