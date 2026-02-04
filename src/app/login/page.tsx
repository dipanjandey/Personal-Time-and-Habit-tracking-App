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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="w-full max-w-md p-8">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                        <Clock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Habit & Time Tracker</h1>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white text-center mb-6">
                        {isSignUp ? 'Create an account' : 'Welcome back'}
                    </h2>

                    {/* Google Sign In */}
                    <Button
                        onClick={handleGoogleAuth}
                        disabled={loading}
                        variant="outline"
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0 mb-4"
                    >
                        <Chrome className="w-5 h-5 mr-2" />
                        Continue with Google
                    </Button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/20"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-transparent text-gray-400">or</span>
                        </div>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-200">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-200">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                                {message}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                        </Button>
                    </form>

                    {/* Toggle Sign Up / Sign In */}
                    <p className="mt-6 text-center text-gray-400 text-sm">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp)
                                setError(null)
                                setMessage(null)
                            }}
                            className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
