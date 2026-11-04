import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Filter,
  Users,
  Compass,
  MessageSquare,
  Volume2,
  Mail,
  Building,
  CheckCircle,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Avatar, StatusBadge } from '../components/common/Avatar';
import { Button } from '../components/common/Button';

export function TeamMembersPage() {
  const { teamMembers } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse query string for initial search if any
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'online' | 'busy' | 'away' | 'offline'

  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.currentOffice.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'online' && (member.status === 'online' || member.status === 'busy')) ||
        member.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [teamMembers, searchTerm, statusFilter]);

  return (
    <div className="team-directory-page">
      {/* Header */}
      <div className="section-title-row mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Team Directory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Discover colleagues, view active spatial locations, and join ongoing office huddles
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="directory-filters-bar">
        <div className="directory-search-wrapper">
          <Search size={16} className="directory-search-icon" />
          <input
            type="search"
            placeholder="Search by name, role, email, or office floor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="directory-search-input"
          />
        </div>

        <div className="directory-filter-pills">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`filter-pill-btn ${statusFilter === 'all' ? 'active' : ''}`}
          >
            All ({teamMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('online')}
            className={`filter-pill-btn ${statusFilter === 'online' ? 'active' : ''}`}
          >
            Online & Busy ({teamMembers.filter((m) => m.status === 'online' || m.status === 'busy').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('away')}
            className={`filter-pill-btn ${statusFilter === 'away' ? 'active' : ''}`}
          >
            Away ({teamMembers.filter((m) => m.status === 'away').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('offline')}
            className={`filter-pill-btn ${statusFilter === 'offline' ? 'active' : ''}`}
          >
            Offline ({teamMembers.filter((m) => m.status === 'offline').length})
          </button>
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="directory-empty-state">
          <Users size={36} className="text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No teammates found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search keywords or status filter.</p>
        </div>
      ) : (
        <div className="directory-cards-grid">
          {filteredMembers.map((member) => (
            <div key={member.id} className="directory-member-card">
              <div className="member-card-top">
                <Avatar
                  src={member.avatar}
                  name={member.name}
                  size="lg"
                  status={member.status}
                  color={member.color}
                  isSpeaking={member.isSpeaking}
                />
                <div className="member-status-wrapper">
                  <StatusBadge status={member.status} />
                  {member.isSpeaking && (
                    <span className="speaking-pulse-badge">
                      <Volume2 size={11} className="inline mr-1" />
                      Talking
                    </span>
                  )}
                </div>
              </div>

              <div className="member-card-body">
                <h3 className="member-name">{member.name}</h3>
                <span className="member-title">{member.title}</span>
                <span className="member-email">{member.email}</span>

                <div className="member-location-pill">
                  <Compass size={13} className="text-indigo-500 shrink-0" />
                  <span className="truncate">{member.currentOffice}</span>
                </div>

                {member.bio && <p className="member-bio-text">{member.bio}</p>}
              </div>

              <div className="member-card-actions">
                {member.currentOffice !== 'Offline' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Compass}
                    className="w-full"
                    onClick={() => navigate(`/app/office/${encodeURIComponent(member.currentOffice)}`)}
                  >
                    Join {member.name.split(' ')[0]}'s Office
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" icon={Mail} className="w-full" disabled>
                    Colleague Offline
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeamMembersPage;
