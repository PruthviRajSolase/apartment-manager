import { useState, useEffect } from 'react'
import api, { clearSession } from './api'
import Login from './Login'
import SetInitialPassword from './SetInitialPassword'
import ManageResidents from './ManageResidents'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [users, setUsers] = useState([])
  const [view, setView] = useState('home')
  const [refreshKey, setRefreshKey] = useState(0)
  const [error, setError] = useState('')

  function saveUser(nextUser) {
    localStorage.setItem('user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  function handleLogin(newToken, newUser) {
    localStorage.setItem('token', newToken)
    saveUser(newUser)
    setToken(newToken)
    setView('home')
    setError('')
  }

  async function handleLogout() {
    await api('/api/auth/logout', { method: 'POST' })
    clearSession()
    setToken(null)
    setUser(null)
    setUsers([])
    setView('home')
  }

  useEffect(() => {
    if (!token || user?.role !== 'admin') return
    let active = true

    api('/api/users').then(({ response, data }) => {
      if (!active) return
      if (!response) {
        setError('Could not reach the server.')
        return
      }
      if (response.status === 403 && data.code === 'PASSWORD_CHANGE_REQUIRED') {
        if (!user?.must_change_password) {
          saveUser({ ...user, must_change_password: true })
        }
        return
      }
      if (!response.ok) {
        setError(data.error || 'Could not load users.')
        return
      }
      setUsers(data)
    })

    return () => { active = false }
  }, [token, refreshKey, user])

  if (!token || !user) {
    return (
      <main className="app">
        <h1>Apartment Manager</h1>
        <Login onLogin={handleLogin} />
      </main>
    )
  }

  if (user.must_change_password) {
    return (
      <main className="app">
        <h1>Apartment Manager</h1>
        <SetInitialPassword
          user={user}
          onPasswordSet={(updated) => {
            saveUser(updated)
            setRefreshKey((key) => key + 1)
          }}
          onLogout={handleLogout}
        />
      </main>
    )
  }

  return (
    <main className="app">
      <header className="topbar">
        <h1>Apartment Manager</h1>
        <div>
          <span>{user.name} ({user.role})</span>{' '}
          <button type="button" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <nav className="nav">
        <button
          type="button"
          className={view === 'home' ? 'active' : ''}
          onClick={() => setView('home')}
        >
          Home
        </button>
        {user.role === 'admin' && (
          <button
            type="button"
            className={view === 'manage' ? 'active' : ''}
            onClick={() => setView('manage')}
          >
            Units &amp; residents
          </button>
        )}
      </nav>

      {view === 'manage' && user.role === 'admin' ? (
        <ManageResidents />
      ) : (
        <section className="card">
          <h2>Welcome, {user.name}</h2>
          <p>Use the buttons above to move around the app.</p>
          {user.role === 'admin' && (
            <>
              <h2>Users in your society</h2>
              <ul className="list">
                {users.map((item) => (
                  <li key={item.id}>{item.name} — {item.email} ({item.role})</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </main>
  )
}

export default App
