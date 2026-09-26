import { useState, useEffect } from 'react'

function App() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetch('http://localhost:5000/api/users')
      .then((response) => response.json())
      .then((data) => setUsers(data))
      .catch((error) => console.error('Error fetching users:', error))
  }, [])

  return (
    <div>
      <h1>Apartment Manager</h1>
      <h2>Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} — {user.email} ({user.role})
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App