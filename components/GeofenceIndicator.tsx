
import React from 'react';
import { CheckCircle, Navigation, Info, ShieldAlert, WifiOff } from 'lucide-react';

interface GeofenceIndicatorProps {
  distance: number | null;
  radius: number;
  inRange: boolean;
  locationError?: string | null;
}

const GeofenceIndicator: React.FC<GeofenceIndicatorProps> = ({ distance, radius, inRange, locationError }) => {
  const getStatusContent = () => {
    if (locationError) {
      return {
        icon: ShieldAlert,
        color: 'rose',
        title: 'Sensor Error',
        sub: 'Location Blocked',
        message: 'The system cannot detect your position. This is usually caused by disabled GPS or restricted browser permissions.',
        suggest: 'Ensure location services are enabled and permissions are granted.'
      };
    }
    if (distance === null) {
      return {
        icon: WifiOff,
        color: 'slate',
        title: 'Signal Scanning',
        sub: 'Locating...',
        message: 'Attempting to establish a secure GPS handshake with your device satellites.',
        suggest: 'Wait a few seconds or move to an open area.'
      };
    }
    if (inRange) {
      return {
        icon: CheckCircle,
        color: 'emerald',
        title: 'Check-in Active',
        sub: 'Secure Zone',
        message: 'Your identity is verified within the campus perimeter. Attendance is being recorded.',
        suggest: 'Stay within the zone to maintain your active status.'
      };
    }
    return {
      icon: Navigation,
      color: 'amber',
      title: 'Outside Zone',
      sub: 'Attendance Paused',
      message: `You are approximately ${Math.round(distance)}m from the verified campus center.`,
      suggest: 'Move closer to the campus center to trigger automatic check-in.'
    };
  };

  const status = getStatusContent();
  const Icon = status.icon;

  return (
    <div className={`p-6 md:p-8 rounded-[2rem] border transition-all duration-500 shadow-xl bg-${status.color}-50 border-${status.color}-100`}>
      <div className="flex items-start gap-5">
        <div className={`p-4 rounded-2xl flex-shrink-0 bg-${status.color}-500 text-white shadow-lg`}>
          <Icon size={28} className={!inRange && !locationError && distance !== null ? 'animate-pulse' : ''} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
             <h4 className={`text-lg font-black text-slate-900 tracking-tight leading-tight`}>{status.title}</h4>
             <span className={`text-[10px] font-black uppercase tracking-widest text-${status.color}-600`}>{status.sub}</span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-2 leading-relaxed">
            {status.message}
          </p>
        </div>
      </div>
      
      <div className={`mt-5 p-4 rounded-2xl bg-white border border-${status.color}-100 flex items-center gap-3`}>
         <div className={`w-6 h-6 rounded-lg bg-${status.color}-500 text-white flex items-center justify-center flex-shrink-0`}>
            <Info size={12} strokeWidth={3} />
         </div>
         <span className={`text-[10px] md:text-xs font-black text-slate-700 tracking-tight`}>
           NEXT STEP: <span className={`text-${status.color}-600 uppercase`}>{status.suggest}</span>
         </span>
      </div>
    </div>
  );
};

export default GeofenceIndicator;
