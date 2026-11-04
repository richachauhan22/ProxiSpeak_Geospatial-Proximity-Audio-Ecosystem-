import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, Building, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export function RegisterPage() {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please provide a valid work email.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setError('You must accept the terms of service and spatial audio privacy agreement.');
      return;
    }

    try {
      await register({
        fullName,
        email,
        password,
        workspaceName: workspaceName.trim() || 'My Virtual Workspace',
      });
      setSuccess('Workspace registered! Launching campus...');
      setTimeout(() => {
        navigate('/app');
      }, 700);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check inputs.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="landing-ambient-orb orb-1" aria-hidden="true" />
      <div className="landing-ambient-orb orb-3" aria-hidden="true" />

      <div className="auth-card-box">
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
            Create your workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Build your company’s virtual office in less than 60 seconds
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
            <label className="form-label" htmlFor="reg-name">
              Full Name
            </label>
            <div className="input-with-icon-wrap">
              <User size={16} className="input-left-icon" />
              <input
                id="reg-name"
                type="text"
                placeholder="Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="form-input with-left-icon"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              Work Email
            </label>
            <div className="input-with-icon-wrap">
              <Mail size={16} className="input-left-icon" />
              <input
                id="reg-email"
                type="email"
                placeholder="alex@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input with-left-icon"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-workspace">
              Workspace / Company Name
            </label>
            <div className="input-with-icon-wrap">
              <Building size={16} className="input-left-icon" />
              <input
                id="reg-workspace"
                type="text"
                placeholder="Acme Technologies"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="form-input with-left-icon"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password
              </label>
              <div className="input-with-icon-wrap">
                <Lock size={16} className="input-left-icon" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input with-left-icon"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">
                Confirm
              </label>
              <div className="input-with-icon-wrap">
                <Lock size={16} className="input-left-icon" />
                <input
                  id="reg-confirm"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="form-input with-left-icon"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1 pb-2">
            <input
              id="reg-terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="reg-terms" className="text-xs text-slate-600 dark:text-slate-400">
              I agree to the ProxiSpeak Terms of Service, Privacy Policy, and allow spatial audio processing on this device.
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            iconRight={ArrowRight}
            className="w-full"
          >
            Create Workspace & Start
          </Button>
        </form>

        <div className="auth-footer-prompt">
          <span>Already have a workspace?</span>{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
