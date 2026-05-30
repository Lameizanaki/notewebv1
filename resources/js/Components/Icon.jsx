const icons = {
    alignCenter: (
        <>
            <path d="M4 6h16" />
            <path d="M7 10h10" />
            <path d="M4 14h16" />
            <path d="M7 18h10" />
        </>
    ),
    alignLeft: (
        <>
            <path d="M4 6h16" />
            <path d="M4 10h10" />
            <path d="M4 14h16" />
            <path d="M4 18h10" />
        </>
    ),
    alignRight: (
        <>
            <path d="M4 6h16" />
            <path d="M10 10h10" />
            <path d="M4 14h16" />
            <path d="M10 18h10" />
        </>
    ),
    bold: <path d="M7 5h6.2a4 4 0 0 1 0 8H7zM7 13h7a3 3 0 0 1 0 6H7z" />,
    bulletList: (
        <>
            <path d="M9 6h11" />
            <path d="M9 12h11" />
            <path d="M9 18h11" />
            <path d="M4 6h.01" />
            <path d="M4 12h.01" />
            <path d="M4 18h.01" />
        </>
    ),
    chevronDown: <path d="m6 9 6 6 6-6" />,
    fileText: (
        <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M8 13h8" />
            <path d="M8 17h6" />
        </>
    ),
    home: (
        <>
            <path d="m3 11 9-8 9 8" />
            <path d="M5 10v10h14V10" />
            <path d="M10 20v-6h4v6" />
        </>
    ),
    italic: (
        <>
            <path d="M11 5h6" />
            <path d="M7 19h6" />
            <path d="m14 5-4 14" />
        </>
    ),
    logOut: (
        <>
            <path d="M10 17 15 12l-5-5" />
            <path d="M15 12H3" />
            <path d="M21 5v14" />
        </>
    ),
    menu: (
        <>
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
        </>
    ),
    mic: (
        <>
            <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <path d="M12 19v3" />
        </>
    ),
    numberList: (
        <>
            <path d="M10 6h10" />
            <path d="M10 12h10" />
            <path d="M10 18h10" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M4 14h2l-2 4h2" />
        </>
    ),
    pin: (
        <>
            <path d="m14 4 6 6" />
            <path d="m5 19 5.5-5.5" />
            <path d="m9 4 11 11-4 1-4 4-1-4L4 9z" />
        </>
    ),
    plus: (
        <>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
        </>
    ),
    save: <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />,
    search: (
        <>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </>
    ),
    sparkles: (
        <>
            <path d="M12 3 13.6 8.4 19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" />
            <path d="M19 16v4" />
            <path d="M17 18h4" />
            <path d="M4 4v3" />
            <path d="M2.5 5.5h3" />
        </>
    ),
    strikethrough: (
        <>
            <path d="M16 4H9a3 3 0 0 0-1.8 5.4L15.6 15A3 3 0 0 1 13.8 20H6" />
            <path d="M4 12h16" />
        </>
    ),
    tag: (
        <>
            <path d="M20.5 13.5 13.5 20a2 2 0 0 1-2.8 0L3 12.3V3h9.3l8.2 8.2a2 2 0 0 1 0 2.3Z" />
            <path d="M7.5 7.5h.01" />
        </>
    ),
    text: <path d="M4 7V5h16v2M9 19h6M12 5v14" />,
    trash: (
        <>
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6 18 20H6L5 6" />
            <path d="M10 11v5" />
            <path d="M14 11v5" />
        </>
    ),
    underline: (
        <>
            <path d="M7 5v6a5 5 0 0 0 10 0V5" />
            <path d="M5 21h14" />
        </>
    ),
    x: (
        <>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </>
    ),
};

export default function Icon({ name, className = 'h-4 w-4', strokeWidth = 2 }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
            viewBox="0 0 24 24"
        >
            {icons[name] ?? null}
        </svg>
    );
}
