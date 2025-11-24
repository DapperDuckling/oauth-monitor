// src/routes/oauth-monitor/logout/+server.js
import { redirect } from '@sveltejs/kit';
import { userState } from '$lib/server/state.js';

export const GET = () => {
  userState.setLoggedIn(false);
  throw redirect(302, '/');
};
