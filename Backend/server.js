require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { OpenAI } = require('openai');

const app = express();
const port = 3001;

// Hardcoded API configuration
const OPENAI_API_KEY = '3431b399c0d241d724e376d0880d8301ba3c21a6cdf553bb2ecb68468aa5609f505d06f2020fd177';
const API_BASE_URL = 'http://gaia.infoedge.com/astra-openai-adapter/v1';

// Initialize OpenAI client with streaming support
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: API_BASE_URL,
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
}));

app.use(compression());
app.use(express.json({ limit: '1mb' }));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080'],
  credentials: true
}));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

app.use('/api/', limiter);

// Astrology calculation functions
function calculateAstrologyProfile(birthDetails) {
  const { birthDate, birthTime, birthPlace } = birthDetails;
  
  if (!birthDate) {
    return {
      error: 'Birth date is required for astrological analysis',
      favorableDirections: ['East', 'North'], // Default fallback
      unfavorableDirections: ['South', 'West'],
      planetaryRuler: 'Sun',
      moonSign: 'Unknown',
      birthStar: 'Unknown',
      luckyDirections: ['Northeast']
    };
  }

  const birthDateObj = new Date(birthDate);
  const dayOfYear = getDayOfYear(birthDateObj);
  const birthMonth = birthDateObj.getMonth() + 1;
  const birthDay = birthDateObj.getDate();

  // Calculate planetary ruler based on birth date
  const planetaryRuler = calculatePlanetaryRuler(birthDateObj);
  
  // Calculate moon sign (simplified calculation)
  const moonSign = calculateMoonSign(birthMonth, birthDay);
  
  // Calculate birth star/nakshatra (simplified)
  const birthStar = calculateBirthStar(dayOfYear);
  
  // Calculate favorable directions based on planetary influences
  const favorableDirections = calculateFavorableDirections(planetaryRuler, moonSign, birthStar);
  
  // Calculate unfavorable directions
  const unfavorableDirections = calculateUnfavorableDirections(favorableDirections);
  
  // Calculate lucky directions for residence
  const luckyDirections = calculateLuckyDirections(planetaryRuler, birthMonth);

  return {
    planetaryRuler,
    moonSign,
    birthStar,
    favorableDirections,
    unfavorableDirections,
    luckyDirections,
    birthElement: calculateBirthElement(birthMonth),
    lifeNumber: calculateLifeNumber(birthDateObj)
  };
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function calculatePlanetaryRuler(birthDate) {
  const dayOfWeek = birthDate.getDay();
  const rulers = {
    0: 'Sun',     // Sunday
    1: 'Moon',    // Monday
    2: 'Mars',    // Tuesday
    3: 'Mercury', // Wednesday
    4: 'Jupiter', // Thursday
    5: 'Venus',   // Friday
    6: 'Saturn'   // Saturday
  };
  return rulers[dayOfWeek];
}

function calculateMoonSign(month, day) {
  // Simplified moon sign calculation based on birth month
  const moonSigns = [
    'Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini',
    'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius'
  ];
  
  // Adjust for day within month for more accuracy
  let signIndex = (month - 1 + Math.floor(day / 15)) % 12;
  return moonSigns[signIndex];
}

function calculateBirthStar(dayOfYear) {
  // 27 Nakshatras in Vedic astrology
  const nakshatras = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
    'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta',
    'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
    'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
    'Uttara Bhadrapada', 'Revati'
  ];
  
  const nakshatra_index = Math.floor((dayOfYear * 27) / 365) % 27;
  return nakshatras[nakshatra_index];
}

function calculateFavorableDirections(planetaryRuler, moonSign, birthStar) {
  const planetaryDirections = {
    'Sun': ['East', 'Northeast'],
    'Moon': ['Northwest', 'North'],
    'Mars': ['South', 'Southeast'],
    'Mercury': ['North', 'Northeast'],
    'Jupiter': ['Northeast', 'East'],
    'Venus': ['Southeast', 'South'],
    'Saturn': ['West', 'Southwest']
  };
  
  const moonSignDirections = {
    'Aries': ['East', 'South'],
    'Taurus': ['South', 'Southeast'],
    'Gemini': ['North', 'West'],
    'Cancer': ['North', 'Northwest'],
    'Leo': ['East', 'Northeast'],
    'Virgo': ['South', 'Southwest'],
    'Libra': ['West', 'Northwest'],
    'Scorpio': ['North', 'Northeast'],
    'Sagittarius': ['East', 'South'],
    'Capricorn': ['South', 'Southwest'],
    'Aquarius': ['West', 'Southwest'],
    'Pisces': ['North', 'East']
  };
  
  const planetary = planetaryDirections[planetaryRuler] || ['East', 'North'];
  const moonBased = moonSignDirections[moonSign] || ['North', 'East'];
  
  // Combine and deduplicate
  const combined = [...new Set([...planetary, ...moonBased])];
  return combined.slice(0, 3); // Return top 3 favorable directions
}

function calculateUnfavorableDirections(favorableDirections) {
  const allDirections = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];
  return allDirections.filter(dir => !favorableDirections.includes(dir));
}

function calculateLuckyDirections(planetaryRuler, birthMonth) {
  const seasonalDirections = {
    1: ['Northeast', 'East'],    // Winter
    2: ['Northeast', 'East'],    // Winter
    3: ['East', 'Southeast'],    // Spring
    4: ['East', 'Southeast'],    // Spring
    5: ['Southeast', 'South'],   // Summer
    6: ['Southeast', 'South'],   // Summer
    7: ['South', 'Southwest'],   // Monsoon
    8: ['South', 'Southwest'],   // Monsoon
    9: ['Southwest', 'West'],    // Autumn
    10: ['Southwest', 'West'],   // Autumn
    11: ['West', 'Northwest'],   // Late Autumn
    12: ['Northwest', 'North']   // Early Winter
  };
  
  return seasonalDirections[birthMonth] || ['North', 'East'];
}

function calculateBirthElement(birthMonth) {
  if (birthMonth >= 3 && birthMonth <= 5) return 'Fire';
  if (birthMonth >= 6 && birthMonth <= 8) return 'Earth';
  if (birthMonth >= 9 && birthMonth <= 11) return 'Air';
  return 'Water'; // Dec, Jan, Feb
}

function calculateLifeNumber(birthDate) {
  const dateString = birthDate.toISOString().split('T')[0].replace(/-/g, '');
  let sum = dateString.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  }
  
  return sum;
}

function calculateDirectionalCompatibility(astrologyProfile, propertyDirections) {
  const { favorableDirections, unfavorableDirections, luckyDirections } = astrologyProfile;
  
  let compatibilityScore = 0;
  let totalRooms = 0;
  const roomAnalysis = {};
  
  // Main entrance is most important (40% weight)
  const entranceDirection = propertyDirections.entrance;
  if (favorableDirections.includes(entranceDirection)) {
    compatibilityScore += 40;
    roomAnalysis.entrance = { compatible: true, score: 90, reason: 'Highly favorable direction for you' };
  } else if (luckyDirections.includes(entranceDirection)) {
    compatibilityScore += 30;
    roomAnalysis.entrance = { compatible: true, score: 75, reason: 'Lucky direction for residence' };
  } else if (unfavorableDirections.includes(entranceDirection)) {
    compatibilityScore += 10;
    roomAnalysis.entrance = { compatible: false, score: 25, reason: 'Unfavorable direction, may cause challenges' };
  } else {
    compatibilityScore += 20;
    roomAnalysis.entrance = { compatible: false, score: 50, reason: 'Neutral direction' };
  }
  
  // Other rooms (60% weight distributed)
  const otherRooms = ['masterBedroom', 'kitchen', 'bathroom', 'poojaRoom', 'livingRoom'];
  const roomWeight = 60 / otherRooms.length; // 12% each
  
  otherRooms.forEach(room => {
    const direction = propertyDirections[room];
    let roomScore = 0;
    let analysis = {};
    
    if (favorableDirections.includes(direction)) {
      roomScore = 80;
      analysis = { compatible: true, score: 80, reason: 'Favorable direction for your energy' };
    } else if (luckyDirections.includes(direction)) {
      roomScore = 65;
      analysis = { compatible: true, score: 65, reason: 'Lucky direction for this space' };
    } else if (unfavorableDirections.includes(direction)) {
      roomScore = 30;
      analysis = { compatible: false, score: 30, reason: 'May create energy imbalance' };
    } else {
      roomScore = 50;
      analysis = { compatible: false, score: 50, reason: 'Neutral astrological impact' };
    }
    
    compatibilityScore += (roomScore * roomWeight) / 100;
    roomAnalysis[room] = analysis;
    totalRooms++;
  });
  
  return {
    overallScore: Math.round(compatibilityScore),
    roomAnalysis,
    recommendation: compatibilityScore >= 70 ? 
      'Excellent astrological alignment with your property!' :
      compatibilityScore >= 50 ?
      'Good compatibility with some areas for improvement.' :
      'Consider astrological remedies to improve energy alignment.'
  };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    openaiConfigured: !!OPENAI_API_KEY,
    apiBaseUrl: API_BASE_URL,
    streamingEnabled: true,
    astrologyEnabled: true,
    numerologyEnabled: true
  });
});

// New astrology analysis endpoint
app.post('/api/analyze-astrology', async (req, res) => {
  try {
    const { birthDetails, propertyDirections } = req.body;
    
    if (!birthDetails || !propertyDirections) {
      return res.status(400).json({
        error: 'Missing birth details or property directions'
      });
    }
    
    console.log('🔮 Calculating astrological profile...');
    
    const astrologyProfile = calculateAstrologyProfile(birthDetails);
    const directionalCompatibility = calculateDirectionalCompatibility(astrologyProfile, propertyDirections);
    
    res.json({
      success: true,
      astrologyProfile,
      directionalCompatibility,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in astrology analysis:', error);
    res.status(500).json({
      error: 'Failed to analyze astrology',
      details: error.message
    });
  }
});

// Streaming response generator function
async function generateStreamingResponse(prompt, model = "gpt-4o", maxRetries = 3) {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`🔄 Generating streaming response with model: ${model}`);
      
      const stream = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are a traditional Vastu Shastra, Vedic Astrology, and Numerology expert. Provide practical, culturally authentic remedies combining all three sciences."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        stream: true,
        max_tokens: 1500,
        temperature: 0.7,
      });

      const chunks = [];
      
      for await (const event of stream) {
        const delta = event.choices[0]?.delta;
        if (delta && delta.content) {
          chunks.push(delta.content);
          process.stdout.write(delta.content);
        }
      }
      
      console.log('\n✅ Streaming complete');
      
      const fullResponse = chunks.join('').trim();
      
      return {
        content: fullResponse,
        chunks: chunks.length,
        model: model
      };
      
    } catch (error) {
      retries++;
      console.error(`❌ Attempt ${retries} failed:`, error.message);
      
      if (error.status === 429 && retries < maxRetries) {
        const waitTime = Math.pow(2, retries) * 1000;
        console.warn(`⏳ Rate limit reached, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('Max retries exceeded for streaming OpenAI API call');
}

// Enhanced Vastu remedies endpoint with astrology integration
app.post('/api/generate-vastu-remedies', async (req, res) => {
  try {
    const { vastuAnalysis, buyerDetails, propertyDetails, astrologyAnalysis } = req.body;

    if (!vastuAnalysis || !buyerDetails || !propertyDetails) {
      return res.status(400).json({
        error: 'Missing required data: vastuAnalysis, buyerDetails, or propertyDetails'
      });
    }

    console.log('🔮 Generating enhanced multi-dimensional remedies...');

    const prompt = createEnhancedVastuRemedyPrompt(vastuAnalysis, buyerDetails, propertyDetails, astrologyAnalysis);
    
    const remedies = await generateStreamingResponse(prompt, "gpt-4o");

    console.log('✅ Enhanced remedies generated successfully');

    res.json({
      success: true,
      remedies,
      timestamp: new Date().toISOString(),
      vastuScore: vastuAnalysis.finalScore,
      astrologyScore: astrologyAnalysis?.directionalCompatibility?.overallScore || 0,
      streamingUsed: true
    });

  } catch (error) {
    console.error('❌ Error generating enhanced remedies:', error);

    if (error.code === 'rate_limit_exceeded' || error.status === 429) {
      return res.status(429).json({
        error: 'API rate limit exceeded. Please try again later.',
        retryAfter: 60
      });
    }

    res.status(500).json({
      error: 'Failed to generate remedies. Please try again.',
      details: error.message
    });
  }
});

function createEnhancedVastuRemedyPrompt(vastuAnalysis, buyerDetails, propertyDetails, astrologyAnalysis) {
  const astrologyInfo = astrologyAnalysis ? `
ASTROLOGICAL PROFILE:
- Planetary Ruler: ${astrologyAnalysis.astrologyProfile?.planetaryRuler || 'Unknown'}
- Moon Sign: ${astrologyAnalysis.astrologyProfile?.moonSign || 'Unknown'}
- Birth Star: ${astrologyAnalysis.astrologyProfile?.birthStar || 'Unknown'}
- Birth Element: ${astrologyAnalysis.astrologyProfile?.birthElement || 'Unknown'}
- Life Number: ${astrologyAnalysis.astrologyProfile?.lifeNumber || 'Unknown'}
- Favorable Directions: ${astrologyAnalysis.astrologyProfile?.favorableDirections?.join(', ') || 'Not analyzed'}
- Lucky Directions for Residence: ${astrologyAnalysis.astrologyProfile?.luckyDirections?.join(', ') || 'Not analyzed'}
- Astrological Compatibility Score: ${astrologyAnalysis.directionalCompatibility?.overallScore || 0}/100
- Directional Compatibility: ${astrologyAnalysis.directionalCompatibility?.recommendation || 'Not analyzed'}
` : '';

  return `You are Dr. Rajesh Sharma, a master in Vastu Shastra, Vedic Astrology, and Numerology with 25+ years of experience.

BUYER PROFILE:
- Name: ${buyerDetails.name}, Age: ${buyerDetails.age}
- Birth Date: ${buyerDetails.birthDate || 'Not provided'}
- Birth Time: ${buyerDetails.birthTime || 'Not provided'}
- Birth Place: ${buyerDetails.birthPlace || 'Not provided'}

PROPERTY ANALYSIS:
- House #${propertyDetails.houseNumber}, Floor ${propertyDetails.floorNumber}
- Plot Shape: ${propertyDetails.plotShape}
- Overall Vastu Score: ${vastuAnalysis.finalScore}/100

ROOM VASTU SCORES:
${Object.entries(vastuAnalysis.roomScores || {}).map(([room, score]) =>
    `- ${room}: ${score}/100 ${score < 60 ? '(NEEDS ATTENTION)' : '(GOOD)'}`
  ).join('\n')}

${astrologyInfo}

INTEGRATION ANALYSIS:
Based on Vastu principles, astrological profile, and numerological compatibility, provide comprehensive remedies that address architectural harmony, personal energy alignment, and numerical vibrations.

Please provide practical remedies in this format:

**IMMEDIATE REMEDIES** (0-7 days):
1. [Specific action combining Vastu + Astrology + Numerology] - [Expected benefit]
2. [Specific action combining Vastu + Astrology + Numerology] - [Expected benefit]
3. [Specific action combining Vastu + Astrology + Numerology] - [Expected benefit]

**PROGRESSIVE REMEDIES** (1-8 weeks):
1. [Medium-term multi-dimensional solution] - [Expected benefit]
2. [Medium-term multi-dimensional solution] - [Expected benefit]

**ASTROLOGICAL ENHANCEMENTS** (ongoing):
1. [Personal planetary remedy] - [Astrological benefit]
2. [Directional energy practice] - [Astrological benefit]

**NUMEROLOGICAL HARMONIZATION** (specific timing):
1. [Number-based timing remedy] - [Numerological benefit]
2. [Numerical frequency practice] - [Numerological benefit]

**SPIRITUAL PRACTICES** (daily/weekly):
1. [Personalized ritual based on birth chart and numbers] - [Spiritual benefit]
2. [Timing-based practice with astrological consideration] - [Spiritual benefit]

Focus on remedies that honor traditional Vastu wisdom, individual astrological blueprint, and numerological vibrations. Make recommendations practical, culturally authentic, and budget-conscious.`;
}

// Generic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(port, () => {
  console.log(`🚀 Enhanced Multi-Dimensional Vastu API server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🔮 Astrology analysis: http://localhost:${port}/api/analyze-astrology`);
  console.log(`🔑 OpenAI API Key: ${OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🌐 Using custom OpenAI endpoint: ${API_BASE_URL}`);
  console.log(`🔄 Multi-dimensional streaming enabled (Vastu + Astrology + Numerology)`);
});

module.exports = app;
