/* PTI Development Limited (Head Office), 1005 Avenue 11, Dhaka, on an embedded Google Map (no API key needed).
   The place is looked up by its Google Maps name, centred on its exact coordinates. */
const PLACE = 'PTI Development Limited (Head Office), 1005 Avenue 11, Dhaka';
const OFFICE = [23.8372982, 90.3756281];
const EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(PLACE)}&ll=${OFFICE.join(',')}&z=17&hl=en&output=embed`;

export default function OfficeMap({ label = 'PTI Development office' }) {
    return (
        <div className="office-map-wrap">
            <iframe
                className="map office-map"
                src={EMBED}
                title={`Map showing ${label}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                data-reveal
            />
        </div>
    );
}
