# PTI Development — Website

Laravel 12 + React 19 (Inertia.js) + MySQL (XAMPP).

## Run locally

1. Start **MySQL** in the XAMPP Control Panel (this machine uses port **3307**; database `pti_development`).
2. In this folder:

```bash
composer install
npm install
php artisan migrate --seed      # first time only: creates tables + original site content
php artisan storage:link        # first time only: makes uploaded images public
npm run build                   # or `npm run dev` while editing React/CSS
php artisan serve
```

Website: http://127.0.0.1:8000 · Admin: http://127.0.0.1:8000/admin

Admin login comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (used by the seeder).
Change the password after first login under **Admin → Settings**.

## Where things are

| | |
|---|---|
| Public pages | `resources/js/Pages/*.jsx` |
| Rising Tower component | `resources/js/lib/tower.js` |
| Scroll animations | `resources/js/lib/motion.js` |
| Site styles / admin styles | `resources/css/site.css`, `resources/css/admin.css` |
| Admin content types (fields, validation) | `app/Admin/Resources.php` |
| Controllers | `app/Http/Controllers` |
| Database schema / seed content | `database/migrations`, `database/seeders` |

To add a field to a content type, add a column in a migration and a line in `app/Admin/Resources.php`;
the admin form, validation and image handling follow automatically.

## Contact form email

Inquiries are always saved and shown in **Admin → Inquiries**. To also receive them by email,
set the `MAIL_*` values in `.env` (default `MAIL_MAILER=log` writes them to `storage/logs/laravel.log`).

## Tests

```bash
php artisan test
```
