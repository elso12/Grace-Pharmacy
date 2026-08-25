import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Clock, Play, Square } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ClockWidget: React.FC = () => {
  const { user } = useAuth();
  const [activeShift, setActiveShift] = useState<any>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // We only show this for staff roles
  if (user?.role === 'CUSTOMER') return null;

  const checkStatus = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/timesheets/my-shifts', { withCredentials: true });
      const shifts = res.data.data;
      const active = shifts.find((s: any) => s.status === 'ACTIVE');
      setActiveShift(active || null);
      if (active) {
        setElapsed(Math.floor((Date.now() - new Date(active.clockIn).getTime()) / 1000));
      }
    } catch (error) {
      console.error('Failed to load shift status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeShift) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - new Date(activeShift.clockIn).getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeShift]);

  const handleClockIn = async () => {
    try {
      await axios.post('http://localhost:5000/api/timesheets/clock-in', {}, { withCredentials: true });
      toast.success('Clocked in successfully');
      checkStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      await axios.post('http://localhost:5000/api/timesheets/clock-out', {}, { withCredentials: true });
      toast.success('Clocked out successfully');
      setActiveShift(null);
      setElapsed(0);
      checkStatus(); // Reload just to be safe
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to clock out');
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="h-8 w-24 bg-white/[0.04] animate-pulse rounded-full"></div>;

  return (
    <div className="flex items-center gap-3 bg-white/[0.04] p-1 pr-3 rounded-full border border-white/[0.06]">
      {activeShift ? (
        <>
          <div className="flex items-center gap-2 pl-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-emerald-400 font-mono tracking-wider">
              {formatTime(elapsed)}
            </span>
          </div>
          <button
            onClick={handleClockOut}
            className="flex items-center justify-center h-6 w-6 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
            title="Clock Out"
          >
            <Square fill="currentColor" size={10} />
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 pl-2">
            <Clock size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-400">Off Shift</span>
          </div>
          <button
            onClick={handleClockIn}
            className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
            title="Clock In"
          >
            <Play fill="currentColor" size={10} />
          </button>
        </>
      )}
    </div>
  );
};

export default ClockWidget;
