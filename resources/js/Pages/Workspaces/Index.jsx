import Icon from '@/Components/Icon';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Index({ workspaces }) {
    const form = useForm({ name: '', description: '' });

    return (
        <AppLayout title="Shared Workspaces">
            <Head title="Shared Workspaces" />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),22rem]">
                <section className="space-y-4">
                    {workspaces.length ? (
                        workspaces.map((workspace) => (
                            <Link
                                key={workspace.id}
                                href={route('workspaces.notes.index', workspace.id)}
                                className="block rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-slate-700"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">{workspace.name}</h2>
                                        <p className="mt-2 text-sm text-slate-400">{workspace.description || 'Shared notes for your team.'}</p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs capitalize text-slate-300">{workspace.role}</span>
                                </div>
                                <p className="mt-4 text-xs text-slate-500">{workspace.notes_count ?? 0} shared notes</p>
                            </Link>
                        ))
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
                            <h2 className="text-xl font-semibold text-white">No shared workspaces yet</h2>
                            <p className="mt-3 text-sm text-slate-400">Create one to start sharing notes with other QuickNote users.</p>
                        </div>
                    )}
                </section>

                <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
                    <h2 className="text-lg font-semibold text-white">Create Workspace</h2>
                    <p className="mt-2 text-sm text-slate-400">Members can be added after the workspace is created.</p>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(route('workspaces.store'));
                        }}
                        className="mt-5 space-y-4"
                    >
                        <div>
                            <label className="text-sm text-slate-300">Name</label>
                            <input
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                                required
                            />
                            {form.errors.name ? <p className="mt-2 text-sm text-rose-300">{form.errors.name}</p> : null}
                        </div>
                        <div>
                            <label className="text-sm text-slate-300">Description</label>
                            <textarea
                                value={form.data.description}
                                onChange={(event) => form.setData('description', event.target.value)}
                                rows="3"
                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
                        >
                            <Icon name="plus" className="h-4 w-4" />
                            Create Workspace
                        </button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
