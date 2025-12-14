"use client"

import * as React from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import type { Widget } from '@/types/dashboard'

export function WidgetCard({ widget }: { widget: Widget }) {
  return (
    <Card className="bg-card/60">
      <CardContent>
        <CardTitle className="text-sm text-muted-foreground">{widget.title}</CardTitle>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-semibold">{widget.value}</div>
          {typeof widget.change === 'number' ? (
            <div className={`text-sm font-medium ${widget.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {widget.change >= 0 ? `+${widget.change}%` : `${widget.change}%`}
            </div>
          ) : null}
        </div>
        {widget.description ? <p className="mt-2 text-xs text-muted-foreground">{widget.description}</p> : null}
      </CardContent>
    </Card>
  )
}

export default WidgetCard
