/**
 * Module-level access token store.
 *
 * Access tokens are kept in memory (never in localStorage / sessionStorage)
 * so they cannot be read by XSS scripts. They are lost on hard-refresh, which
 * triggers a silent re-issue via the httpOnly refresh-token cookie.
 */

let _accessToken = null;

export const getAccessToken = () => _accessToken;
export const setAccessToken = (token) => { _accessToken = token; };
export const clearAccessToken = () => { _accessToken = null; };
