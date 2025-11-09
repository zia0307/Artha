//THIS IS THE 'EN' PART OF MERN. JS backend with authentication, user profiles, translation history, and feedback management.
// Using Express, MongoDB, JWT, and Google Translate (unofficial API).

import express from 'express';
import cors from 'cors'; // Enable CORS for all routes. Cross-Origin Resource Sharing is a security feature in web browsers
//that controls how a web page from one domain can access resources from a different domain
// Enabling CORS allows your frontend application (running on a different domain or port) to communicate with this backend API.
import dotenv from 'dotenv'; // Load environment variables from .env file
import mongoose from 'mongoose'; // MongoDB object modeling
import bcrypt from 'bcryptjs'; // Password hashing library 
import jwt from 'jsonwebtoken'; // JSON Web Token library for authentication

dotenv.config(); // Load .env variables 

const app = express(); // Create Express app
const port = process.env.PORT || 3001; // Server port

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/artha'; // Default to local MongoDB if not specified

mongoose.connect(MONGODB_URI) // Connect to MongoDB
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));


// User Schema
// Define user schema and model
// This schema includes fields for name, email, hashed password, preferences, and translation history.
// Passwords are hashed before saving for security.
// The schema also includes methods for comparing passwords during login.
// Preferences include default source/target languages and theme.
// Translation history stores past translations made by the user.
// This structure allows for user authentication, profile management, and tracking of translation activity.

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  password: {
    type: String,
    required: true,
    minlength: 6
  },
  preferences: {
    defaultSourceLang: { type: String, default: 'en' },
    defaultTargetLang: { type: String, default: 'es' },
    theme: { type: String, default: 'dark' }
  },
  translationHistory: [{
    originalText: String,
    translatedText: String,
    sourceLang: String,
    targetLang: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to hash password before saving user document
// This ensures that plain text passwords are never stored in the database, enhancing security.
// The hashing is done using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
// This method is used during login to verify that the provided password matches the stored hashed password.
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create User model
const User = mongoose.model('User', userSchema);

// Made myself admin - MOVED THIS AFTER USER MODEL DEFINITION
User.findOneAndUpdate(
  { email: 'zia.kadijah007@gmail.com' }, //replace this with your own email id <3 
  { role: 'admin' },
  { new: true }
).then(user => {
  if (user) {
    console.log(`✅ ${user.email} is now an admin`);
  }
});

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'artha-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Enable CORS and parse JSON request bodies
app.use(cors());
app.use(express.json());

// Language code mapping
const languageMap = {
  'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
  'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
  'ko': 'Korean', 'zh': 'Chinese', 'hi': 'Hindi', 'ar': 'Arabic',
  'tr': 'Turkish', 'nl': 'Dutch', 'pl': 'Polish', 'sv': 'Swedish',
  'da': 'Danish', 'fi': 'Finnish', 'no': 'Norwegian', 'uk': 'Ukrainian',
  'vi': 'Vietnamese', 'th': 'Thai', 'id': 'Indonesian', 'ms': 'Malay'
};

// Root route
// Basic info about the API and its status
// Useful for quick checks to see if the server is running and connected to the database
// Also provides a list of available endpoints for reference
// Helps developers understand the API capabilities at a glance
// Included this because I couldn't go 2 minutes without an error
app.get('/', (req, res) => {
  res.json({ 
    message: 'Artha Backend Server is running!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    endpoints: {
      health: 'GET /health',
      translate: 'POST /translate',
      'auth/register': 'POST /api/auth/register',
      'auth/login': 'POST /api/auth/login',
      'user/profile': 'GET /api/user/profile (protected)'
    },
    timestamp: new Date().toISOString()
  });
});

// These are the authentication routes for registering and logging in users.
// They handle user creation, password hashing, and JWT token generation for secure access.

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create user
    const user = new User({ name, email, password });
    await user.save();

    // Generate JWT token
    // The token includes the user ID and email, and is signed with a secret key.
    // It expires in 7 days, which means that I get logged out by default after a week of inactivity.
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'artha-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'artha-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile (protected)
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//These are the translation routes and logic.

// unofficial Google Translate function
async function translateWithGoogle(text, sourceLang, targetLang) {
  try {
    console.log(`\nTranslating with Google: ${sourceLang} → ${targetLang}`);
    
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    
    console.log('Google Translate response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      // The response structure is [[["translated text", "original", null, null]], null, "en"]
      const translatedText = data[0].map(item => item[0]).join('');
      console.log('✅ Google Translate success');
      return translatedText;
    } else {
      console.log('❌ Google Translate API error:', response.status);
      return null;
    }
  } catch (error) {
    console.log('❌ Google Translate error:', error.message);
    return null;
  }
}

// Save translation to user history
// This endpoint allows authenticated users to save their translations to their personal history.
// It expects the original text, translated text, source language, and target language in the request body.
// The user's identity is verified using the JWT token provided in the request headers.
// The translation is then added to the beginning of the user's translation history array.
app.post('/api/translations/save', authenticateToken, async (req, res) => {
  try {
    const { originalText, translatedText, sourceLang, targetLang } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add to translation history (keep last 50)
    user.translationHistory.unshift({
      originalText,
      translatedText,
      sourceLang,
      targetLang
    });

    // Keep only last 50 translations
    if (user.translationHistory.length > 50) {
      user.translationHistory = user.translationHistory.slice(0, 50);
    }

    await user.save();

    res.json({ message: 'Translation saved to history' });

  } catch (error) {
    console.error('Save translation error:', error);
    res.status(500).json({ error: 'Failed to save translation' });
  }
});

// Get user's translation history
app.get('/api/translations/history', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ history: user.translationHistory });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get translation history' });
  }
});

// Main translate endpoint (now with optional history saving)
app.post('/translate', async (req, res) => {
  try {
    const { text, sourceLang, targetLang, saveToHistory = false, authToken } = req.body;

    console.log('Translation request:', { text, sourceLang, targetLang });

    if (!text || !sourceLang || !targetLang) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        error: 'Text too long. Please limit to 2000 characters.'
      });
    }

    // Try Google Translate- this was the most reliable out of all the free services I tested
    let translatedText = await translateWithGoogle(text, sourceLang, targetLang);

    if (translatedText) {
      console.log('Translation success!! You are the GOAT');
      
      // Save to user history if requested and user is authenticated
      if (saveToHistory && authToken) {
        try {
          // Verify token and save to history
          jwt.verify(authToken, process.env.JWT_SECRET || 'artha-secret-key', async (err, user) => {
            if (!err) {
              const dbUser = await User.findById(user.userId);
              if (dbUser) {
                dbUser.translationHistory.unshift({
                  originalText: text,
                  translatedText: translatedText,
                  sourceLang,
                  targetLang
                });
                
                if (dbUser.translationHistory.length > 50) {
                  dbUser.translationHistory = dbUser.translationHistory.slice(0, 50);
                }
                
                await dbUser.save();
                console.log('Translation saved to user history');
              }
            }
          });
        } catch (historyError) {
          console.log('Oh no! Could not save to history:', historyError.message);
        }
      }

      return res.json({
        originalText: text,
        translatedText: translatedText,
        sourceLang: sourceLang,
        targetLang: targetLang,
        service: 'google-translate',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        error: 'Translation service is currently unavailable. Please try again later.'
      });
    }

  } catch (error) {
    console.error('❌ Translation failed:', error);
    res.status(500).json({ 
      error: 'Translation failed: ' + error.message
    });
  }
});

// Test endpoint
app.get('/test-translation', async (req, res) => {
  try {
    const testText = "Hello, how are you today?";
    const translated = await translateWithGoogle(testText, 'en', 'es');
    
    if (translated) {
      res.json({
        status: 'SUCCESS',
        original: testText,
        translated: translated,
        service: 'google-translate',
        message: 'Google Translate is working correctly!'
      });
    } else {
      res.status(500).json({
        status: 'FAILED',
        error: 'Google Translate failed',
        suggestion: 'Please check your internet connection'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  name: String,
  email: String,
  type: {
    type: String,
    enum: ['suggestion', 'bug', 'feature', 'general'],
    default: 'general'
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'reviewed', 'in-progress', 'resolved'],
    default: 'new'
  },

  replies: [{
    adminName: String,
    adminEmail: String,
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Submit feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, type, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Feedback message is required' });
    }

    const feedback = new Feedback({
      name: name || 'Anonymous',
      email: email || '',
      type: type || 'general',
      message
    });

    await feedback.save();

    res.status(201).json({
      message: 'Thank you for your feedback!',
      feedbackId: feedback._id
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get all feedback (protected - for admin)
app.get('/api/feedback', authenticateToken, async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json({ feedback });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to get feedback' });
  }
});

// Get feedback stats
app.get('/api/feedback/stats', authenticateToken, async (req, res) => {
  try {
    const total = await Feedback.countDocuments();
    const byType = await Feedback.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const byStatus = await Feedback.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      total,
      byType,
      byStatus
    });
  } catch (error) {
    console.error('Feedback stats error:', error);
    res.status(500).json({ error: 'Failed to get feedback stats' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Artha Translator API is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    service: 'Google Translate (Unofficial API)',
    reliability: 'High',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
  console.log(`Using Google Translate (Unofficial API) - Most Reliable`);
  console.log(`Authentication: Enabled`);
  console.log(`✅Health: http://localhost:3001/health`);
});
