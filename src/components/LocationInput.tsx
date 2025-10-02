import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocations } from '@/hooks/useLocations'

interface LocationInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
  required?: boolean
  showValidationError?: boolean
}

export const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = "Where did you have this? (e.g., Home, Restaurant name)",
  className,
  label,
  required = false,
  showValidationError = false
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const { locations, isLoading } = useLocations()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    setShowSuggestions(newValue.length > 0)
  }

  const handleSelectLocation = (selectedLocation: string) => {
    setInputValue(selectedLocation)
    onChange(selectedLocation)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleInputFocus = () => {
    if (inputValue.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false)
      }
    }, 150)
  }

  const filteredLocations = locations.filter(location =>
    location.location.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 5) // Limit to 5 suggestions

  return (
    <div className="relative space-y-2">
      {label && (
        <Label className={showValidationError && required && !value.trim() ? "text-orange-500 font-bold" : ""}>
          {label} {required && '*'}
        </Label>
      )}
      
      <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={cn(
            showValidationError && required && !value.trim() && "border-orange-500",
            className
          )}
        />
        
        {/* Suggestions Dropdown */}
        {showSuggestions && filteredLocations.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredLocations.map((location) => (
              <button
                key={location.location}
                onClick={() => handleSelectLocation(location.location)}
                className="w-full px-3 py-2 text-left hover-accent flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{location.location}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {location.count}x
                </span>
              </button>
            ))}
          </div>
        )}
      
    </div>
  )
}
