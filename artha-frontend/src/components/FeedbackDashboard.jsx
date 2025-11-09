import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './FeedbackDashboard.css'

function FeedbackDashboard({ onBack }) {
  const [feedback, setFeedback] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const { getAuthToken, user } = useAuth()

  useEffect(() => {
    fetchFeedback()
    fetchStats()
  }, [])

  const fetchFeedback = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch('http://localhost:3001/api/feedback', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch feedback')
      }

      const data = await response.json()
      setFeedback(data.feedback)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch('http://localhost:3001/api/feedback/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading feedback...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <button className="back-btn" onClick={onBack}>
          ← Back to Home
        </button>

        <div className="dashboard-header">
          <h2>🛠️ Admin Feedback Dashboard</h2>
          <p>User feedback for betterment of our pretty website</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Stats Section */}
        {stats && (
          <div className="stats-section">
            <div className="stat-card">
              <h3>Total Feedback</h3>
              <div className="stat-number">{stats.total}</div>
            </div>
            <div className="stat-card">
              <h3>By Type</h3>
              <div className="stat-list">
                {stats.byType.map(item => (
                  <div key={item._id} className="stat-item">
                    <span className="stat-label">{item._id}:</span>
                    <span className="stat-value">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
              </div>
        )}

        <div className="feedback-list">
          <h3>All Feedback ({feedback.length})</h3>
          
          {feedback.length === 0 ? (
            <div className="empty-state">
              <p>No feedback submitted yet.</p>
            </div>
          ) : (
            <div className="feedback-items">
              {feedback.map(item => (
                <div key={item._id} className="feedback-item">
                  <div className="feedback-header">
                    <div className="feedback-meta">
                      <strong>{item.name || 'Anonymous'}</strong>
                      {item.email && <span> • {item.email}</span>}
                      <span> • {new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="feedback-message">
                    {item.message}
                  </div>
                  </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FeedbackDashboard