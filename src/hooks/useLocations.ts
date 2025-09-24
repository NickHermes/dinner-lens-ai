import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface LocationCount {
  location: string
  count: number
}

export const useLocations = () => {
  const { user } = useAuth()

  const { data: locations = [], isLoading, refetch } = useQuery({
    queryKey: ['locations', user?.id],
    queryFn: async () => {
      if (!user) return []

      // Get all consumption records with locations for this user
      const { data, error } = await supabase
        .from('consumption_records')
        .select('location')
        .eq('user_id', user.id)
        .not('location', 'is', null)

      if (error) throw error

      // Count occurrences of each location
      const locationCounts: { [key: string]: number } = {}
      data?.forEach(record => {
        if (record.location) {
          const location = record.location.toLowerCase().trim()
          locationCounts[location] = (locationCounts[location] || 0) + 1
        }
      })

      // Convert to array and sort by count (descending)
      const locationArray: LocationCount[] = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)

      return locationArray
    },
    enabled: !!user,
    staleTime: 0, // Always consider data stale to ensure fresh updates
    refetchOnWindowFocus: true // Refetch when window regains focus
  })

  return { locations, isLoading, refetch }
}
