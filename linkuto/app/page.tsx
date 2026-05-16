import { redirect } from 'next/navigation';

export default function Home() {
  // Middleware handles the dev bypass redirect to /dashboard/organiser,
  // but if we hit this, just redirect to login
  redirect('/login');
}
