// src/routes/oauth-monitor/login/+server.js
import { userState } from '$lib/server/state.js';

export const GET = () => {
  userState.setLoggedIn(true);

  return new Response('<script>window.close();</script>', {
    headers: { 'Content-Type': 'text/html' },
  });
};
