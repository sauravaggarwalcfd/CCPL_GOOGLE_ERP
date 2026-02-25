import { useEffect } from 'react';

export default function useKeyboard(handlers = {}) {
  useEffect(() => {
    const listener = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handlers.onCmdToggle?.();
      }
      if (e.key === 'Escape') {
        handlers.onEscape?.();
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [handlers]);
}
