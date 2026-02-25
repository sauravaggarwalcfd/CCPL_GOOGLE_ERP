import { useEffect, useRef } from 'react';
import api from '../services/api';

export default function useHeartbeat(activeModule, activePage, intervalMs = 30000) {
  const timerRef = useRef(null);

  useEffect(() => {
    const sendHeartbeat = () => {
      api.heartbeat(activeModule || 'Dashboard', activePage || 'Home').catch(() => {});
    };

    sendHeartbeat();
    timerRef.current = setInterval(sendHeartbeat, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeModule, activePage, intervalMs]);
}
