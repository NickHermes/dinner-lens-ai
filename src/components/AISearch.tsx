import { useState } from 'react'
import { Search, Sparkles, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const AISearch = () => {
  const [query, setQuery] = useState('')

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Sparkles className="absolute right-12 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary animate-pulse" />
        <Input
          placeholder="Ask: spicy noodles I ate with salmon last winter"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-20 bg-muted/50 border-primary/20 focus:border-primary"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}