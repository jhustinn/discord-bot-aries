# ARIES Verification Admin Dashboard

Admin dashboard untuk mengelola verifikasi Modern Warships.

## Features

- 📊 Dashboard statistik verifikasi
- 📋 Manage tickets (approve/reject)
- 🔍 Filter tickets by status
- 🖼️ View screenshot & OCR data
- 🗑️ Delete tickets

## Tech Stack

- React + TypeScript
- Tailwind CSS
- Supabase
- Vercel (deployment)

## Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_key
```
4. Run: `npm run dev`

## Deployment ke Vercel

1. Push ke GitHub
2. Import di [vercel.com](https://vercel.com)
3. Tambah environment variables
4. Deploy

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_KEY` | Supabase anon key |

## Pages

| Path | Description |
|------|-------------|
| `/` | Dashboard overview |
| `/tickets` | Manage verification tickets |

## License

MIT
