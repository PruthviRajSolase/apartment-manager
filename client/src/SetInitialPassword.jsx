import { useState } from 'react'
import api from './api'

function SetInitialPassword({ user, onPasswordSet, onLogout }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('Please use at least 8 characters.')
      return
    }
    if (newPassword !== confirm) {
      setError('The two passwords do not match.')
      return
    }

    setLoading(true)
    const { response, data } = await api('/api/auth/set-initial-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    })
    setLoading(false)

    if (!response || !response.ok) {
      setError(data.error || 'Could not set your password. Please try again.')
      return
    }

    onPasswordSet({ ...user, must_change_password: false })
  }

  return (
    <section className="card">
      <h2>Set your password</h2>
      <p>Welcome, {user.name}. Please choose a password before using the app.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="new-password">New password (at least 8 characters)</label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="confirm-password">Type it again</label>
          <input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save password'}
        </button>
      </form>
      <p><button type="button" onClick={onLogout}>Log out</button></p>
    </section>
  )
}

export default SetInitialPassword
