import { useState, useEffect, useCallback } from 'react';
import { WorkDay, MonthStats } from '../types';
import { supabase } from '../utils/supabase';

export const useWorkData = () => {
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchWorkDays = useCallback(async () => {
    console.log('📡 Fetching work days from Supabase...');
    try {
      const { data, error } = await supabase
        .from('work_days') // Assuming the table is named 'work_days'
        .select('*');

      if (error) throw error;

      console.log('✅ Loaded data from Supabase:', data);
      setWorkDays(data || []);
    } catch (error) {
      console.error('❌ Error loading work data from Supabase:', error);
      setWorkDays([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Load data from Supabase on mount
  useEffect(() => {
    fetchWorkDays();
  }, [fetchWorkDays]);

  const addOrUpdateWorkDays = async (days: WorkDay[]) => {
    console.log('➕ Upserting work days:', days);
    try {
      const { error } = await supabase
        .from('work_days')
        .upsert(days, { onConflict: 'date' }); // 'date' must be a unique column in your table

      if (error) throw error;

      console.log('✅ Supabase - Upsert successful');
      // Refresh local state after successful operation
      await fetchWorkDays();

    } catch (error) {
      console.error('❌ Error upserting work data:', error);
      // Optionally, you can add user-facing error handling here
    }
  };

  const removeWorkDay = async (date: string) => {
    console.log('🗑️ Removing work day from Supabase:', date);
    try {
      const { error } = await supabase
        .from('work_days')
        .delete()
        .eq('date', date);

      if (error) throw error;

      console.log('✅ Supabase - Deletion successful');
      // Refresh local state
      setWorkDays(prev => prev.filter(w => w.date !== date));

    } catch (error) {
      console.error('❌ Error removing work day:', error);
    }
  };

  const getWorkDay = (date: string): WorkDay | undefined => {
    const workDay = workDays.find(w => w.date === date);
    if (workDay) {
      console.log('🔍 Found work day for', date, ':', workDay);
    }
    return workDay;
  };

  const getMonthStats = (year: number, month: number): MonthStats => {
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthWorkDays = workDays.filter(w => w.date.startsWith(monthKey));
    
    console.log('📈 Calculating stats for', monthKey, '- found', monthWorkDays.length, 'work days');
    
    const totalDays = monthWorkDays.length;
    const totalAmount = monthWorkDays.reduce((sum, w) => sum + w.amount, 0);
    const paidDays = monthWorkDays.filter(w => w.isPaid);
    const pendingDays = monthWorkDays.filter(w => !w.isPaid);
    
    const stats = {
      totalDays,
      totalAmount,
      paidAmount: paidDays.reduce((sum, w) => sum + w.amount, 0),
      pendingAmount: pendingDays.reduce((sum, w) => sum + w.amount, 0),
      paidDays: paidDays.length,
      pendingDays: pendingDays.length,
    };
    
    console.log('📊 Month stats:', stats);
    return stats;
  };

  return {
    workDays,
    addOrUpdateWorkDays,
    removeWorkDay,
    getWorkDay,
    getMonthStats,
    isLoaded,
  };
};