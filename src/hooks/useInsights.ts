import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Kpis {
  total_meals: number;
  unique_dishes: number;
  unique_variants: number;
  new_ratio: number; // 0..1
  avg_health: number | null;
  avg_effort: string | null;
}

const fallbackKpis: Kpis = {
  total_meals: 0,
  unique_dishes: 0,
  unique_variants: 0,
  new_ratio: 0,
  avg_health: null,
  avg_effort: null,
};

export function useKpis(start: Date, end: Date) {
  const [data, setData] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        console.log('🔍 Calling get_kpis with:', {
          p_start: start.toISOString(),
          p_end: end.toISOString()
        });
        
        const { data, error } = await supabase.rpc("get_kpis", {
          p_start: start.toISOString(),
          p_end: end.toISOString(),
        });
        
        console.log('📊 RPC Response:', { data, error });
        
        if (error) throw error;
        // data can be array of rows or single row depending on RPC
        const row = Array.isArray(data) ? data[0] : data;
        console.log('✅ Processed KPIs:', row);
        
        // Debug: Also call debug function to see raw data
        try {
          const { data: debugData } = await supabase.rpc("debug_user_data");
          console.log('🔍 Debug Data:', debugData);
        } catch (e) {
          console.log('Debug RPC not available yet');
        }
        
        if (isMounted) setData(row as Kpis);
      } catch (e: any) {
        console.error('❌ RPC Error:', e);
        // fallback to zeros if RPC missing; keep UI rendering
        if (isMounted) {
          setData(fallbackKpis);
          setError(e?.message ?? "Failed to load KPIs");
        }
      } finally {
        isMounted && setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [start.getTime(), end.getTime()]);

export interface TagFrequency {
  tag: string;
  freq: number;
}

export function useTopTags(start: Date, end: Date, limit: number = 20) {
  const [data, setData] = useState<TagFrequency[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        console.log('🔍 Calling get_top_tags with:', {
          p_start: start.toISOString(),
          p_end: end.toISOString(),
          p_limit: limit
        });
        
        const { data, error } = await supabase.rpc("get_top_tags", {
          p_start: start.toISOString(),
          p_end: end.toISOString(),
          p_limit: limit,
        });
        
        console.log('📊 Top Tags Response:', { data, error });
        
        if (error) throw error;
        if (isMounted) setData(data as TagFrequency[]);
      } catch (e: any) {
        console.error('❌ Top Tags Error:', e);
        if (isMounted) {
          setData([]);
          setError(e?.message ?? "Failed to load top tags");
        }
      } finally {
        isMounted && setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [start.getTime(), end.getTime(), limit]);

export interface TrendData {
  bucket_date: string;
  avg_health: number;
  effort_mode: string;
  meals: number;
}

export function useTrends(start: Date, end: Date, bucket: string = 'day') {
  const [data, setData] = useState<TrendData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        console.log('🔍 Calling get_trends with:', {
          p_start: start.toISOString(),
          p_end: end.toISOString(),
          p_bucket: bucket
        });
        
        const { data, error } = await supabase.rpc("get_trends", {
          p_start: start.toISOString(),
          p_end: end.toISOString(),
          p_bucket: bucket,
        });
        
        console.log('📊 Trends Response:', { data, error });
        
        if (error) throw error;
        if (isMounted) setData(data as TrendData[]);
      } catch (e: any) {
        console.error('❌ Trends Error:', e);
        if (isMounted) {
          setData([]);
          setError(e?.message ?? "Failed to load trends");
        }
      } finally {
        isMounted && setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [start.getTime(), end.getTime(), bucket]);

  return { data, loading, error };
}


