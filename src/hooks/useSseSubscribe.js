import { useEffect } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';

export default function useSseSubscribe(onMessage) {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const eventSource = new EventSourcePolyfill(
      `${import.meta.env.VITE_API_BASE_URL}/subscribe`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    eventSource.onmessage = (event) => {
      if (onMessage) onMessage(JSON.parse(event.data));
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [onMessage]);
} 