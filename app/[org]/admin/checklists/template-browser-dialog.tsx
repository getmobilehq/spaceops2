"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { BookOpen, Copy, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cloneGlobalTemplate } from "@/actions/checklists"
import type { GlobalChecklistTemplate } from "@/lib/queries/checklists"

interface TemplateBrowserDialogProps {
  globalTemplates: GlobalChecklistTemplate[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TemplateBrowserDialog({
  globalTemplates,
  open,
  onOpenChange,
}: TemplateBrowserDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [cloningId, setCloningId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Group templates by room_type_name
  const grouped = new Map<string, GlobalChecklistTemplate[]>()
  for (const tpl of globalTemplates) {
    const key = tpl.room_type_name
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(tpl)
  }

  const sortedKeys = Array.from(grouped.keys()).sort()

  async function handleClone(templateId: string) {
    setCloningId(templateId)
    try {
      const result = await cloneGlobalTemplate({ globalTemplateId: templateId })
      if (result.success) {
        toast({ title: "Template cloned successfully" })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Failed to clone template",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setCloningId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Template Library
          </DialogTitle>
          <DialogDescription>
            Browse shared checklist templates and clone them into your
            organisation.
          </DialogDescription>
        </DialogHeader>

        {globalTemplates.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No shared templates available yet.
          </p>
        ) : (
          <div className="space-y-6">
            {sortedKeys.map((roomTypeName) => {
              const group = grouped.get(roomTypeName) || []
              return (
                <div key={roomTypeName}>
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {roomTypeName}
                  </h3>
                  <div className="space-y-2">
                    {group.map((tpl) => {
                      const items = tpl.global_checklist_items
                      const isExpanded = expandedId === tpl.id
                      const previewItems = items.slice(0, 3)
                      const remainingCount = items.length - 3

                      return (
                        <div
                          key={tpl.id}
                          className="rounded-md border p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="min-w-0">
                                <p className="font-medium">{tpl.name}</p>
                                {tpl.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {tpl.description}
                                  </p>
                                )}
                              </div>
                              <Badge variant="secondary">
                                {items.length} item
                                {items.length !== 1 ? "s" : ""}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {items.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setExpandedId(
                                      isExpanded ? null : tpl.id
                                    )
                                  }
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={cloningId !== null}
                                onClick={() => handleClone(tpl.id)}
                              >
                                {cloningId === tpl.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <Copy className="mr-1 h-3 w-3" />
                                )}
                                Clone
                              </Button>
                            </div>
                          </div>

                          {isExpanded && items.length > 0 && (
                            <ul className="ml-1 space-y-1 text-sm text-muted-foreground">
                              {(isExpanded ? items : previewItems).map(
                                (item) => (
                                  <li
                                    key={item.id}
                                    className="flex items-start gap-2"
                                  >
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                                    {item.description}
                                  </li>
                                )
                              )}
                            </ul>
                          )}

                          {!isExpanded && items.length > 0 && (
                            <ul className="ml-1 space-y-1 text-sm text-muted-foreground">
                              {previewItems.map((item) => (
                                <li
                                  key={item.id}
                                  className="flex items-start gap-2"
                                >
                                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                                  {item.description}
                                </li>
                              ))}
                              {remainingCount > 0 && (
                                <li className="text-xs text-muted-foreground/70 italic">
                                  and {remainingCount} more...
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
