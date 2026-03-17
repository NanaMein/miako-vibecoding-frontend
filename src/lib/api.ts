const BASE_URL = 'https://api.miako.app';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  let accessToken = localStorage.getItem('access_token');

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401 && accessToken) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/v2/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          accessToken = refreshData.access_token;
          localStorage.setItem('access_token', accessToken);
          
          // Retry original request
          headers.set('Authorization', `Bearer ${accessToken}`);
          response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
        } else {
          // Refresh failed, logout
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } catch (e) {
         localStorage.removeItem('access_token');
         localStorage.removeItem('refresh_token');
         window.location.href = '/login';
      }
    } else {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
  }

  return response;
}
