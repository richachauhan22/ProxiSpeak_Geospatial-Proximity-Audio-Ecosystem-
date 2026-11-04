import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export function ForgotPasswordPage() {
  const { forgotPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid account email.');
      return;
    }

    try {
      const res = await forgotPassword(email);
      setSuccess(res?.message || `Password recovery link dispatched to ${email}`);
    } catch (err) {
      setError(err.message || 'Unable to submit recovery request.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="landing-ambient-orb orb-2" aria-hidden="true" />

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
            Reset your password
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            We will send a secure spatial workspace recovery link to your inbox
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
            <label className="form-label" htmlFor="forgot-email">
              Account Email
            </label>
            <div className="input-with-icon-wrap">
              <Mail size={16} className="input-left-icon" />
              <input
                id="forgot-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input with-left-icon"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            iconRight={ArrowRight}
            className="w-full mt-2"
          >
            Send Recovery Link
          </Button>
        </form>

        <div className="auth-footer-prompt">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 text-sm font-medium">
            <ArrowLeft size={14} />
            <span>Back to sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
