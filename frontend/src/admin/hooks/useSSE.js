import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminContext } from '../contexts/AdminContext';

export const useSSE = (storeId) => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const eventSourceRef = useRef(null);
  const { setPollingEnabled } = useAdminContext();
  const queryClient = useQueryClient();
  
  const handleEvent = useCallback((event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'initial':
        queryClient.setQueryData(['orders', storeId], data.orders);
        break;
        
      case 'order_created':
        queryClient.setQueryData(['orders', storeId], (old) => [
          ...(old || []),
          { ...data.order, isNew: true },
        ]);
        
        // 3초 후 isNew 플래그 제거
        setTimeout(() => {
          queryClient.setQueryData(['orders', storeId], (old) =>
            (old || []).map(o => o.orderId === data.order.orderId 
              ? { ...o, isNew: false } 
              : o
            )
          );
        }, 3000);
        break;
        
      case 'order_updated':
        queryClient.setQueryData(['orders', storeId], (old) =>
          (old || []).map(o => o.orderId === data.orderId 
            ? { ...o, status: data.status } 
            : o
          )
        );
        break;
        
      case 'order_deleted':
        queryClient.setQueryData(['orders', storeId], (old) =>
          (old || []).filter(o => o.orderId !== data.orderId)
        );
        break;
        
      case 'session_ended':
        queryClient.setQueryData(['orders', storeId], (old) =>
          (old || []).filter(o => o.tableId !== data.tableId)
        );
        break;
    }
  }, [storeId, queryClient]);
  
  const connect = useCallback(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_BASE_URL}/admin/orders/sse?store_id=${storeId}`
    );
    
    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
      setReconnectAttempts(0);
      setPollingEnabled(false);
    };
    
    eventSource.onmessage = handleEvent;
    
    eventSource.onerror = () => {
      setConnected(false);
      setError('연결이 끊어졌습니다');
      eventSource.close();
      
      if (reconnectAttempts < 5) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 16000);
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);
      } else {
        // 폴링 모드로 전환
        setPollingEnabled(true);
      }
    };
    
    eventSourceRef.current = eventSource;
  }, [storeId, reconnectAttempts, handleEvent, setPollingEnabled]);
  
  useEffect(() => {
    if (storeId) {
      connect();
    }
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect, storeId]);
  
  return { connected, error, reconnectAttempts };
};
