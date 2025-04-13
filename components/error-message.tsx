import { AlertCircle } from "lucide-react"

interface ErrorMessageProps {
  message: string
  className?: string
}

export function ErrorMessage({ message, className = "" }: ErrorMessageProps) {
  if (!message) return null

  return (
    <div className={`bg-red-50 border border-red-200 text-red-600 p-3 rounded-md flex items-start gap-2 ${className}`}>
      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <span className="text-sm">{message}</span>
    </div>
  )
}
