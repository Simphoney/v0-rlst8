"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Save, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface PageNavigationProps {
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onSave?: () => void
  onCancel?: () => void
  backUrl?: string
  nextUrl?: string
  showSave?: boolean
  showCancel?: boolean
  showPagination?: boolean
  saveLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  className?: string
}

export function PageNavigation({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onSave,
  onCancel,
  backUrl,
  nextUrl,
  showSave = false,
  showCancel = false,
  showPagination = false,
  saveLabel = "Save Changes",
  cancelLabel = "Cancel",
  isLoading = false,
  className = "",
}: PageNavigationProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl)
    } else {
      router.back()
    }
  }

  const handleNext = () => {
    if (nextUrl) {
      router.push(nextUrl)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div className={`flex items-center justify-between border-t bg-white px-4 py-3 sm:px-6 ${className}`}>
      {/* Left side - Back navigation */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" onClick={handleBack} className="flex items-center bg-transparent">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {showPagination && totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="flex items-center bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="flex items-center"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center space-x-2">
        {showCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center bg-transparent"
          >
            <X className="mr-2 h-4 w-4" />
            {cancelLabel}
          </Button>
        )}

        {showSave && (
          <Button onClick={onSave} disabled={isLoading} className="flex items-center">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : saveLabel}
          </Button>
        )}

        {nextUrl && (
          <Button onClick={handleNext} className="flex items-center">
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
