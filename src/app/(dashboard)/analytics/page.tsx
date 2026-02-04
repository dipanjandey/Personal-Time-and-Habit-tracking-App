'use client'

import { useState, useEffect } from 'react'
import { BarChart, Clock, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { StatCard } from '@/components/analytics/stat-card'
import { useAnalyticsData } from '@/hooks/use-analytics-data'
import { useTimeTrackingStore } from '@/store/time-tracking-store'
import { useConfigStore } from '@/store/config-store'
import {
  formatDuration,
  formatPercentage,
  formatChartDate,
  formatDisplayDate,
  type TimePeriod,
  type DateRange,
} from '@/lib/analytics-utils'
import { format } from 'date-fns'

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<TimePeriod>('week')
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>()
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()

  const { loadEntries } = useTimeTrackingStore()
  const { loadWorkAreas, loadWorkTypes } = useConfigStore()

  useEffect(() => {
    loadEntries()
    loadWorkAreas()
    loadWorkTypes()
  }, [loadEntries, loadWorkAreas, loadWorkTypes])

  // Update custom date range when both dates are selected
  useEffect(() => {
    if (dateFrom && dateTo) {
      setCustomDateRange({ from: dateFrom, to: dateTo })
    }
  }, [dateFrom, dateTo])

  const analyticsData = useAnalyticsData(
    period,
    period === 'custom' ? customDateRange : undefined
  )

  const { stats, workAreaBreakdown, workTypeBreakdown, dailyTrends } = analyticsData

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <div className="flex items-center gap-3">
          <BarChart className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
      </div>

      {/* Time Period Selector */}
      <Tabs
        value={period}
        onValueChange={(value) => setPeriod(value as TimePeriod)}
        className="mb-8"
      >
        <div className="flex items-center gap-4">
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

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Time Tracked"
          value={formatDuration(stats.totalDuration)}
          icon={Clock}
        />
        <StatCard
          title="Total Pomodoros"
          value={stats.totalPomodoros.toString()}
          icon={Target}
        />
        <StatCard
          title="Average Session"
          value={formatDuration(stats.averageSessionDuration)}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions.toString()}
          icon={BarChart}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Work Area Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Time by Work Area</CardTitle>
          </CardHeader>
          <CardContent>
            {workAreaBreakdown.length > 0 ? (
              <ChartContainer
                config={workAreaBreakdown.reduce((acc, item, index) => {
                  acc[item.name] = {
                    label: item.name,
                    color: CHART_COLORS[index % CHART_COLORS.length],
                  }
                  return acc
                }, {} as Record<string, { label: string; color: string }>)}
                className="h-[300px]"
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
                    data={workAreaBreakdown}
                    dataKey="duration"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name} (${formatPercentage(entry.percentage)})`}
                  >
                    {workAreaBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Type Distribution */}
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
                className="h-[300px]"
              >
                <RechartsBarChart data={workTypeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
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
                  </Bar>
                </RechartsBarChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productivity Trends */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Daily Productivity Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyTrends.length > 0 ? (
            <ChartContainer
              config={{
                duration: {
                  label: 'Duration',
                  color: 'hsl(var(--chart-1))',
                },
              }}
              className="h-[300px]"
            >
              <RechartsLineChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                />
                <YAxis />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => formatDisplayDate(label as string)}
                      formatter={(value) => formatDuration(value as number)}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="duration"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-1))' }}
                />
              </RechartsLineChart>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {workAreaBreakdown.length > 0 ? (
            <div className="space-y-8">
              {/* Work Area Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-4">By Work Area</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work Area</TableHead>
                      <TableHead className="text-right">Time Spent</TableHead>
                      <TableHead className="text-right">Pomodoros</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workAreaBreakdown.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">
                          {formatDuration(item.duration)}
                        </TableCell>
                        <TableCell className="text-right">{item.pomodoros}</TableCell>
                        <TableCell className="text-right">
                          {formatPercentage(item.percentage)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Work Type Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-4">By Work Type</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work Type</TableHead>
                      <TableHead className="text-right">Time Spent</TableHead>
                      <TableHead className="text-right">Pomodoros</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workTypeBreakdown.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">
                          {formatDuration(item.duration)}
                        </TableCell>
                        <TableCell className="text-right">{item.pomodoros}</TableCell>
                        <TableCell className="text-right">
                          {formatPercentage(item.percentage)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No data available for this period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
