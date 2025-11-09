import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './translator.css'

function Translator({ onBack }) {
  const [text, setText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLang, setTargetLang] = useState('es')
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState('')
  const [translationHistory, setTranslationHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  
  const { user, getAuthToken } = useAuth()

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
  ]

  // Load translation history when component mounts and user is logged in
  useEffect(() => {
    if (user) {
      loadTranslationHistory()
    }
  }, [user])

  //useEffect for the swap functionality
  useEffect(() => {
    const handleSwapRequest = () => {
      // Swap languages
      setSourceLang(targetLang);
      setTargetLang(sourceLang);
      // Swap text
      setText(translatedText);
      setTranslatedText(text);
    };

    window.addEventListener('languageSwapRequested', handleSwapRequest);
    
    return () => {
      window.removeEventListener('languageSwapRequested', handleSwapRequest);
    };
  }, [sourceLang, targetLang, text, translatedText]);

  const loadTranslationHistory = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch('http://localhost:3001/api/translations/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTranslationHistory(data.history || [])
      }
    } catch (error) {
      console.error('Failed to load translation history:', error)
    }
  }

  const saveTranslationToHistory = async (original, translated, source, target) => {
    try {
      const token = getAuthToken()
      const response = await fetch('http://localhost:3001/api/translations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          originalText: original,
          translatedText: translated,
          sourceLang: source,
          targetLang: target
        })
      })

      if (response.ok) {
        console.log('Translation saved to history')
        // Reload history to include the new translation
        loadTranslationHistory()
      }
    } catch (error) {
      console.error('Failed to save translation:', error)
    }
  }

  const translateText = async () => {
    if (!text.trim()) {
      setError('Please enter some text to translate')
      return
    }

    setIsTranslating(true)
    setError('')

    try {
      const response = await fetch('http://localhost:3001/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          sourceLang,
          targetLang,
          saveToHistory: !!user,
          authToken: user ? getAuthToken() : null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Translation failed')
      }

      setTranslatedText(data.translatedText)
      setError('')

      // Save to user's history IF LOGGED IN
      if (user) {
        saveTranslationToHistory(text.trim(), data.translatedText, sourceLang, targetLang)
      }
      
    } catch (error) {
      console.error('Translation error:', error)
      setError(error.message || 'Failed to translate. Please check your connection and try again.')
    } finally {
      setIsTranslating(false)
    }
  }

  const loadHistoryItem = (item) => {
    setText(item.originalText)
    setTranslatedText(item.translatedText)
    setSourceLang(item.sourceLang)
    setTargetLang(item.targetLang)
    setShowHistory(false)
  }

  const clearHistory = async () => {
    setTranslationHistory([])
  }

  const getLanguageName = (code) => {
    return languages.find(lang => lang.code === code)?.name || code
  }

  return (
    <div className="translator-container">
      <div className="translator-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Home
        </button>
        <h2>Artha Translator</h2>
        <p>Get set, Translate {user && '• Your translations are being saved!'}</p>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* History Toggle Button */}
      {user && translationHistory.length > 0 && (
        <div className="history-toggle">
          <button 
            className="history-btn"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? '← Back to Translator' : '📚 View Translation History'}
          </button>
        </div>
      )}

      {showHistory ? (
        /* HISTORY VIEW */
        <div className="history-view">
          <h3>Your Translation History</h3>
          <div className="history-stats">
            <span>{translationHistory.length} translations saved</span>
            {translationHistory.length > 0 && (
              <button className="clear-history-btn" onClick={clearHistory}>
                Clear History
              </button>
            )}
          </div>
          
          <div className="history-list">
            {translationHistory.map((item, index) => (
              <div 
                key={index} 
                className="history-item"
                onClick={() => loadHistoryItem(item)}
              >
                <div className="history-languages">
                  <span className="lang-badge">{getLanguageName(item.sourceLang)}</span>
                  <span>→</span>
                  <span className="lang-badge">{getLanguageName(item.targetLang)}</span>
                </div>
                <div className="history-text">
                  <div className="original-text">{item.originalText}</div>
                  <div className="translated-text">{item.translatedText}</div>
                </div>
                <div className="history-date">
                  {new Date(item.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* TRANSLATOR VIEW */
        <>
          <div className="translator-main">
            {/* Input Section */}
            <div className="translation-section">
              <div className="language-header">
                <div className="language-selector">
                  <label>From:</label>
                  <select 
                    value={sourceLang} 
                    onChange={(e) => setSourceLang(e.target.value)}
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-area-container">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text to translate..."
                  rows="6"
                  className="text-input"
                />
                <div className="text-actions">
                  <button 
                    className="action-btn speak-btn"
                    onClick={() => speakText(text, sourceLang)}
                    disabled={!text.trim()}
                    title="Speak text"
                  >
                    🔊
                  </button>
                  <button 
                    className="action-btn copy-btn"
                    onClick={() => copyToClipboard(text)}
                    disabled={!text.trim()}
                    title="Copy text"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="swap-container">
              <button className="swap-btn" onClick={swapLanguages} title="Swap languages">
                ⇄
              </button>
            </div>

            {/* Output Section */}
            <div className="translation-section">
              <div className="language-header">
                <div className="language-selector">
                  <label>To:</label>
                  <select 
                    value={targetLang} 
                    onChange={(e) => setTargetLang(e.target.value)}
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-area-container">
                <div className="text-output">
                  {isTranslating ? (
                    <div className="loading">
                      <div className="spinner"></div>
                      <span>Translating...</span>
                    </div>
                  ) : (
                    translatedText || 'Translation will appear here...'
                  )}
                </div>
                <div className="text-actions">
                  <button 
                    className="action-btn speak-btn"
                    onClick={() => speakText(translatedText, targetLang)}
                    disabled={!translatedText.trim() || isTranslating}
                    title="Speak translation"
                  >
                    🔊
                  </button>
                  <button 
                    className="action-btn copy-btn"
                    onClick={() => copyToClipboard(translatedText)}
                    disabled={!translatedText.trim() || isTranslating}
                    title="Copy translation"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Translate Button */}
          <div className="translate-actions">
            <button 
              className="translate-btn"
              onClick={translateText}
              disabled={isTranslating || !text.trim()}
            >
              {isTranslating ? (
                <>
                  <div className="btn-spinner"></div>
                  Translating...
                </>
              ) : (
                'Translate Text'
              )}
            </button>
          </div>

          {/* Quick hint about history */}
          {!user && (
            <div className="history-hint">
              <p>💡 <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>Login</a> to save your translation history!</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Helper functions
const speakText = (textToSpeak, language) => {
  if (!textToSpeak?.trim()) return;
  
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language;
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  }
}

const swapLanguages = () => {
  const swapEvent = new CustomEvent('languageSwapRequested');
  window.dispatchEvent(swapEvent);
}

const copyToClipboard = (text) => {
  if (!text?.trim()) return;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

export default Translator