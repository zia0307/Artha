import './header.css'
import { useAuth } from '../contexts/AuthContext'

function Header({ currentView, onNavigate, user, onLogout }) {
  const handleFeedbackClick = () => {
    onNavigate('feedback')
  }

  const handleAuthClick = () => {
    if (user) {
      onLogout()
    } else {
      onNavigate('login')
    }
  }

  return (
    <header className="header">
      <div className="logo" onClick={() => onNavigate('home')} style={{cursor: 'pointer'}}>
        Artha
      </div>
      <nav className="nav">
        {user ? (
          <>
            <span className="welcome-text">
              Welcome, {user.name} 
              {user.role === 'admin' && ' 👑'} {/*i am the queen*/}
            </span>
            
            {/* ONLY SHOW DASHBOARD TO ADMINS */}
            {user.role === 'admin' && (
              <button 
                className="nav-btn dashboard-btn"
                onClick={() => onNavigate('feedback-dashboard')}
              >
                🛠️ Feedback Dashboard
              </button>
            )}
            
            <button className="nav-btn login-btn" onClick={handleAuthClick}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button 
              className="nav-btn login-btn" 
              onClick={() => onNavigate('login')}
            >
              Login
            </button>
            <button 
              className="nav-btn register-btn" 
              onClick={() => onNavigate('register')}
            >
              Register
            </button>
          </>
        )}
        <button className="feedback-btn" onClick={handleFeedbackClick}>
          Got any feedback? Let us know!
        </button>
      </nav>
    </header>
  )
}

export default Header