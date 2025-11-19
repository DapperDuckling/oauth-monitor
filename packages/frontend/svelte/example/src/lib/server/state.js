// src/lib/server/state.js
import { writable } from 'svelte/store';

// In-memory store for demo purposes
const createUserState = () => {
  const { subscribe, update } = writable({
    loggedIn: true,
    accessExpires: 0,
    refreshExpires: 0,
  });

  const updateTokens = () => {
    update(state => {
      if (state.loggedIn) {
        state.accessExpires = Math.floor(Date.now() / 1000) + 60 * 3; // 3 minutes
        state.refreshExpires = Math.floor(Date.now() / 1000) + 60 * 5; // 5 minutes
      }
      return state;
    });
  };

  const setLoggedIn = (status) => {
    update(state => {
      state.loggedIn = status;
      if (!status) {
        state.accessExpires = 0;
        state.refreshExpires = 0;
      }
      return state;
    });
    if (status) {
      updateTokens();
    }
  };
  
  // Initial state and periodic refresh
  setLoggedIn(true);
  setInterval(updateTokens, 5000);

  return {
    subscribe,
    setLoggedIn,
  };
};

export const userState = createUserState();
