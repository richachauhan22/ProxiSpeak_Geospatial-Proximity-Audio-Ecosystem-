import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('mia.chen@proxispeak.internal');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid business or workspace email.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    try {
      await login(email, password);
      setSuccess('Authentication verified. Entering your workspace...');
      setTimeout(() => {
        navigate('/app');
      }, 600);
    } catch (err) {
      setError(err.message || 'Unable to authenticate. Check credentials or try demo credentials.');
    }
  };

  const fillDemoCredentials = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="auth-page-container">
      {/* Ambient background glow */}
      <div className="landing-ambient-orb orb-1" aria-hidden="true" />
      <div className="landing-ambient-orb orb-2" aria-hidden="true" />

      <div className="auth-card-box">
        {/* Brand header */}
        <div className="auth-header-wrapper">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="brand-logo-glow">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L4 6.5V17.5L12 22L20 17.5V6.5L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3.2" fill="currentColor" />
              </svg>
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white">
              Proxi<span className="text-indigo-600">Speak</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sign in to your office
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter your workspace credentials to join the spatial floor
          </p>
        </div>

        {error && (
          <div className="auth-alert alert-error" role="alert">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert alert-success">
            <CheckCircle size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-fields">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <div className="input-with-icon-wrap">
              <Mail size={16} className="input-left-icon" />
              <input
                id="login-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input with-left-icon"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center mb-1">
              <label className="form-label mb-0" htmlFor="login-password">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700">
                Forgot password?
              </Link>
            </div>
            <div className="input-with-icon-wrap">
              <Lock size={16} className="input-left-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input with-left-icon with-right-icon"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="input-right-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm py-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs">Remember this device</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            iconRight={ArrowRight}
            className="w-full mt-2"
          >
            Enter Office
          </Button>
        </form>

        {/* Quick Demo Logins */}
        <div className="demo-credentials-tray">
          <span className="demo-tray-label">Quick Demo Profiles:</span>
          <div className="demo-buttons-row">
            <button
              type="button"
              onClick={() => fillDemoCredentials('mia.chen@proxispeak.internal')}
              className="demo-pill-btn"
            >
              Mia (Product)
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('alex.rivera@proxispeak.internal')}
              className="demo-pill-btn"
            >
              Alex (Eng)
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('david.kim@proxispeak.internal')}
              className="demo-pill-btn"
            >
              David (Arch)
            </button>
          </div>
        </div>

        <div className="auth-footer-prompt">
          <span>Don't have a virtual workspace yet?</span>{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
