import DeleteUserForm from '@/Pages/Profile/Partials/DeleteUserForm';
import UpdatePasswordForm from '@/Pages/Profile/Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from '@/Pages/Profile/Partials/UpdateProfileInformationForm';
import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';

export default function Profile({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;
    const hasPassword = Boolean(user.has_password);

    return (
        <AppLayout title="Settings">
            <Head title="Settings" />

            <div className="space-y-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
                    <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} />
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
                    <UpdatePasswordForm hasPassword={hasPassword} />
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
                    <DeleteUserForm hasPassword={hasPassword} />
                </div>
            </div>
        </AppLayout>
    );
}
