import { Head, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Login() {
    const form = useForm({ email: '', password: '', remember: true });
    useEffect(() => { document.documentElement.classList.remove('has-motion'); }, []);

    const submit = (e) => {
        e.preventDefault();
        form.post('/admin/login', { onFinish: () => form.reset('password') });
    };

    return (
        <div className="a-login">
            <Head title="Sign in · Admin" />
            <div className="a-login-art">
                <img src="/images/hero-night.webp" alt="" />
                <div>
                    <img src="/images/pti-logo-horizontal-white.svg" alt="PTI Development" style={{ height: 44 }} />
                    <p>Shaping Dreams into Homes.</p>
                </div>
            </div>
            <form className="a-login-form" onSubmit={submit}>
                <h1>Welcome back</h1>
                <p className="a-muted">Sign in to manage the PTI Development website.</p>
                <label className="a-field">
                    <span>Email</span>
                    <input type="email" autoComplete="username" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} autoFocus required />
                    {form.errors.email && <small className="a-error">{form.errors.email}</small>}
                </label>
                <label className="a-field">
                    <span>Password</span>
                    <input type="password" autoComplete="current-password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} required />
                    {form.errors.password && <small className="a-error">{form.errors.password}</small>}
                </label>
                <label className="a-check"><input type="checkbox" checked={form.data.remember} onChange={(e) => form.setData('remember', e.target.checked)} /> Keep me signed in</label>
                <button className="a-btn primary lg" disabled={form.processing}>{form.processing ? 'Signing in…' : 'Sign in'}</button>
                <a className="a-muted" href="/" style={{ fontSize: 14 }}>← Back to website</a>
            </form>
        </div>
    );
}
