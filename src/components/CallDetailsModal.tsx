import { format } from 'date-fns';
import { X, Phone, User, Calendar, Info, FileText, Play, Database } from 'lucide-react';
import { CallRecord, formatDuration, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface CallDetailsModalProps {
  call: CallRecord | null;
  onClose: () => void;
}

export default function CallDetailsModal({ call, onClose }: CallDetailsModalProps) {
  return (
    <AnimatePresence>
      {call && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-200"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">Call Intelligence</h2>
                <p className="text-xs text-slate-500 font-medium">Detailed record and analysis</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-all hover:rotate-90"
              >
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="p-8 space-y-10">
              {/* Lead Info */}
              <section>
                <div className="flex items-center space-x-2 text-indigo-600 mb-6 group">
                  <div className="p-1.5 bg-indigo-50 rounded-md group-hover:bg-indigo-100 transition-colors">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Lead Identity</span>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">FullName</p>
                    <p className="text-sm font-semibold text-slate-900">{call.lead_name || 'Anonymous'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Contact</p>
                    <p className="text-sm font-semibold text-slate-900">{call.phone_number || 'No number'}</p>
                  </div>
                </div>
              </section>

              {/* Call Info */}
              <section>
                <div className="flex items-center space-x-2 text-indigo-600 mb-6 group">
                  <div className="p-1.5 bg-indigo-50 rounded-md group-hover:bg-indigo-100 transition-colors">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Engagement Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-x-5 gap-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Direction</p>
                    <div className="flex">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        call.call_type === 'inbound' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                      )}>
                        {call.call_type}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Result</p>
                    <div className="flex">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        call.call_status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      )}>
                        {call.call_status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Duration</p>
                    <p className="text-sm font-semibold text-slate-900 font-mono tracking-tighter">
                      {formatDuration(call.duration_seconds || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Timestamp</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {call.created_at || 'N/A'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Appointment Info */}
              <section>
                <div className="flex items-center space-x-2 text-emerald-600 mb-6 group">
                  <div className="p-1.5 bg-emerald-50 rounded-md group-hover:bg-emerald-100 transition-colors">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Conversion Status</span>
                </div>
                <div className={cn(
                  "p-5 rounded-2xl border transition-all duration-300",
                  call.appointment_booked
                    ? "bg-emerald-50/50 border-emerald-100 text-emerald-900 ring-1 ring-emerald-100 ring-inset"
                    : "bg-slate-50/50 border-slate-100 text-slate-500"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-wide">Appointment</p>
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest",
                      call.appointment_booked ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
                    )}>
                      {call.appointment_booked ? 'Booked' : 'Not Saved'}
                    </span>
                  </div>
                  {call.appointment_booked && call.appointment_time && (
                    <div className="pt-4 border-t border-emerald-100/50">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Scheduled Session</p>
                      <p className="text-sm font-bold">
                        {format(new Date(call.appointment_time), 'EEEE, MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Source Info */}
              {(call.source || call.conversation_id) && (
                <section>
                  <div className="flex items-center space-x-2 text-slate-400 mb-6 group">
                    <div className="p-1.5 bg-slate-50 rounded-md group-hover:bg-slate-100 transition-colors">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]">System Metadata</span>
                  </div>
                  <div className="space-y-4">
                    {call.source && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-[11px] font-semibold text-slate-400">Origination Source</span>
                        <span className="text-[11px] font-bold text-slate-700">{call.source}</span>
                      </div>
                    )}
                    {call.conversation_id && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400">Trace ID</span>
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          <code className="text-[10px] font-mono text-slate-500 break-all select-all font-medium">
                            {call.conversation_id}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Audio Player */}
              {call.recording_url && (
                <section>
                  <div className="flex items-center space-x-2 text-rose-600 mb-6 group">
                    <div className="p-1.5 bg-rose-50 rounded-md group-hover:bg-rose-100 transition-colors">
                      <Play className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Voice Audio</span>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-200/50 relative overflow-hidden group/audio">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pointer-events-none" />
                    <audio controls className="w-full h-10 relative z-10 invert brightness-100 opacity-90 hover:opacity-100 transition-opacity">
                      <source src={call.recording_url} type="audio/mpeg" />
                      Your browser does not support audio.
                    </audio>
                  </div>
                </section>
              )}

              {/* Transcript */}
              <section className="pb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2 text-slate-500 group">
                    <div className="p-1.5 bg-slate-50 rounded-md group-hover:bg-slate-100 transition-colors">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Full Transcript</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded uppercase tracking-tighter">AI Generated</span>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative group/transcript transition-all hover:border-slate-200">
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover/transcript:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  </div>
                  <p className="text-slate-600 text-[13px] leading-[1.7] font-medium whitespace-pre-wrap selection:bg-indigo-50">
                    {call.transcript || "No transcript analysis available."}
                  </p>
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
