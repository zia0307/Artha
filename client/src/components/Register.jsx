import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

function Register({ onBack, onSwitchToLogin }) { // onBack: function to go back to home, onSwitchToLogin: function to switch to login form
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false) // Loading state for form submission
  const [error, setError] = useState('')
  const { register } = useAuth()

  const handleChange = (e) => { // Handle input changes
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => { // Handle form submission
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validation, checking if all fields are filled
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Check password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    // Call register function from AuthContext
    const result = await register(formData.name, formData.email, formData.password)
    
    // Handle registration result
    if (result.success) {
      onBack() // Go back to home after successful registration
    } else {
      setError(result.error)
    }
    
    setIsLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button className="back-btn" onClick={onBack}>
          ← Back to Home
        </button>

        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join Artha and start translating</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
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
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password (min. 6 characters)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="btn-spinner"></div>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button 
              className="switch-auth-btn"
              onClick={onSwitchToLogin}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register