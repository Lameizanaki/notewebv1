export function workspaceNoteRoutes(workspaceId, canEdit = true) {
    return {
        edit: (noteId) => canEdit
            ? route('workspaces.notes.edit', [workspaceId, noteId])
            : route('workspaces.notes.show', [workspaceId, noteId]),
        destroy: (noteId) => route('workspaces.notes.destroy', [workspaceId, noteId]),
        pin: (noteId) => route('workspaces.notes.pin', [workspaceId, noteId]),
        ocrStore: route('workspaces.ocr-uploads.store', workspaceId),
        tags: {
            store: route('workspaces.tags.store', workspaceId),
            update: (tagId) => route('workspaces.tags.update', [workspaceId, tagId]),
            destroy: (tagId) => route('workspaces.tags.destroy', [workspaceId, tagId]),
        },
    };
}
