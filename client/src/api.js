const BASE_URL = 'http://localhost:5000'

// A failed login is not an expired session — let the form show its own error
// instead of wiping storage and reloading the page.
const AUTH_FORM_PATHS = new Set(['/api/auth/login', '/api/auth/signup'])

function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

async function api(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { ...options.headers }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  } catch {
    return {
      response: null,
      data: { error: 'Could not reach the server. Please check your connection.' },
    }
  }

  let data = {}
  try {
    data = await response.json()
  } catch {
    // The response had no JSON body — an empty object is fine here.
  }

  if (response.status === 401 && !AUTH_FORM_PATHS.has(path)) {
    clearSession()
    window.location.assign('/')
  }

  return { response, data }
}

export default api
export { clearSession }
