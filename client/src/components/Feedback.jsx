import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Feedback.css'

function Feedback({ onBack }) { // onBack is a function prop to navigate back to home
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'suggestion',
    message: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { getAuthToken } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:3001/api/feedback', { //backend URL 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback') // Use error from response if available
      }

      setIsSubmitted(true)
    } catch (error) {
      console.error('Feedback submission error:', error)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="feedback-container">
        <div className="feedback-card success-card">
          <button className="back-btn" onClick={onBack}>
            ← Back to Home
          </button>

          <div className="success-icon">🎉</div>
          <h2>Thank You!</h2>
          <p>Your feedback has been received and saved to our database. We appreciate you helping us improve Artha!</p>
          
          <button 
            className="submit-btn"
            onClick={() => {
              setIsSubmitted(false)
              setFormData({ name: '', email: '', type: 'suggestion', message: '' })
            }}
          >
            Submit More Feedback
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="feedback-container">
      <div className="feedback-card">
        <button className="back-btn" onClick={onBack}>
          ← Back to Home
        </button>

        <div className="feedback-header">
          <h2>Share Your Feedback</h2>
          <p>Help us improve Artha. We'd love to hear your thoughts!</p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Your Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email (optional)"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="type">Feedback Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="suggestion">Suggestion</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="general">General Feedback</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="message">Your Feedback</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us what you think about Artha..."
              rows="6"
              required
            />
            <div className="char-count">{formData.message.length}/500</div>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading || !formData.message.trim()}
          >
            {isLoading ? (
              <>
                <div className="btn-spinner"></div>
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Feedback