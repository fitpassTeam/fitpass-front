import { useEffect } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { API_BASE_URL } from '../api-config';

export default function useSseSubscribe(onMessage) {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const eventSource = new EventSourcePolyfill(
      `${API_BASE_URL}/notify/subscribe`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    // event: sse로 오는 알림을 처리
    eventSource.addEventListener('sse', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage({ ...data, read: false });
      } catch (e) {
        // JSON이 아닐 경우(예: "Event Stream Established.") 무시
        // console.log('SSE 알림 무시:', event.data);
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [onMessage]);
} 