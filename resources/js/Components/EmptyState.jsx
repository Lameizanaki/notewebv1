import { Link } from '@inertiajs/react';
import Icon from '@/Components/Icon';

export default function EmptyState({ title, description, actionLabel, actionHref }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/70 text-emerald-300">
                <Icon name="fileText" className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">{description}</p>
            {actionHref ? (
                <Link
                    href={actionHref}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                    <Icon name="plus" className="h-4 w-4" />
                    {actionLabel}
                </Link>
            ) : null}
        </div>
    );
}
