import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { User, Mail, Briefcase, Building, Check, Sparkles } from 'lucide-react';

const AVATAR_OPTIONS = [
  { url: '/avatar_mia.png', label: 'Mia' },
  { url: '/avatar_alex.png', label: 'Alex' },
  { url: '/avatar_david.png', label: 'David' },
  { url: '/avatar_marcus.png', label: 'Marcus' },
  { url: '/avatar_oliver.png', label: 'Oliver' },
];

const COLOR_PALETTE = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#4f46e5'];

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const [name, setName] = useState(user?.name || 'Mia Chen');
  const [title, setTitle] = useState(user?.title || 'Product Design Lead');
  const [bio, setBio] = useState(
    user?.bio || 'Pioneering spatial interface interactions and 2D canvas workflows.'
  );
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '/avatar_mia.png');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || '#2563eb');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile({
      name,
      title,
      bio,
      avatar: avatarUrl,
      avatarColor,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="profile-view-page">
      <div className="section-title-row mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            User Profile
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your personal avatar, identity, and virtual workspace presence
          </p>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Left Column: Avatar Preview & Badge */}
        <div className="profile-card profile-preview-card">
          <div className="flex flex-col items-center text-center p-6">
            <div className="relative mb-4">
              <Avatar
                src={avatarUrl}
                name={name}
                size="xl"
                color={avatarColor}
                status="online"
              />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h2>
            <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{title}</span>
            <span className="text-xs text-slate-400 mt-1">{user?.email || 'mia.chen@proxispeak.internal'}</span>

            <div className="profile-workspace-pill mt-4">
              <Building size={13} />
              <span>{currentWorkspace?.name || 'Acme Corp HQ'}</span>
            </div>

            <div className="avatar-pickers-section mt-6 w-full text-left">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                Choose Avatar Character:
              </label>
              <div className="flex items-center justify-center gap-3 mb-4">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.url}
                    type="button"
                    onClick={() => setAvatarUrl(opt.url)}
                    className={`avatar-choice-btn ${avatarUrl === opt.url ? 'active' : ''}`}
                    title={opt.label}
                  >
                    <img src={opt.url} alt={opt.label} className="w-9 h-9 rounded-full object-cover" />
                  </button>
                ))}
              </div>

              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                Avatar Border Accent:
              </label>
              <div className="flex items-center justify-center gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`color-choice-btn ${avatarColor === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Form */}
        <div className="profile-card profile-form-card">
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Profile Details
            </h3>

            {savedNotice && (
              <div className="auth-alert alert-success mb-4">
                <Check size={16} />
                <span>Profile preferences updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label" htmlFor="prof-name">
                  Full Display Name
                </label>
                <div className="input-with-icon-wrap">
                  <User size={16} className="input-left-icon" />
                  <input
                    id="prof-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="form-input with-left-icon"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-title">
                  Professional Title / Role
                </label>
                <div className="input-with-icon-wrap">
                  <Briefcase size={16} className="input-left-icon" />
                  <input
                    id="prof-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input with-left-icon"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-bio">
                  About / Status Message
                </label>
                <textarea
                  id="prof-bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share what you are working on today..."
                  className="form-input"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="md" icon={Check}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
