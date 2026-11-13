import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Trash2, UserPlus, Users } from "lucide-react";
import {
  workspacesAPI,
  type InvitableRole,
  type WorkspaceInvite,
  type WorkspaceMember,
  type WorkspaceRole,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button, Field, Input, InlineNote, Select } from "@/components/ui";

const ROLE_LABEL: Record<WorkspaceRole, string> = {
  owner: "Owner",
  admin: "Admin",
  collector: "Collector",
  viewer: "Viewer",
};

const ROLE_HINT: Record<WorkspaceRole, string> = {
  owner: "Settlement and bank accounts",
  admin: "Everything except moving money out",
  collector: "Create collections, record payments",
  viewer: "Read only",
};

function initials(name: string | null | undefined, email: string): string {
  const source = name?.trim() || email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function People() {
  const { user, merchant } = useAuth();
  const { success, error: toastError } = useToast();

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitableRole>("collector");
  const [sending, setSending] = useState(false);
  const [freshLink, setFreshLink] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [memberResult, inviteResult] = await Promise.all([
        workspacesAPI.members(),
        workspacesAPI.invites().catch(() => ({ invites: [] })),
      ]);
      setMembers(memberResult.members);
      setInvites(inviteResult.invites);
    } catch (err) {
      toastError("Could not load people", err instanceof Error ? err.message : "");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  const myRole = members.find((member) => member.user_id === user?.id)?.role ?? "viewer";
  const canInvite = myRole === "owner" || myRole === "admin";
  const isOwner = myRole === "owner";

  const sendInvite = async () => {
    if (!email.trim()) return;
    setSending(true);
    try {
      const result = await workspacesAPI.invite({ email: email.trim(), role });
      setFreshLink(result.invite_url);
      setEmail("");
      success(
        result.emailed ? "Invite sent" : "Invite created",
        result.emailed
          ? "They'll get an email with a link to join."
          : "Email isn't configured, so share the link below.",
      );
      await load();
    } catch (err) {
      toastError("Could not invite", err instanceof Error ? err.message : "");
    } finally {
      setSending(false);
    }
  };

  const changeRole = async (member: WorkspaceMember, next: InvitableRole) => {
    setBusyId(member.id);
    try {
      await workspacesAPI.updateMember(member.id, next);
      setMembers((current) =>
        current.map((row) => (row.id === member.id ? { ...row, role: next } : row)),
      );
      success("Role updated", `${member.name || member.email} is now ${ROLE_LABEL[next]}.`);
    } catch (err) {
      toastError("Could not change role", err instanceof Error ? err.message : "");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (member: WorkspaceMember) => {
    setBusyId(member.id);
    try {
      await workspacesAPI.removeMember(member.id);
      setMembers((current) => current.filter((row) => row.id !== member.id));
      success("Access removed", `${member.name || member.email} no longer sees this workspace.`);
    } catch (err) {
      toastError("Could not remove", err instanceof Error ? err.message : "");
    } finally {
      setBusyId(null);
    }
  };

  const revoke = async (invite: WorkspaceInvite) => {
    setBusyId(invite.id);
    try {
      await workspacesAPI.revokeInvite(invite.id);
      setInvites((current) => current.filter((row) => row.id !== invite.id));
      success("Invite withdrawn");
    } catch (err) {
      toastError("Could not withdraw", err instanceof Error ? err.message : "");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/settings"
          aria-label="Back to settings"
          className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-white"
        >
          <ArrowLeft size={17} />
        </Link>
        <h1 className="flex-1 text-center text-[16px] font-bold tracking-tight">People</h1>
        <span className="h-9 w-9" aria-hidden="true" />
      </div>

      <p className="mb-6 px-1 text-[12.5px] leading-relaxed text-ink-muted">
        Everyone here works inside <strong className="text-ink">{merchant?.display_name || "this workspace"}</strong>{" "}
        and sees the same collections. People who aren't on this list have no access.
      </p>

      {canInvite ? (
        <section className="mb-7 rounded-[18px] border border-line bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <UserPlus size={15} className="text-ink-soft" />
            <h2 className="text-[13.5px] font-semibold">Invite someone</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_170px_auto] sm:items-end">
            <Field label="Email" htmlFor="invite-email">
              <Input
                id="invite-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label="Access" htmlFor="invite-role">
              <Select
                id="invite-role"
                value={role}
                onChange={(event) => setRole(event.target.value as InvitableRole)}
              >
                <option value="collector">Collector</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </Select>
            </Field>
            <Button loading={sending} onClick={sendInvite} className="sm:mb-0.5">
              Send invite
            </Button>
          </div>
          <p className="mt-2 text-[11.5px] text-ink-muted">{ROLE_HINT[role]}</p>
          {freshLink ? (
            <div className="mt-3">
              <InlineNote tone="info" title="Invite link">
                <span className="block break-all font-mono text-[11px]">{freshLink}</span>
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(freshLink);
                      success("Link copied");
                    } catch {
                      toastError("Could not copy", "Select the link and copy it manually.");
                    }
                  }}
                >
                  <Copy size={12} /> Copy link
                </button>
              </InlineNote>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mb-7">
        <h2 className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          Members
        </h2>
        <div className="overflow-hidden rounded-[18px] border border-line bg-white shadow-sm">
          {loading && members.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12.5px] text-ink-muted">Loading…</p>
          ) : null}
          {members.map((member) => {
            const isMe = member.user_id === user?.id;
            const locked = member.role === "owner";
            const canEdit = isOwner && !locked;
            const canRemove = canInvite && !locked && !isMe;
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-b-0"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-cream text-[11.5px] font-bold text-ink-soft">
                  {member.image ? (
                    <img src={member.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(member.name, member.email)
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">
                    {member.name || member.email}
                    {isMe ? <span className="ml-1.5 text-[11px] text-ink-faint">(you)</span> : null}
                  </p>
                  <p className="truncate text-[11.5px] text-ink-muted">{member.email}</p>
                </div>
                {canEdit ? (
                  <Select
                    aria-label={`Role for ${member.email}`}
                    className="w-[124px] shrink-0"
                    value={member.role}
                    disabled={busyId === member.id}
                    onChange={(event) =>
                      changeRole(member, event.target.value as InvitableRole)
                    }
                  >
                    <option value="admin">Admin</option>
                    <option value="collector">Collector</option>
                    <option value="viewer">Viewer</option>
                  </Select>
                ) : (
                  <span className="shrink-0 rounded-full bg-cream px-2.5 py-1 text-[11.5px] font-semibold text-ink-soft">
                    {ROLE_LABEL[member.role]}
                  </span>
                )}
                {canRemove ? (
                  <button
                    type="button"
                    aria-label={`Remove ${member.email}`}
                    disabled={busyId === member.id}
                    onClick={() => remove(member)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-cream hover:text-danger disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {canInvite && invites.length > 0 ? (
        <section className="mb-7">
          <h2 className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            Pending invites
          </h2>
          <div className="overflow-hidden rounded-[18px] border border-line bg-white shadow-sm">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{invite.email}</p>
                  <p className="text-[11.5px] text-ink-muted">
                    {ROLE_LABEL[invite.role]} ·{" "}
                    {invite.status === "pending"
                      ? `expires ${new Date(invite.expires_at).toLocaleDateString()}`
                      : invite.status}
                  </p>
                </div>
                {invite.status === "pending" ? (
                  <button
                    type="button"
                    disabled={busyId === invite.id}
                    onClick={() => revoke(invite)}
                    className="shrink-0 text-[12px] font-semibold text-ink-muted transition-colors hover:text-danger disabled:opacity-50"
                  >
                    Withdraw
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <p className="flex items-start gap-2 px-1 text-[11.5px] leading-relaxed text-ink-muted">
        <Users size={13} className="mt-0.5 shrink-0" />
        Roles decide what people can do, never which money they see: everyone in
        this workspace sees the same collections and payments.
      </p>
    </div>
  );
}
