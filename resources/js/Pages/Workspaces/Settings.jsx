import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

export default function Settings({ workspace, members }) {
    const workspaceForm = useForm({
        name: workspace.name ?? '',
        description: workspace.description ?? '',
    });
    const memberForm = useForm({ email: '', role: 'viewer' });

    return (
        <AppLayout
            title={`${workspace.name} Settings`}
            actions={
                <Link href={route('workspaces.notes.index', workspace.id)} className="rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-300">
                    Back to Notes
                </Link>
            }
        >
            <Head title={`${workspace.name} Settings`} />

            <div className="space-y-6">
                <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
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
                            <button type="submit" className="rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950">Save Workspace</button>
                        </form>
                    ) : null}
                </section>

                <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
                    <h2 className="text-lg font-semibold text-white">Members</h2>
                    <p className="mt-2 text-sm text-slate-400">Invite existing QuickNote users and assign view or edit access.</p>

                    {workspace.is_owner ? (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                memberForm.post(route('workspaces.members.store', workspace.id), {
                                    preserveScroll: true,
                                    onSuccess: () => memberForm.reset('email'),
                                });
                            }}
                            className="mt-5 flex flex-col gap-3 md:flex-row"
                        >
                            <input
                                type="email"
                                value={memberForm.data.email}
                                onChange={(event) => memberForm.setData('email', event.target.value)}
                                placeholder="Member email"
                                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                                required
                            />
                            <select
                                value={memberForm.data.role}
                                onChange={(event) => memberForm.setData('role', event.target.value)}
                                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                            </select>
                            <button type="submit" className="rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950">Add Member</button>
                        </form>
                    ) : null}
                    {memberForm.errors.email ? <p className="mt-2 text-sm text-rose-300">{memberForm.errors.email}</p> : null}

                    <div className="mt-5 space-y-3">
                        {members.map((member) => (
                            <div key={member.id} className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4 md:flex-row md:items-center">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-white">{member.name}</p>
                                    <p className="truncate text-xs text-slate-400">{member.email}</p>
                                </div>
                                {workspace.is_owner && !member.is_owner ? (
                                    <div className="flex gap-2">
                                        <select
                                            value={member.role}
                                            onChange={(event) => router.patch(route('workspaces.members.update', [workspace.id, member.id]), { role: event.target.value }, { preserveScroll: true })}
                                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm capitalize text-white"
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => router.delete(route('workspaces.members.destroy', [workspace.id, member.id]), { preserveScroll: true })}
                                            className="rounded-lg border border-rose-500/40 px-3 py-2 text-sm text-rose-200"
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
                    <section className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6">
                        <h2 className="text-lg font-semibold text-white">Delete Workspace</h2>
                        <p className="mt-2 text-sm text-slate-400">This permanently removes the workspace and all shared notes.</p>
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm('Delete this workspace and all of its shared notes?')) {
                                    router.delete(route('workspaces.destroy', workspace.id));
                                }
                            }}
                            className="mt-4 rounded-lg border border-rose-500/40 px-4 py-3 text-sm text-rose-200"
                        >
                            Delete Workspace
                        </button>
                    </section>
                ) : null}
            </div>
        </AppLayout>
    );
}
