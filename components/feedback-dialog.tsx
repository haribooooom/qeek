"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertCircle, CheckCircle } from "lucide-react"

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSubmit = async () => {
    if (!feedback.trim()) return

    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback }),
      })

      if (response.ok) {
        setSubmitStatus("success")
        setFeedback("")
        setTimeout(() => {
          onOpenChange(false)
          setSubmitStatus("idle")
        }, 2000)
      } else {
        setSubmitStatus("error")
      }
    } catch (error) {
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>フィードバックを送信</DialogTitle>
        </DialogHeader>

        {submitStatus === "success" ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="bg-green-100 p-3 rounded-full mb-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-lg font-medium">ありがとうございます！</p>
            <p className="text-gray-500 mt-1">フィードバックを受け取りました。</p>
          </div>
        ) : submitStatus === "error" ? (
          <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center mb-4">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>送信中にエラーが発生しました。もう一度お試しください。</span>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Qeekをより良くするためのご意見やご提案をお聞かせください。</p>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="ご意見・ご要望をお書きください..."
                className="min-h-[120px]"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                キャンセル
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !feedback.trim()}>
                {isSubmitting ? "送信中..." : "送信する"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
