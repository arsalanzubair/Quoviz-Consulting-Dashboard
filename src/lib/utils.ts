import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export interface CallRecord {
  id: string;
  lead_name: string;
  phone_number: string;
  call_type: string;
  call_status: string;
  duration_seconds: number;
  appointment_booked: boolean;
  appointment_time: string | null;
  transcript: string;
  recording_url: string;
  created_at: string;
  source?: string;
  conversation_id?: string;
}

export interface Metrics {
  totalCalls: number;
  totalAppointments: number;
  callsToday: number;
  appointmentsToday: number;
}
