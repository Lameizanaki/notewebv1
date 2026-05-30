export default function ApplicationLogo(props) {
    return (
        <div
            {...props}
            className={`flex items-center justify-center rounded-lg bg-emerald-400 font-bold text-slate-950 ${props.className ?? ''}`}
        >
            QN
        </div>
    );
}
