import Icon from '@/Components/Icon';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

function RoleSelect({ value, onChange }) {
    return (
        <div className="relative min-w-32">
            <select
                value={value}
                onChange={onChange}
                className="h-10 w-full appearance-none rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-3 pr-9 text-sm capitalize text-white focus:border-emerald-400 focus:outline-none focus:ring-0"
            >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
            </select>
            <Icon
                name="chevronDown"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
        </div>
    );
}

export default function Settings({ workspace, members, inviteLinks }) {
    const workspaceForm = useForm({
        name: workspace.name ?? '',
        description: workspace.description ?? '',
    });
    const memberForm = useForm({ email: '', role: 'viewer' });
    const [copiedRole, setCopiedRole] = useState(null);

    const copyInviteLink = async (inviteLink) => {
        await navigator.clipboard.writeText(inviteLink.url);
        setCopiedRole(inviteLink.role);
        window.setTimeout(() => setCopiedRole(null), 2000);
    };

    return (
        <AppLayout
            title={`${workspace.name} Settings`}
            actions={
                <Link href={route('workspaces.notes.index', workspace.id)} className="inline-flex h-10 items-center rounded-lg border border-slate-700 px-4 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white">
                    Back to Notes
                </Link>
            }
        >
            <Head title={`${workspace.name} Settings`} />

            <div className="space-y-6">
                <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
                    <h2 className="text-lg font-semibold text-white">Workspace Details</h2>
                    <p className="mt-2 text-sm text-slate-400">Your role: <span className="capitalize text-slate-200">{workspace.role}</span></p>

                    {workspace.is_owner ? (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                workspaceForm.patch(route('workspaces.update', workspace.id), { preserveScroll: true });
                            }}
                            className="mt-5 space-y-4"
                        >
                            <input
                                value={workspaceForm.data.name}
                                onChange={(event) => workspaceForm.setData('name', event.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                                required
                            />
                            <textarea
                                value={workspaceForm.data.description}
                                onChange={(event) => workspaceForm.setData('description', event.target.value)}
                                rows="3"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                            />
                            <button type="submit" className="inline-flex h-10 items-center rounded-lg bg-emerald-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">Save Workspace</button>
                        </form>
                    ) : null}
                </section>

                <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
                    <h2 className="text-lg font-semibold text-white">Members</h2>
                    <p className="mt-2 text-sm text-slate-400">Add members using their QuickNote account email or share a role-specific invitation link.</p>

                    {workspace.is_owner ? (
                        <>
                            <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                                <h3 className="text-sm font-semibold text-white">Invite by email</h3>
                                <p className="mt-1 text-xs text-slate-400">The email must already belong to a QuickNote account. Google and password accounts are both supported.</p>
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        memberForm.post(route('workspaces.members.store', workspace.id), {
                                            preserveScroll: true,
                                            onSuccess: () => memberForm.reset('email'),
                                        });
                                    }}
                                    className="mt-4 flex flex-col gap-3 md:flex-row md:items-center"
                                >
                                    <input
                                        type="email"
                                        value={memberForm.data.email}
                                        onChange={(event) => memberForm.setData('email', event.target.value)}
                                        placeholder="Member email"
                                        className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                                        required
                                    />
                                    <RoleSelect
                                        value={memberForm.data.role}
                                        onChange={(event) => memberForm.setData('role', event.target.value)}
                                    />
                                    <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">Add Member</button>
                                </form>
                                {memberForm.errors.email ? <p className="mt-2 text-sm text-rose-300">{memberForm.errors.email}</p> : null}
                            </div>

                            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                                <h3 className="text-sm font-semibold text-white">Invite by link</h3>
                                <p className="mt-1 text-xs text-slate-400">Anyone with a link can join after signing in. Regenerate a link to disable its previous version.</p>
                                <div className="mt-4 space-y-3">
                                    {inviteLinks.map((inviteLink) => (
                                        <div key={inviteLink.role} className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3 lg:flex-row lg:items-center">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{inviteLink.role} link</p>
                                                <p className="mt-1 truncate text-xs text-slate-300">{inviteLink.url}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => copyInviteLink(inviteLink)}
                                                    className="inline-flex h-9 items-center rounded-lg border border-slate-700 px-3 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                                                >
                                                    {copiedRole === inviteLink.role ? 'Copied' : 'Copy Link'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => router.post(route('workspaces.invite-links.regenerate', [workspace.id, inviteLink.role]), {}, { preserveScroll: true })}
                                                    className="inline-flex h-9 items-center rounded-lg border border-slate-700 px-3 text-xs text-slate-400 transition hover:border-slate-500 hover:text-white"
                                                >
                                                    Regenerate
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : null}

                    <div className="mt-5 space-y-3">
                        {members.map((member) => (
                            <div key={member.id} className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4 md:flex-row md:items-center">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-white">{member.name}</p>
                                    <p className="truncate text-xs text-slate-400">{member.email}</p>
                                </div>
                                {workspace.is_owner && !member.is_owner ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <RoleSelect
                                            value={member.role}
                                            onChange={(event) => router.patch(route('workspaces.members.update', [workspace.id, member.id]), { role: event.target.value }, { preserveScroll: true })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => router.delete(route('workspaces.members.destroy', [workspace.id, member.id]), { preserveScroll: true })}
                                            className="inline-flex h-10 items-center rounded-lg border border-rose-500/40 px-3 text-sm text-rose-200 transition hover:border-rose-400 hover:text-white"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-sm capitalize text-slate-400">{member.role}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {workspace.is_owner ? (
                    <section className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5 sm:p-6">
                        <h2 className="text-lg font-semibold text-white">Delete Workspace</h2>
                        <p className="mt-2 text-sm text-slate-400">This permanently removes the workspace and all shared notes.</p>
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm('Delete this workspace and all of its shared notes?')) {
                                    router.delete(route('workspaces.destroy', workspace.id));
                                }
                            }}
                            className="mt-4 inline-flex h-10 items-center rounded-lg border border-rose-500/40 px-4 text-sm text-rose-200 transition hover:border-rose-400 hover:text-white"
                        >
                            Delete Workspace
                        </button>
                    </section>
                ) : null}
            </div>
        </AppLayout>
    );
}
