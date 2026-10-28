'use client';

// ==============================================================================
// Small Software Cloud - Google-Docs-Style Sharing Modal
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { App, AppMember, MemberRole, LinkAccess } from '@/types';
import { X, Globe, Lock, Copy, Check, UserPlus, Trash2, Shield } from 'lucide-react';

interface ShareModalProps {
  app: App;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onAppUpdated: (updatedApp: App) => void;
}

export default function ShareModal({
  app,
  currentUserId,
  isOpen,
  onClose,
  onAppUpdated
}: ShareModalProps) {
  const [members, setMembers] = useState<AppMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('viewer');
  const [linkAccess, setLinkAccess] = useState<LinkAccess>(app.link_access || 'none');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = app.owner_id === currentUserId;
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/a/${app.id}` 
    : `/a/${app.id}`;

  useEffect(() => {
    if (isOpen) {
      setLinkAccess(app.link_access || 'none');
      fetchMembers();
    }
  }, [isOpen, app.id]);

  async function fetchMembers() {
    try {
      const res = await fetch(`/api/apps/${app.id}/members`);
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/apps/${app.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, userId: currentUserId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');

      setEmail('');
      fetchMembers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      await fetch(`/api/apps/${app.id}/members?memberId=${memberId}&userId=${currentUserId}`, {
        method: 'DELETE'
      });
      setMembers(members.filter(m => m.id !== memberId));
    } catch (err) {
      console.error('Error removing member:', err);
    }
  }

  async function handleUpdateRole(memberId: string, newRole: MemberRole) {
    try {
      await fetch(`/api/apps/${app.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole, userId: currentUserId })
      });
      setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch (err) {
      console.error('Error updating role:', err);
    }
  }

  async function handleToggleLinkAccess(newAccess: LinkAccess) {
    setLinkAccess(newAccess);
    try {
      const res = await fetch(`/api/apps/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_access: newAccess, userId: currentUserId })
      });
      const data = await res.json();
      if (data.app) onAppUpdated(data.app);
    } catch (err) {
      console.error('Error updating link access:', err);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Share &quot;{app.title}&quot;
            </h2>
            <p className="text-xs text-slate-400 mt-1">Manage team access and public link permissions</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Invite Form */}
        {isOwner && (
          <form onSubmit={handleAddMember} className="mt-5 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Invite collaborator by email..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as MemberRole)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-semibold focus:outline-none"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invite
            </button>
          </form>
        )}

        {/* Members List */}
        <div className="mt-5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            People with access
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {/* Owner */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                  O
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">{app.owner?.name || 'App Owner'}</div>
                  <div className="text-[11px] text-slate-400">{app.owner?.email || 'Owner'}</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                Owner
              </span>
            </div>

            {/* Invited Collaborators */}
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center uppercase">
                    {member.email[0]}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-200">{member.email}</div>
                    <div className="text-[11px] text-slate-400 capitalize">{member.role}</div>
                  </div>
                </div>

                {isOwner ? (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value as MemberRole)}
                      className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-300 font-medium"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 capitalize">{member.role}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* General Link Access */}
        <div className="mt-5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 p-1.5 rounded-lg bg-slate-800 text-slate-300">
                {linkAccess === 'view' ? <Globe className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">General access</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {linkAccess === 'view' 
                    ? 'Anyone on the internet with the link can view' 
                    : 'Restricted: Only invited people can access'}
                </div>
              </div>
            </div>

            {isOwner && (
              <select
                value={linkAccess}
                onChange={(e) => handleToggleLinkAccess(e.target.value as LinkAccess)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-none"
              >
                <option value="none">Restricted</option>
                <option value="view">Anyone with link</option>
              </select>
            )}
          </div>
        </div>

        {/* Footer / Copy Link */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Link Copied!' : 'Copy link'}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
