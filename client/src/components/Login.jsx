import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

function Login({ onBack, onSwitchToRegister }) { // onBack: function to go back to home, 
// onSwitchToRegister: function to switch to register view
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      onBack() // Go back to home after successful login
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
          <h2>Welcome Back</h2>
          <p>Sign in to your Artha account</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
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
              placeholder="Enter your password"
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
                <div className="btn-spinner"></div> {/* YAY SPINNY BUTTON */}
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Switch to Register */}
        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button 
              className="switch-auth-btn"
              onClick={onSwitchToRegister}
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login