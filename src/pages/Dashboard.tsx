import { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Download, LogOut, Loader2, CheckCircle, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { CallRecord, Metrics, cn, formatDuration } from '../lib/utils';
import { format } from 'date-fns';
import MetricsOverview from '../components/MetricsOverview';
import CallDetailsModal from '../components/CallDetailsModal';

export default function Dashboard() {
  const { logout } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [exporting, setExporting] = useState(false);

  const limit = 10;

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [page, search, type, status]);


  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        type,
        status,
      });
      const res = await fetch(`/api/call-records?${params}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch calls');
      }
      const data = await res.json();
      console.log(`Retrieved ${data.total} records from Supabase`);
      if (data.data && data.data.length > 0) {
        console.log('First 5 records:');
        console.table(data.data.slice(0, 5));
      }
      setCalls(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (error: any) {
      console.error('Error fetching calls:', error);
      setCalls([]);
      setTotal(0);
    }
    setLoading(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'call_records.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    }
    setExporting(false);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Quoviz Consulting Call Monitor</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Export CSV</span>
              </button>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

        <MetricsOverview metrics={metrics} />

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-t-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
                <option value="other">Other</option>
              </select>
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border-x border-b border-slate-200 rounded-b-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Appointment</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto" />
                    </td>
                  </tr>
                ) : (calls?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      No call records found.
                    </td>
                  </tr>
                ) : (
                  calls.map((call) => (
                    <tr
                      key={call.id}
                      onClick={() => setSelectedCall(call)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {call.lead_name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{call.phone_number || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight",
                          call.call_type === 'inbound' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                        )}>
                          {call.call_type || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight",
                          call.call_status === 'completed' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                          {call.call_status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                        {formatDuration(call.duration_seconds || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight",
                          call.appointment_booked ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        )}>
                          {call.appointment_booked ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {call.source || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {call.created_at || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCall(call);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"
                          title="View Details"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{((page - 1) * limit) + 1}</span> to{' '}
              <span className="font-medium text-slate-900">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-medium text-slate-900">{total}</span> records
            </p>
            <div className="flex items-center space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-700 px-2">
                Page {page} of {totalPages || 1}
              </span>
              <button
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage(p => p + 1)}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <CallDetailsModal
        call={selectedCall}
        onClose={() => setSelectedCall(null)}
      />
    </div>
  );
}
