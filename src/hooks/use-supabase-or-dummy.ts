import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDummyProfile, getDummyHalaqoh, getDummySantri, getCurrentUserId } from '@/lib/offline-db';
import type { SyncStatus } from '@/lib/offline-db';

export function useSupabaseOrDummy<T>(tableName: string, options: {
  defaultDummyData: T[];
  select?: string;
  initialFilters?: { column: string; value: any }[];
}) {
  const [data, setData] = useState<T[]>(options.defaultDummyData);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [currentUser, setCurrentUser] = useState(getCurrentUserId());

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSyncStatus('ready');
        setCurrentUser(session.user.id);
        fetchData();
      } else {
        setSyncStatus('offline');
      }
    } catch (error) {
      setSyncStatus('error');
      console.error('Error checking auth:', error);
    }
  };

  const fetchData = async () => {
    if (syncStatus !== 'ready') return;
    
    setLoading(true);
    try {
      let query = supabase.from(tableName).select(options.select || '*');
      
      if (options.initialFilters) {
        options.initialFilters.forEach(filter => {
          query = query.eq(filter.column, filter.value);
        });
      }

      const { data: fetchedData, error } = await query;

      if (error) throw error;
      setData(fetchedData || options.defaultDummyData);
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      setData(options.defaultDummyData);
    } finally {
      setLoading(false);
    }
  };

  const addData = async (newData: Partial<T>) => {
    setLoading(true);
    try {
      if (syncStatus === 'ready') {
        const { error } = await supabase.from(tableName).insert([newData]);
        if (error) throw error;
        await fetchData();
      } else {
        // Handle offline mode - just update local state
        setData(prev => [...prev, { ...newData, id: `dummy-${Date.now()}` } as T]);
      }
    } catch (error) {
      console.error(`Error adding ${tableName}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateData = async (id: string, updates: Partial<T>) => {
    setLoading(true);
    try {
      if (syncStatus === 'ready') {
        const { error } = await supabase.from(tableName).update(updates).eq('id', id);
        if (error) throw error;
        await fetchData();
      } else {
        // Handle offline mode - just update local state
        setData(prev => prev.map(item => 
          (item as any).id === id ? { ...item, ...updates } : item
        ));
      }
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteData = async (id: string) => {
    setLoading(true);
    try {
      if (syncStatus === 'ready') {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) throw error;
        await fetchData();
      } else {
        // Handle offline mode - just update local state
        setData(prev => prev.filter(item => (item as any).id !== id));
      }
    } catch (error) {
      console.error(`Error deleting ${tableName}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    syncStatus,
    currentUser,
    addData,
    updateData,
    deleteData,
    refresh: fetchData
  };
}