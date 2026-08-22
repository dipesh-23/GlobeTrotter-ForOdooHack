import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (signUpError) throw signUpError;
      
      // Route based on standard admin credentials (highly unlikely on signup, but keeps logic consistent)
      if (data.user?.email === 'admin@globetrotter.com') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-[24px]">
      <div className="w-full max-w-[400px] bg-surface rounded-[12px] shadow-card border border-border p-[32px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center mb-[32px]">
          <div className="w-[48px] h-[48px] rounded-full bg-route/10 flex items-center justify-center mb-[16px]">
            <span className="font-['Fraunces'] font-bold text-route text-[24px]">G</span>
          </div>
          <h1 className="font-['Fraunces'] text-[28px] font-semibold text-ink text-center">
            Join GlobeTrotter
          </h1>
          <p className="text-[14px] text-muted text-center mt-[8px]">
            Create an account to start planning your trips.
          </p>
        </div>

        {error && (
          <div className="p-[12px] bg-danger/10 text-danger text-[13px] border border-danger/20 rounded-[8px] mb-[24px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[4px]">
            <label className="text-[12px] font-medium uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full bg-bg border border-border rounded-[6px] px-[12px] py-[10px] text-[15px] text-ink focus:outline-none focus:border-horizon transition-colors"
              placeholder="How should we call you?"
            />
          </div>

          <div className="flex flex-col gap-[4px]">
            <label className="text-[12px] font-medium uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-bg border border-border rounded-[6px] px-[12px] py-[10px] text-[15px] text-ink focus:outline-none focus:border-horizon transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium uppercase tracking-wider text-muted font-['IBM_Plex_Mono']">
                Password
              </label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-bg border border-border rounded-[6px] px-[12px] py-[10px] text-[15px] text-ink focus:outline-none focus:border-horizon transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-route text-white font-medium py-[10px] rounded-[6px] hover:opacity-90 transition-opacity mt-[8px] disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-[24px] text-center text-[14px] text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-horizon font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
