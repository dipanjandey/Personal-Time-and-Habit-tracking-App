'use client'

import { useState, useEffect, useMemo } from 'react'
import { Clock, Target, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
} from 'recharts'
import { StatCard } from '@/components/analytics/stat-card'
import { InsightCard } from '@/components/analytics/insight-card'
import { useAnalyticsData } from '@/hooks/use-analytics-data'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { useConfigStore } from '@/store/config-store'
import {
  formatDuration,
  formatPercentage,
  formatChartDate,
  formatDisplayDate,
  formatTooltipDate,
  type TimePeriod,
  type DateRange,
} from '@/lib/analytics-utils'
import { useChartColors } from '@/hooks/use-chart-colors'

// Format duration for Y-axis (convert minutes to hours)
function formatYAxisDuration(minutes: number): string {
  const hours = minutes / 60
  if (hours < 1) return `${Math.round(minutes)}m`
  return `${hours.toFixed(1)}h`
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<TimePeriod>('week')
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [workAreaExpanded, setWorkAreaExpanded] = useState(false)
  
  // Get computed chart colors (adapts to light/dark mode)
  const CHART_COLORS = useChartColors()

  const { loadEntries, initializeRealtimeSubscription } = useTimeTrackingStore()
  const { loadWorkAreas, loadWorkTypes } = useConfigStore()

  useEffect(() => {
    // Force load fresh entries on mount
    loadEntries()
    loadWorkAreas()
    loadWorkTypes()

    // Set up real-time subscription to keep data in sync
    const unsubscribe = initializeRealtimeSubscription()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [loadEntries, loadWorkAreas, loadWorkTypes, initializeRealtimeSubscription])

  // Derive custom date range from dateFrom and dateTo
  const customDateRange = useMemo(() => {
    if (dateFrom && dateTo) {
      return { from: dateFrom, to: dateTo }
    }
    return undefined
  }, [dateFrom, dateTo])

  const analyticsData = useAnalyticsData(
    period,
    period === 'custom' ? customDateRange : undefined
  )

  const { stats, workAreaBreakdown, workTypeBreakdown, dailyTrends, insights, trendComparison } = analyticsData

  // Prepare pie chart data with legend
  const maxVisibleAreas = 5
  const pieDataForChart = workAreaBreakdown.slice(0, maxVisibleAreas).map((item, index) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }))
  
  // Legend data - show all when expanded, otherwise show top 5
  const legendData = workAreaExpanded 
    ? workAreaBreakdown.map((item, index) => ({
        ...item,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
    : pieDataForChart

  // Get trend label based on period
  const getTrendLabel = () => {
    switch (period) {
      case 'today': return 'vs yesterday'
      case 'week': return 'vs last week'
      case 'month': return 'vs last month'
      default: return 'vs previous period'
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 overflow-x-hidden">
      {/* Header - Consistent with Track Time page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8 pb-4 border-b">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Time Period Selector */}
      <Tabs
        value={period}
        onValueChange={(value) => setPeriod(value as TimePeriod)}
        className="mb-8"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          {/* Custom Date Range Picker */}
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    {dateFrom ? formatDisplayDate(dateFrom) : 'From date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">to</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    {dateTo ? formatDisplayDate(dateTo) : 'To date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    disabled={(date) => dateFrom ? date < dateFrom : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </Tabs>

      {/* Summary Statistics Cards - Only 2 key metrics with trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Total Time Tracked"
          value={formatDuration(stats.totalDuration)}
          icon={Clock}
          trend={trendComparison.totalDurationChange}
          trendLabel={getTrendLabel()}
        />
        <StatCard
          title="Total Pomodoros"
          value={stats.totalPomodoros.toString()}
          icon={Target}
          trend={trendComparison.totalPomodorosChange}
          trendLabel={getTrendLabel()}
        />
      </div>

      {/* Quick Insights Section */}
      {insights.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Insights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <InsightCard
                key={index}
                title={insight.title}
                value={insight.value}
                icon={insight.icon}
              />
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Work Area Distribution - Donut with Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Time by Work Area</CardTitle>
          </CardHeader>
          <CardContent>
            {workAreaBreakdown.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <ChartContainer
                  config={pieDataForChart.reduce((acc, item) => {
                    acc[item.name] = {
                      label: item.name,
                      color: item.fill,
                    }
                    return acc
                  }, {} as Record<string, { label: string; color: string }>)}
                  className="h-[200px] w-[200px] flex-shrink-0"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatDuration(value as number)}
                        />
                      }
                    />
                    <Pie
                      data={pieDataForChart}
                      dataKey="duration"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                    >
                      {pieDataForChart.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                {/* External Legend */}
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  {legendData.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-sm flex-shrink-0 mt-0.5" 
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="flex-1 min-w-0">{item.name}</span>
                      <span className="text-muted-foreground flex-shrink-0">{formatPercentage(item.percentage)}</span>
                    </div>
                  ))}
                  {workAreaBreakdown.length > maxVisibleAreas && (
                    <button
                      onClick={() => setWorkAreaExpanded(!workAreaExpanded)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-1 transition-colors"
                    >
                      {workAreaExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          Show all ({workAreaBreakdown.length - maxVisibleAreas} more)
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p>No data available for this period</p>
                  <p className="text-sm mt-1">Start tracking time to see your work area distribution</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Type Distribution - Bar Chart with Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Time by Work Type</CardTitle>
          </CardHeader>
          <CardContent>
            {workTypeBreakdown.length > 0 ? (
              <ChartContainer
                config={workTypeBreakdown.reduce((acc, item, index) => {
                  acc[item.name] = {
                    label: item.name,
                    color: CHART_COLORS[index % CHART_COLORS.length],
                  }
                  return acc
                }, {} as Record<string, { label: string; color: string }>)}
                className="h-[250px] w-full"
              >
                <RechartsBarChart data={workTypeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tickFormatter={formatYAxisDuration}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatDuration(value as number)}
                      />
                    }
                  />
                  <Bar dataKey="duration" radius={[8, 8, 0, 0]}>
                    {workTypeBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                    <LabelList
                      dataKey="duration"
                      position="top"
                      formatter={(value: number) => formatYAxisDuration(value)}
                      className="fill-foreground text-xs"
                    />
                  </Bar>
                </RechartsBarChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p>No data available for this period</p>
                  <p className="text-sm mt-1">Start tracking time to see your work type breakdown</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Productivity Trend - Now a Bar Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Daily Productivity</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyTrends.length > 0 && dailyTrends.some(d => d.duration > 0) ? (
            <ChartContainer
              config={{
                duration: {
                  label: 'Hours Tracked',
                  color: CHART_COLORS[0],
                },
              }}
              className="h-[250px] w-full"
            >
              <RechartsBarChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tickFormatter={formatYAxisDuration}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => formatTooltipDate(label as string)}
                      formatter={(value) => formatDuration(value as number)}
                    />
                  }
                />
                <Bar
                  dataKey="duration"
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="duration"
                    position="top"
                    formatter={(value: number) => formatYAxisDuration(value)}
                    className="fill-foreground text-xs"
                  />
                </Bar>
              </RechartsBarChart>
            </ChartContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p>No data available for this period</p>
                <p className="text-sm mt-1">Start tracking time to see your daily productivity trends</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
