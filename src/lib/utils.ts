import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getHealthScoreColor(score: number) {
  if (score >= 70) return "bg-green-500" // Healthy - green
  if (score >= 50) return "bg-yellow-500" // Moderate - yellow/orange
  return "bg-red-500" // Unhealthy - red
}

export function getHealthScoreBadgeVariant(score: number) {
  if (score >= 70) return "default" // Green badge
  if (score >= 50) return "secondary" // Yellow/orange badge
  return "destructive" // Red badge
}

export function getHealthScoreBadgeClass(score: number) {
  if (score >= 70) return "bg-green-500 text-white border-green-500" // Healthy - green
  if (score >= 50) return "bg-yellow-500 text-white border-yellow-500" // Moderate - yellow
  return "bg-red-500 text-white border-red-500" // Unhealthy - red
}
