import { useState, useEffect } from 'react'
import api from './api'

function applyResults(unitResult, residentResult, setUnits, setResidents, setError) {
  if (!unitResult.response || !unitResult.response.ok) {
    setError(unitResult.data.error || 'Could not load units.')
  } else {
    setUnits(unitResult.data)
  }
  if (!residentResult.response || !residentResult.response.ok) {
    setError(residentResult.data.error || 'Could not load residents.')
  } else {
    setResidents(residentResult.data)
  }
}

function ManageResidents() {
  const [units, setUnits] = useState([])
  const [residents, setResidents] = useState([])
  const [unitNumber, setUnitNumber] = useState('')
  const [name, setName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [unitId, setUnitId] = useState('')
  const [tempPassword, setTempPassword] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([api('/api/units'), api('/api/residents')]).then(([unitResult, residentResult]) => {
      if (active) applyResults(unitResult, residentResult, setUnits, setResidents, setError)
    })
    return () => { active = false }
  }, [])

  async function load() {
    const [unitResult, residentResult] = await Promise.all([
      api('/api/units'),
      api('/api/residents'),
    ])
    applyResults(unitResult, residentResult, setUnits, setResidents, setError)
  }

  async function handleAddUnit(e) {
    e.preventDefault()
    setError('')
    setNotice('')

    const value = unitNumber.trim()
    if (!value) {
      setError('Please enter a unit number.')
      return
    }

    setLoading(true)
    const { response, data } = await api('/api/units', {
      method: 'POST',
      body: JSON.stringify({ unitNumber: value }),
    })
    setLoading(false)

    if (!response || !response.ok) {
      setError(response?.status === 409
        ? 'That unit number already exists in your society.'
        : data.error || 'Could not add the unit.')
      return
    }

    setUnitNumber('')
    setNotice(`Unit ${value} added.`)
    load()
  }

  async function handleAddResident(e) {
    e.preventDefault()
    setError('')
    setNotice('')

    if (!name.trim()) {
      setError('Please enter the resident name.')
      return
    }
    if (!/^\d{10}$/.test(mobileNumber.trim())) {
      setError('Mobile number must be exactly 10 digits.')
      return
    }
    if (!unitId) {
      setError('Please choose a unit.')
      return
    }

    setLoading(true)
    const { response, data } = await api('/api/residents', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        unitId: Number(unitId),
      }),
    })
    setLoading(false)

    if (!response || !response.ok) {
      setError(response?.status === 409
        ? 'A resident with this mobile number already exists.'
        : data.error || 'Could not add the resident.')
      return
    }

    // Shown once, held only in memory. Never saved to localStorage or logged.
    setTempPassword(data.temporaryPassword)
    setName('')
    setMobileNumber('')
    setUnitId('')
    load()
  }

  return (
    <div>
      {tempPassword && (
        <section className="card temp-password">
          <h2>Save this password now</h2>
          <p>This is the only time it will be shown. Give it to the resident.</p>
          <p className="password-value">{tempPassword}</p>
          <p><button type="button" onClick={() => setTempPassword(null)}>I have saved it</button></p>
        </section>
      )}

      <section className="card">
        <h2>Add a unit</h2>
        <form onSubmit={handleAddUnit}>
          <div className="form-row">
            <label htmlFor="unit-number">Unit number</label>
            <input
              id="unit-number"
              type="text"
              placeholder="For example, A-101"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading}>Add unit</button>
        </form>
      </section>

      <section className="card">
        <h2>Add a resident</h2>
        <form onSubmit={handleAddResident}>
          <div className="form-row">
            <label htmlFor="resident-name">Name</label>
            <input
              id="resident-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="resident-mobile">Mobile number (10 digits)</label>
            <input
              id="resident-mobile"
              type="text"
              inputMode="numeric"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="resident-unit">Unit</label>
            <select id="resident-unit" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
              <option value="">Choose a unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.unit_number}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading}>Add resident</button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      <section className="card">
        <h2>Units</h2>
        <ul className="list">
          {units.map((unit) => <li key={unit.id}>{unit.unit_number}</li>)}
        </ul>
      </section>

      <section className="card">
        <h2>Residents</h2>
        <ul className="list">
          {residents.map((resident) => (
            <li key={resident.id}>
              {resident.name} — {resident.mobile_number} — {resident.unit_number || 'No unit'}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default ManageResidents
