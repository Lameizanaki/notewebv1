import { Link } from '@inertiajs/react';

export default function EmptyState({ title, description, actionLabel, actionHref }) {
    return (
        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">{description}</p>
            {actionHref ? (
                <Link
                    href={actionHref}
                    className="mt-6 inline-flex rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                    {actionLabel}
                </Link>
            ) : null}
        </div>
    );
}
