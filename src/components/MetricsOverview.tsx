import { Phone, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { Metrics } from '../lib/utils';
import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: string;
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{(value ?? 0).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default function MetricsOverview({ metrics }: { metrics: Metrics | null }) {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Total Calls"
        value={metrics.totalCalls}
        icon={<Phone className="w-6 h-6 text-indigo-600" />}
        color="bg-indigo-50"
      />
      <MetricCard
        title="Total Appointments"
        value={metrics.totalAppointments}
        icon={<Calendar className="w-6 h-6 text-emerald-600" />}
        color="bg-emerald-50"
      />
      <MetricCard
        title="Calls Today"
        value={metrics.callsToday}
        icon={<Clock className="w-6 h-6 text-amber-600" />}
        color="bg-amber-50"
      />
      <MetricCard
        title="Appointments Today"
        value={metrics.appointmentsToday}
        icon={<CheckCircle2 className="w-6 h-6 text-blue-600" />}
        color="bg-blue-50"
      />
    </div>
  );
}
