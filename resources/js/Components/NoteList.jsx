import EmptyState from '@/Components/EmptyState';
import NoteCard from '@/Components/NoteCard';
import NoteRow from '@/Components/NoteRow';

export default function NoteList({
    notes,
    variant = 'row',
    emptyTitle = 'No notes yet',
    emptyDescription = 'Create your first note to get started.',
    routes = {},
    createHref = route('notes.create'),
    allowActions = true,
}) {
    if (!notes.length) {
        return (
            <EmptyState
                title={emptyTitle}
                description={emptyDescription}
                actionLabel="Create your first note"
                actionHref={createHref}
            />
        );
    }

    if (variant === 'card') {
        return (
            <div className="grid gap-4 md:grid-cols-2">
                {notes.map((note) => (
                    <NoteCard key={note.id} note={note} routes={routes} allowActions={allowActions} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {notes.map((note) => (
                <NoteRow key={note.id} note={note} routes={routes} allowActions={allowActions} />
            ))}
        </div>
    );
}
