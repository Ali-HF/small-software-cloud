'use client';

// ==============================================================================
// Small Software Cloud - Google-Docs-Style Sharing Modal (Design Token System)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { App, AppMember, MemberRole, LinkAccess } from '@/types';
import { Globe, Lock, UserPlus, Trash2, Mail } from 'lucide-react';
import {
  Modal,
  Button,
  Input,
  Badge,
  CopyField,
  InlineAlert,
} from '@/components/ui';

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
  onAppUpdated,
}: ShareModalProps) {
  const [members, setMembers] = useState<AppMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('viewer');
  const [linkAccess, setLinkAccess] = useState<LinkAccess>(
    app.link_access || 'none'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner =
    app.role === 'owner' ||
    app.owner_id === currentUserId ||
    (currentUserId === 'usr_alice' &&
      app.owner_id === '00000000-0000-0000-0000-000000000001');
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/a/${app.id}`
      : `/a/${app.id}`;

  useEffect(() => {
    if (isOpen) {
      setLinkAccess(app.link_access || 'none');
      setError(null);
      fetchMembers();
    }
  }, [isOpen, app.id, app.link_access]);

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
        body: JSON.stringify({ email, role, userId: currentUserId }),
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
      await fetch(
        `/api/apps/${app.id}/members?memberId=${memberId}&userId=${currentUserId}`,
        {
          method: 'DELETE',
        }
      );
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (err) {
      console.error('Error removing member:', err);
    }
  }

  async function handleUpdateRole(memberId: string, newRole: MemberRole) {
    try {
      await fetch(`/api/apps/${app.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          role: newRole,
          userId: currentUserId,
        }),
      });
      setMembers(
        members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
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
        body: JSON.stringify({
          link_access: newAccess,
          userId: currentUserId,
        }),
      });
      const data = await res.json();
      if (data.app) onAppUpdated(data.app);
    } catch (err) {
      console.error('Error updating link access:', err);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share "${app.title}"`}
      description="Invite collaborators by email or configure link-level access."
      maxWidth="lg"
      footer={
        <div className="w-full flex items-center justify-between gap-3">
          <span className="text-[11px] text-[var(--text-muted)]">
            {linkAccess === 'view'
              ? 'Public link active (read-only)'
              : 'Restricted to invited members'}
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {error && <InlineAlert variant="error">{error}</InlineAlert>}

        {/* Copy Share Link */}
        <CopyField label="Shareable App Link" value={shareUrl} />

        {/* Invite Form */}
        {isOwner && (
          <form onSubmit={handleAddMember} className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                type="email"
                label="Invite by Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as MemberRole)}
              aria-label="Member role"
              className="h-9 px-3 rounded-md bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-medium focus-ring cursor-pointer"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Invite
            </Button>
          </form>
        )}

        {/* Members List */}
        <div>
          <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-2">
            People with access ({members.length + 1})
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {/* Owner */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)] font-bold text-xs flex items-center justify-center">
                  O
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    {app.owner?.name || 'App Owner'}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">
                    {app.owner?.email || 'Owner'}
                  </div>
                </div>
              </div>
              <Badge variant="accent">Owner</Badge>
            </div>

            {/* Invited Collaborators */}
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-default)]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] font-bold text-xs flex items-center justify-center uppercase">
                    {member.email[0]}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[var(--text-primary)] font-mono">
                      {member.email}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] capitalize">
                      {member.role === 'editor'
                        ? 'Can edit data & iterate versions'
                        : 'Read-only viewer'}
                    </div>
                  </div>
                </div>

                {isOwner ? (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleUpdateRole(
                          member.id,
                          e.target.value as MemberRole
                        )
                      }
                      aria-label={`Change role for ${member.email}`}
                      className="h-7 px-2 rounded-md bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-medium focus-ring cursor-pointer"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-[var(--status-revoked-text)] rounded-md hover:bg-[var(--status-revoked-bg)] transition-colors cursor-pointer focus-ring"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Badge
                    variant={member.role === 'editor' ? 'active' : 'default'}
                  >
                    {member.role}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* General Link Access */}
        <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-[var(--bg-surface)] border border-[var(--border-default)]">
                {linkAccess === 'view' ? (
                  <Globe className="w-4 h-4 text-[var(--status-active-text)]" />
                ) : (
                  <Lock className="w-4 h-4 text-[var(--status-restricted-text)]" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  General link access
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {linkAccess === 'view'
                    ? 'Anyone with the link can view (read-only)'
                    : 'Restricted — only invited people can open this app'}
                </div>
              </div>
            </div>

            {isOwner ? (
              <select
                value={linkAccess}
                onChange={(e) =>
                  handleToggleLinkAccess(e.target.value as LinkAccess)
                }
                aria-label="General link access"
                className="h-8 px-2.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-semibold focus-ring cursor-pointer"
              >
                <option value="none">Restricted</option>
                <option value="view">Anyone with link</option>
              </select>
            ) : (
              <Badge variant={linkAccess === 'view' ? 'active' : 'restricted'}>
                {linkAccess === 'view' ? 'Public View' : 'Restricted'}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
