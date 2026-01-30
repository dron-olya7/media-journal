const API_BASE = '/api'

export default {
  async getAll() {
    const response = await fetch(`${API_BASE}/items`)
    return response.json()
  },
  
  async add(item) {
    const response = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    return response.json()
  },
  
  async update(id, item) {
    const response = await fetch(`${API_BASE}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    return response.json()
  },
  
  async delete(id) {
    const response = await fetch(`${API_BASE}/items/${id}`, {
      method: 'DELETE'
    })
    return response.json()
  },
  
  async getStats() {
    const response = await fetch(`${API_BASE}/stats`)
    return response.json()
  }
}