import { useState } from 'react'
import api from './api'

function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function friendlyError(response, data) {
    if (!response) return data.error
    if (response.status === 409) {
      return 'You are already logged in on another device. Please log out there, or wait up to 30 minutes and try again.'
    }
    if (response.status === 401) {
      return 'Those login details were not recognised. Check your number or email and password, then try again.'
    }
    return data.error || 'Could not log in. Please try again.'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const value = identifier.trim()
    const isEmail = value.includes('@')

    if (!isEmail && !/^\d{10}$/.test(value)) {
      setError('Enter a 10-digit mobile number, or an email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)
    const body = isEmail ? { email: value, password } : { mobileNumber: value, password }
    const { response, data } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    setLoading(false)

    if (!response || !response.ok) {
      setError(friendlyError(response, data))
      return
    }

    onLogin(data.token, data.user)
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Log in</h2>
      <div className="form-row">
        <label htmlFor="identifier">Mobile number or email</label>
        <input
          id="identifier"
          type="text"
          placeholder="10-digit mobile number, or email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  )
}

export default Login
