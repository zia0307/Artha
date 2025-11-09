import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './App.css'
import Header from './components/header'
import Footer from './components/footer'  
import Translator from './components/translator' 
import LightRays from './components/LightRays'
import Login from './components/Login'
import Register from './components/Register'
import Feedback from './components/Feedback'
import FeedbackDashboard from './components/FeedbackDashboard' 

// This component uses the auth context
function AppContent() {
  const [currentView, setCurrentView] = useState('home')
  const { user, logout } = useAuth()

  // Only show LightRays on home page
  const showLightRays = currentView === 'home'

  return (
    <div className="app">
      {/* LightRays only on home page */}
      {showLightRays && (
        <div className="light-rays-background">
          <LightRays
            raysOrigin="top-center"
            raysColor="#00008B"
            raysSpeed={1.5}
            lightSpread={0.8}
            rayLength={1.2}
            followMouse={true}
            mouseInfluence={0.1}
            noiseAmount={0.1}
            distortion={0.05}
          />
        </div>
      )}
      
      <Header 
        currentView={currentView}
        onNavigate={setCurrentView}
        user={user}
        onLogout={logout}
      />
      
      <main className={`main-content ${showLightRays ? 'home-background' : 'default-background'}`}>
        {currentView === 'home' && (
          <div className="home-content">
            <h1 className="app-title">Artha</h1>
            <p className="app-subtitle">Your language compass</p>
            
            <button 
              onClick={() => setCurrentView('translator')}
              className="translator-main-btn"
            >
              Start Translating →
            </button>

            {user && (
              <div className="user-welcome">
                <p>Welcome back, {user.name}! 👋</p>
                <small>You're successfully logged in</small>
              </div>
            )}
          </div>
        )}
        
        {currentView === 'translator' && <Translator onBack={() => setCurrentView('home')} />}
        {currentView === 'login' && <Login onBack={() => setCurrentView('home')} onSwitchToRegister={() => setCurrentView('register')} />}
        {currentView === 'register' && <Register onBack={() => setCurrentView('home')} onSwitchToLogin={() => setCurrentView('login')} />}
        {currentView === 'feedback' && <Feedback onBack={() => setCurrentView('home')} />}
        {currentView === 'feedback-dashboard' && user && <FeedbackDashboard onBack={() => setCurrentView('home')} />}
      </main>
      
      <Footer />
    </div>
  )
}

// Main App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App