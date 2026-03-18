'use client'

import { useState } from 'react'
import { Clock, Settings, BarChart, LogOut, History } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PomodoroStatusBanner } from '@/components/pomodoro-status-banner'

const navigation = [
  {
    title: 'Track Time',
    href: '/track-time',
    icon: Clock,
  },
  {
    title: 'History',
    href: '/history',
    icon: History,
  },
  {
    title: 'Configure',
    href: '/configure',
    icon: Settings,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart,
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <Sidebar>
        <SidebarHeader className="border-b p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-primary mb-0.5">Habit &amp;</span>
              <span className="font-display font-extrabold text-xl uppercase tracking-tight leading-none text-foreground">
                Time Tracker
              </span>
            </div>
            <ThemeToggle />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.href}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <div className="flex flex-col gap-2">
            {user && (
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSignOutDialog(true)}
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You will need to sign in again to access your data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SidebarInset className="overflow-y-auto">
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
      
      {/* Global Pomodoro Status Banner - shows when timer is running on other pages */}
      <PomodoroStatusBanner />
    </SidebarProvider>
  )
}