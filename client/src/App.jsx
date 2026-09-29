import { useState, useEffect } from 'react'
import Login from './Login'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [users, setUsers] = useState([])

  function handleLogin(newToken, newUser) {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  async function handleLogout() {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (err) {
      console.error('Logout request failed:', err)
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setUsers([])
  }

  useEffect(() => {
    if (!token) return

    fetch('http://localhost:5000/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
          return null
        }
        return response.json()
      })
      .then((data) => {
        if (data) setUsers(data)
      })
      .catch((error) => console.error('Error fetching users:', error))
  }, [token])

  if (!token) {
    return (
      <div>
        <h1>Apartment Manager</h1>
        <Login onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <div>
      <h1>Apartment Manager</h1>
      <p>Logged in as {user?.name} ({user?.role})</p>
      <button onClick={handleLogout}>Log out</button>
      <h2>Users in your society</h2>
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.name} — {u.email} ({u.role})
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
