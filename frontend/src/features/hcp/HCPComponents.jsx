import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  Stethoscope, MapPin, Mail, Phone, History, 
  Plus, ChevronDown, ChevronUp, Calendar, Clock, 
  User, Award, Clipboard, Trash2, X, Award as AwardIcon, CheckSquare
} from 'lucide-react';

// 1. Priority Badge Component
export const PriorityBadge = ({ priority }) => {
  let bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let label = 'Priority C';
  
  const p = (priority || '').toUpperCase();
  if (p === 'A' || p === 'PRIORITY A') {
    bgClass = 'bg-red-50 text-red-700 border-red-200';
    label = 'Priority A';
  } else if (p === 'B' || p === 'PRIORITY B') {
    bgClass = 'bg-orange-50 text-orange-700 border-orange-200';
    label = 'Priority B';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${bgClass}`}>
      {label}
    </span>
  );
};

// 2. Product Multi Select Component
export const ProductMultiSelect = ({ value = [], onChange, options = [] }) => {
  const toggleProduct = (product) => {
    if (value.includes(product)) {
      onChange(value.filter((p) => p !== product));
    } else {
      onChange([...value, product]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950 border border-slate-850 rounded-xl min-h-[48px] items-center">
        {value.length === 0 ? (
          <span className="text-xs text-slate-500">Select products...</span>
        ) : (
          value.map((product) => (
            <span
              key={product}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950 border border-indigo-900 text-indigo-300 text-xs font-semibold"
            >
              {product}
              <button
                type="button"
                onClick={() => toggleProduct(product)}
                className="text-indigo-400 hover:text-indigo-200 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((option) => {
          const isSelected = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleProduct(option)}
              className={`flex items-center gap-2 p-2 px-3 border rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/20 text-indigo-300'
                  : 'border-slate-850 bg-slate-900/10 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${
                isSelected ? 'border-indigo-500 bg-indigo-600' : 'border-slate-700'
              }`}>
                {isSelected && <span className="text-[9px] text-white">✓</span>}
              </div>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 3. HCP Registration Form Component
export const HCPForm = ({ onSubmit, onCancel, defaultValues = {}, isLoading = false }) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm({
    defaultValues: {
      doctor_name: '',
      specialization: '',
      hospital: '',
      department: '',
      city: '',
      region: '',
      preferred_visit_time: '',
      priority: '',
      representative: 'Alex Mercer', // default rep
      phone: '',
      email: '',
      medical_registration: '',
      experience: '',
      notes: '',
      products: [],
      ...defaultValues
    }
  });

  const specializations = [
    'Cardiologist', 'Diabetologist', 'Neurologist', 'Orthopedic',
    'General Physician', 'Dermatologist', 'ENT', 'Pediatrician',
    'Psychiatrist', 'Gynecologist', 'Oncologist', 'Pulmonologist',
    'Nephrologist', 'Urologist', 'Other'
  ];

  const productOptions = [
    'CardioSafe', 'GlucoSafe', 'NeuroMax', 'OrthoCare', 'VitaPlus'
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: REQUIRED FIELDS & SELECTS */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-850 pb-2">
            Required Information
          </h3>

          {/* Doctor Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex justify-between">
              <span>Doctor Name *</span>
              {errors.doctor_name && <span className="text-red-400 font-normal">Required</span>}
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Ravi Kumar"
              {...register('doctor_name', { required: true })}
              className={`w-full px-3 py-2.5 rounded-xl bg-slate-950 border ${
                errors.doctor_name ? 'border-red-500' : 'border-slate-850 focus:border-indigo-500'
              } text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none transition`}
            />
          </div>

          {/* Specialization Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex justify-between">
              <span>Specialization *</span>
              {errors.specialization && <span className="text-red-400 font-normal">Required</span>}
            </label>
            <select
              {...register('specialization', { required: true })}
              className={`w-full px-3 py-2.5 rounded-xl bg-slate-950 border ${
                errors.specialization ? 'border-red-500' : 'border-slate-850 focus:border-indigo-500'
              } text-slate-400 text-xs focus:outline-none transition`}
            >
              <option value="">-- Select Specialization --</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Hospital */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex justify-between">
              <span>Hospital *</span>
              {errors.hospital && <span className="text-red-400 font-normal">Required</span>}
            </label>
            <input
              type="text"
              placeholder="e.g. City General Hospital"
              {...register('hospital', { required: true })}
              className={`w-full px-3 py-2.5 rounded-xl bg-slate-950 border ${
                errors.hospital ? 'border-red-500' : 'border-slate-850 focus:border-indigo-500'
              } text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none transition`}
            />
          </div>

          {/* Grid for City and Region */}
          <div className="grid grid-cols-2 gap-4">
            {/* City */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex justify-between">
                <span>City *</span>
                {errors.city && <span className="text-red-400 font-normal">Required</span>}
              </label>
              <input
                type="text"
                placeholder="e.g. Chicago"
                {...register('city', { required: true })}
                className={`w-full px-3 py-2.5 rounded-xl bg-slate-950 border ${
                  errors.city ? 'border-red-500' : 'border-slate-850 focus:border-indigo-500'
                } text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none transition`}
              />
            </div>

            {/* Region */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex justify-between">
                <span>Region *</span>
                {errors.region && <span className="text-red-400 font-normal">Required</span>}
              </label>
              <input
                type="text"
                placeholder="e.g. Midwest"
                {...register('region', { required: true })}
                className={`w-full px-3 py-2.5 rounded-xl bg-slate-950 border ${
                  errors.region ? 'border-red-500' : 'border-slate-850 focus:border-indigo-500'
                } text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none transition`}
              />
            </div>
          </div>

          {/* Preferred Visit Time */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex justify-between">
              <span>Preferred Visit Time *</span>
              {errors.preferred_visit_time && <span className="text-red-400 font-normal">Required</span>}
            </label>
            <input
              type="text"
              placeholder="e.g. Tuesdays 10:00 AM"
              {...register('preferred_visit_time', { required: true })}
              className={`w-full px-3 py-2.5 rounded-xl bg-slate-950 border ${
                errors.preferred_visit_time ? 'border-red-500' : 'border-slate-850 focus:border-indigo-500'
              } text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none transition`}
            />
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex justify-between">
              <span>Priority *</span>
              {errors.priority && <span className="text-red-400 font-normal">Required</span>}
            </label>
            <select
              {...register('priority', { required: true })}
              className={`w-full px-3 py-2.5 rounded-xl bg-slate-950 border ${
                errors.priority ? 'border-red-500' : 'border-slate-850 focus:border-indigo-500'
              } text-slate-400 text-xs focus:outline-none transition`}
            >
              <option value="">-- Select Priority --</option>
              <option value="A">Priority A</option>
              <option value="B">Priority B</option>
              <option value="C">Priority C</option>
            </select>
          </div>

          {/* Representative */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex justify-between">
              <span>Representative Assigned *</span>
              {errors.representative && <span className="text-red-400 font-normal">Required</span>}
            </label>
            <input
              type="text"
              placeholder="e.g. Alex Mercer"
              {...register('representative', { required: true })}
              className={`w-full px-3 py-2.5 rounded-xl bg-slate-950 border ${
                errors.representative ? 'border-red-500' : 'border-slate-850 focus:border-indigo-500'
              } text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none transition`}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: OPTIONAL FIELDS */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-850 pb-2">
            Optional Information
          </h3>

          {/* Department */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Department</label>
            <input
              type="text"
              placeholder="e.g. Endocrinology / Geriatrics"
              {...register('department')}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Grid for Phone and Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +1-555-0199"
                {...register('phone')}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <input
                type="email"
                placeholder="e.g. ravi@hospital.org"
                {...register('email')}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Medical Registration & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Med Reg */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Medical Registration ID</label>
              <input
                type="text"
                placeholder="e.g. REG-44556"
                {...register('medical_registration')}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Experience */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Years of Experience</label>
              <input
                type="number"
                placeholder="e.g. 15"
                {...register('experience', { valueAsNumber: true })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Notes / Preferences</label>
            <textarea
              placeholder="e.g. Prefers email scheduling, morning appointments only"
              rows={3}
              {...register('notes')}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Products of Interest (Controlled Selection) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Products of Interest</label>
            <Controller
              name="products"
              control={control}
              render={({ field }) => (
                <ProductMultiSelect
                  options={productOptions}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/10 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="h-3.5 w-3.5 rounded-full border border-white border-t-transparent animate-spin"></div>
              Saving...
            </>
          ) : (
            'Save HCP'
          )}
        </button>
      </div>
    </form>
  );
};

// 4. HCP Details Card Component for Search results
export const HCPCard = ({ 
  hcp, 
  isExpanded, 
  onToggleHistory, 
  onLogVisit, 
  history = [], 
  historyLoading = false 
}) => {
  return (
    <div className="glass-card overflow-hidden hover:border-slate-800 rounded-xl transition duration-200 p-5 space-y-4">
      {/* Upper Card Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                Dr. {hcp.doctor_name || `${hcp.first_name} ${hcp.last_name}`}
              </h3>
              {hcp.priority && <PriorityBadge priority={hcp.priority} />}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
              <span className="font-semibold text-indigo-400">{hcp.specialization}</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 font-medium"><MapPin className="h-3.5 w-3.5 text-slate-500" /> {hcp.hospital || hcp.hospital_name}</span>
              {(hcp.city || hcp.region) && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500">{hcp.city}, {hcp.region}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions Block */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => onToggleHistory(hcp)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
              isExpanded
                ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="h-3.5 w-3.5" /> History
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => onLogVisit(hcp)}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs transition text-white active:scale-95 shadow-md shadow-indigo-600/10"
          >
            <Plus className="h-3.5 w-3.5" /> Log Visit
          </button>
        </div>
      </div>

      {/* Sub-Panel: Contact & Rep Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-850/40 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-slate-500" />
          <span className="truncate">{hcp.email || 'Email not available'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-slate-500" />
          <span>{hcp.phone || 'Phone not available'}</span>
        </div>
        {hcp.representative && (
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-slate-500" />
            <span>Rep: <span className="font-semibold text-slate-300">{hcp.representative}</span></span>
          </div>
        )}
      </div>

      {/* Products list & notes section */}
      {(hcp.products?.length > 0 || hcp.notes || hcp.medical_registration || hcp.experience) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-850/40 text-xs text-slate-400">
          <div>
            {hcp.products && hcp.products.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Products of Interest:</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {hcp.products.map(p => (
                    <span key={p} className="text-[9px] bg-slate-900 border border-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-medium">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {hcp.preferred_visit_time && (
              <div className="mt-2 text-slate-500">
                <span className="font-semibold text-slate-400">Preferred Visit: </span>
                {hcp.preferred_visit_time}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {hcp.notes && (
              <p className="italic text-slate-500">
                <span className="font-semibold text-slate-400 not-italic">Notes:</span> "{hcp.notes}"
              </p>
            )}
            
            {(hcp.medical_registration || hcp.experience) && (
              <div className="flex gap-4 text-[11px] text-slate-500">
                {hcp.medical_registration && (
                  <div>
                    Reg ID: <span className="font-mono text-slate-400">{hcp.medical_registration}</span>
                  </div>
                )}
                {hcp.experience && (
                  <div>
                    Exp: <span className="font-medium text-slate-400">{hcp.experience} Years</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded Section: Visit History Accordion */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800 animate-slideDown">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Previous Interactions</h4>
          
          {historyLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-4 border border-dashed border-slate-850 rounded-lg">
              <span className="text-xs text-slate-600">No past visits logged. Click "Log Visit" to record the first meeting.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((visit) => (
                <div 
                  key={visit.id} 
                  className="p-3 border border-slate-850 bg-slate-950/20 rounded-lg space-y-2 hover:bg-slate-950/30 transition text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-500" /> {visit.meeting_date}
                    </span>
                    <span className="font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-600" /> {visit.meeting_time} ({visit.meeting_type})
                    </span>
                  </div>
                  <p className="text-slate-400">
                    <span className="font-semibold text-slate-500">Summary:</span> {visit.summary || visit.feedback || 'N/A'}
                  </p>
                  
                  {visit.products_discussed && visit.products_discussed.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[9px] text-slate-500 font-semibold uppercase mr-1">Products:</span>
                      {visit.products_discussed.map(p => (
                        <span key={p} className="text-[9px] bg-slate-900 border border-slate-850 text-slate-300 px-1.5 py-0.5 rounded font-medium">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
