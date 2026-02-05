'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Mail, Chrome } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                })
                if (error) throw error
                setMessage('Check your email to confirm your account!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                router.refresh()
                router.push('/track-time')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleAuth = async () => {
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })
            if (error) throw error
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background">
            <div className="w-full max-w-md p-8">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="p-3 bg-primary rounded-xl">
                        <Clock className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Habit & Time Tracker</h1>
                </div>

                {/* Card */}
                <div className="bg-card/80 backdrop-blur-lg rounded-2xl p-8 border border-border shadow-2xl">
                    <h2 className="text-xl font-semibold text-card-foreground text-center mb-6">
                        {isSignUp ? 'Create an account' : 'Welcome back'}
                    </h2>

                    {/* Google Sign In */}
                    <Button
                        onClick={handleGoogleAuth}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mb-4"
                    >
                        <Chrome className="w-5 h-5 mr-2" />
                        Continue with Google
                    </Button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-card text-muted-foreground">or</span>
                        </div>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-card-foreground">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-card-foreground">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-danger/20 border border-danger/50 rounded-lg text-danger text-sm">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="p-3 bg-success/20 border border-success/50 rounded-lg text-success text-sm">
                                {message}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                        </Button>
                    </form>

                    {/* Toggle Sign Up / Sign In */}
                    <p className="mt-6 text-center text-muted-foreground text-sm">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp)
                                setError(null)
                                setMessage(null)
                            }}
                            className="text-primary hover:text-primary/80 font-medium"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
