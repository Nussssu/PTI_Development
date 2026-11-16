import { Link, router } from '@inertiajs/react';
import { useRef } from 'react';
import AdminLayout, { IconBtn, askDelete } from '../../../Layouts/AdminLayout';
import LeadDetail from '../../../Components/Admin/LeadDetail';

/** One lead on its own page (the same view opens as a pop-up from the leads list). */
export default function InquiryShow({ inquiry: i, statuses, replyTemplate, mailLive }) {
    const remove = () => askDelete({ title: `Delete the lead from “${i.first_name}”?`, text: 'The lead, its message and its replies are deleted permanently.' }).then((ok) => ok && router.delete(`/admin/inquiries/${i.id}`));
    const replyBox = useRef(null);

    return (
        <AdminLayout title={`${i.first_name} ${i.last_name || ''}`} actions={
            <div className="a-ibtns">
                <IconBtn icon="reply" label="Reply" onClick={() => replyBox.current?.scrollIntoView({ behavior: 'smooth' })} disabled={!i.email} />
                <IconBtn icon="edit" label="Edit" href={`/admin/inquiries/${i.id}/edit`} />
                <IconBtn icon="trash" tone="danger" label="Delete" onClick={remove} />
            </div>
        }>
            <div className="a-leads">
                <Link href="/admin/inquiries" className="a-back">← All leads</Link>
                <LeadDetail inquiry={i} statuses={statuses} replyTemplate={replyTemplate} mailLive={mailLive} replyRef={replyBox} />
            </div>
        </AdminLayout>
    );
}
