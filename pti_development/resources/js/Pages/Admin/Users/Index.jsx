import { router, useForm, usePage } from '@inertiajs/react';
import { Fragment, useState } from 'react';
import AdminLayout, { ago, Icon, IconBtn, Switch, askDelete } from '../../../Layouts/AdminLayout';

/** User management: who can sign in to the admin, with which role; switch accounts off without deleting them. */
export default function UsersIndex({ users, roles, roleHelp }) {
    const { auth } = usePage().props;
    const [editing, setEditing] = useState(null); // null | 'new' | user
    const remove = (u) => askDelete({ title: `Delete “${u.name}”?`, text: 'The account is deleted permanently. They are signed out and can no longer sign in.' }).then((ok) => ok && router.delete(`/admin/users/${u.id}`, { preserveScroll: true }));
    const toggle = (u) => router.put(`/admin/users/${u.id}`, { name: u.name, email: u.email, role: u.role, is_active: !u.is_active, password: '' }, { preserveScroll: true });
    const counts = Object.fromEntries(Object.keys(roles).map((r) => [r, users.filter((u) => u.role === r).length]));

    return (
        <AdminLayout title="User management" actions={<button className="a-btn primary" onClick={() => setEditing('new')}><Icon name="plus" /> New user</button>}>

            <div className="a-kpis">
                <div className="a-kpi"><small>Total users</small><b>{users.length}</b></div>
                {Object.entries(roles).map(([k, l]) => <div key={k} className="a-kpi"><small>{l}s</small><b>{counts[k]}</b></div>)}
                <div className="a-kpi"><small>Switched off</small><b>{users.filter((u) => !u.is_active).length}</b></div>
            </div>

            <div className="a-card flush">
                <table className="a-table">
                    <thead><tr><th>User</th><th>Role</th><th>Last sign-in</th><th>Active</th><th style={{ width: 120 }}>Action</th></tr></thead>
                    <tbody>
                        {users.map((u) => {
                            const me = u.id === auth.user.id;
                            return (
                                <tr key={u.id}>
                                    <td>
                                        <div className="a-user-cell">
                                            <span className="a-avatar">{u.name[0]}</span>
                                            <span><b>{u.name}</b>{me && <span className="a-pill sys">You</span>}<div className="a-muted sm">{u.email}</div></span>
                                        </div>
                                    </td>
                                    <td><span className={`a-pill role-${u.role}`}>{roles[u.role] || u.role}</span></td>
                                    <td className="a-muted sm">{u.last_login_at ? <>{ago(u.last_login_at)}<div>{u.last_login_ip}</div></> : 'Never'}</td>
                                    <td><span className="a-switch-cell"><Switch on={u.is_active} disabled={me} label={me ? 'You cannot switch yourself off' : u.is_active ? 'Active (click to block)' : 'Blocked (click to allow)'} onClick={() => toggle(u)} /><small className="a-muted">{u.is_active ? 'Active' : 'Off'}</small></span></td>
                                    <td className="a-row-actions">
                                        <div className="a-ibtns">
                                            <IconBtn icon="edit" label="Edit" onClick={() => setEditing(u)} />
                                            <IconBtn icon="trash" tone="danger" label={me ? 'You cannot delete yourself' : 'Delete'} disabled={me} onClick={() => remove(u)} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="a-card" style={{ marginTop: 20 }}>
                <div className="a-card-head"><h2>What each role can do</h2></div>
                <dl className="a-dl">{Object.entries(roles).map(([k, l]) => <Fragment key={k}><dt>{l}</dt><dd>{roleHelp[k]}</dd></Fragment>)}</dl>
            </div>

            {editing && <UserModal user={editing === 'new' ? null : editing} roles={roles} roleHelp={roleHelp} me={editing !== 'new' && editing.id === auth.user.id} onClose={() => setEditing(null)} />}
        </AdminLayout>
    );
}

function UserModal({ user, roles, roleHelp, me, onClose }) {
    const form = useForm({ name: user?.name || '', email: user?.email || '', role: user?.role || 'editor', is_active: user ? user.is_active : true, password: '' });
    const [show, setShow] = useState(false);
    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: onClose };
        user ? form.put(`/admin/users/${user.id}`, opts) : form.post('/admin/users', opts);
    };
    const gen = () => {
        const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const arr = crypto.getRandomValues(new Uint32Array(14));
        const pw = Array.from(arr, (n) => chars[n % chars.length]).join('') + (arr[0] % 10);
        form.setData('password', pw);
        setShow(true);
    };
    const err = (k) => form.errors[k] && <small className="a-error">{form.errors[k]}</small>;

    return (
        <div className="a-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <form className="a-modal-box" onSubmit={submit}>
                <div className="a-modal-head"><h2>{user ? `Edit ${user.name}` : 'New user'}</h2><button type="button" className="a-icon-btn" onClick={onClose}><Icon name="x" /></button></div>
                <div className="a-form-grid">
                    <label className="a-field half"><span>Name</span><input autoFocus value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />{err('name')}</label>
                    <label className="a-field half"><span>Email (sign-in)</span><input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />{err('email')}</label>
                    <div className="a-field">
                        <span>Role</span>
                        {me ? <p className="a-muted sm" style={{ margin: 0 }}>You cannot change your own role.</p> : (
                            <div className="a-roles">
                                {Object.entries(roles).map(([k, l]) => (
                                    <label key={k} className={`a-role ${form.data.role === k ? 'is-active' : ''}`}>
                                        <input type="radio" name="role" checked={form.data.role === k} onChange={() => form.setData('role', k)} />
                                        <b>{l}</b><small>{roleHelp[k]}</small>
                                    </label>
                                ))}
                            </div>
                        )}
                        {err('role')}
                    </div>
                    <label className="a-field">
                        <span>{user ? 'New password (leave empty to keep)' : 'Password'}</span>
                        <div className="a-inline">
                            <input type={show ? 'text' : 'password'} value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} autoComplete="new-password" placeholder="At least 8 characters, letters and numbers" />
                            <button type="button" className="a-btn" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
                            <button type="button" className="a-btn" onClick={gen}>Generate</button>
                        </div>
                        {err('password')}
                        {show && form.data.password && <small className="a-muted">Copy this password now and send it to the user in a private message.</small>}
                    </label>
                    {!me && (
                        <div className="a-field inline"><span>Can sign in</span><Switch on={form.data.is_active} onClick={() => form.setData('is_active', !form.data.is_active)} label="Can sign in" /></div>
                    )}
                </div>
                <div className="a-form-foot"><button type="button" className="a-btn ghost" onClick={onClose}>Cancel</button><button className="a-btn primary" disabled={form.processing}>{user ? 'Save' : 'Create user'}</button></div>
            </form>
        </div>
    );
}
