import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, router, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformationForm({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name ?? '',
        avatar: null,
    });

    const submit = (e) => {
        e.preventDefault();

        patch(route('settings.update'), {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-white">Profile Information</h2>
                <p className="mt-1 text-sm text-slate-400">
                    Update your display name and avatar. Email changes are disabled for this project.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="h-20 w-20 rounded-xl object-cover" />
                    ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-800 text-lg font-semibold text-white">
                            {user.name?.slice(0, 2)?.toUpperCase()}
                        </div>
                    )}

                    <div className="w-full">
                        <InputLabel htmlFor="avatar" value="Avatar" />
                        <input
                            id="avatar"
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp"
                            onChange={(event) => setData('avatar', event.target.files?.[0] ?? null)}
                            className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-400 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                        />
                        <InputError className="mt-2" message={errors.avatar} />
                        {user.avatar_url ? (
                            <button
                                type="button"
                                onClick={() => router.delete(route('settings.avatar.destroy'), { preserveScroll: true })}
                                className="mt-3 text-sm text-rose-300 transition hover:text-rose-200"
                            >
                                Remove profile picture
                            </button>
                        ) : null}
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="name" value="Display Name" />
                    <TextInput
                        id="name"
                        className="mt-2 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />
                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-2 block w-full cursor-not-allowed opacity-70"
                        value={user.email ?? ''}
                        disabled
                        autoComplete="email"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                        Email cannot be changed from settings.
                    </p>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4">
                        <p className="text-sm text-amber-100">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="ml-2 underline transition hover:text-white"
                            >
                                Send verification link.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-emerald-300">
                                A new verification link has been sent to your email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save Profile</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-emerald-300">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
