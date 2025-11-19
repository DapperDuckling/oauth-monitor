// src/routes/oauth-monitor/user-status/+server.js
import { json } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { createHash } from 'node:crypto';
import { userState } from '$lib/server/state.js';

export const GET = () => {
  const payload = get(userState);
  const payloadString = JSON.stringify(payload);

  return json({
    checksum: createHash('md5').update(payloadString).digest('hex'),
    payload,
    timestamp: Date.now(),
  });
};
