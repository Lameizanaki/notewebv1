import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ hasPassword = true, className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();
    const confirmationInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
        delete_confirmation: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('settings.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => {
                if (hasPassword) {
                    passwordInput.current?.focus();
                } else {
                    confirmationInput.current?.focus();
                }
            },
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-white">Delete Account</h2>
                <p className="mt-1 text-sm text-slate-400">
                    Once your account is deleted, all notes, tags, uploads, and related resources will be permanently removed.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>Delete Account</DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-white">Are you sure you want to delete your account?</h2>

                    <p className="mt-2 text-sm text-slate-400">
                        {hasPassword
                            ? 'Please enter your password to confirm permanent account deletion.'
                            : 'This account does not have a password yet. Type DELETE to confirm permanent account deletion.'}
                    </p>

                    {hasPassword ? (
                        <div className="mt-6">
                            <InputLabel htmlFor="password" value="Password" className="sr-only" />

                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                autoComplete="current-password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="mt-1 block w-full"
                                isFocused
                                placeholder="Password"
                            />

                            <InputError message={errors.password} className="mt-2" />
                        </div>
                    ) : (
                        <div className="mt-6">
                            <InputLabel htmlFor="delete_confirmation" value="Type DELETE to confirm" className="sr-only" />

                            <TextInput
                                id="delete_confirmation"
                                name="delete_confirmation"
                                ref={confirmationInput}
                                value={data.delete_confirmation}
                                onChange={(e) => setData('delete_confirmation', e.target.value)}
                                className="mt-1 block w-full"
                                isFocused
                                placeholder="Type DELETE"
                            />

                            <InputError message={errors.delete_confirmation} className="mt-2" />
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                        <DangerButton disabled={processing}>Delete Account</DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
