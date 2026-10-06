import React from 'react';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySession } from '../lib/session';
import LoginForm from '../components/LoginForm';
import AdminApp from '../components/AdminApp';

// Checked on the server for every visit: no valid login cookie means the visitor only ever
// receives the login screen — the dashboard is not even rendered for them.
export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const loggedIn = await verifySession(token);
  return loggedIn ? <AdminApp /> : <LoginForm />;
}
