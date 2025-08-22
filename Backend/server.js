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

// Initialize OpenAI client
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    openaiConfigured: !!OPENAI_API_KEY,
    apiBaseUrl: API_BASE_URL
  });
});

// Generate remedies endpoint
app.post('/api/generate-remedies', async (req, res) => {
  try {
    const { analysisType, personalDetails, propertyDetails } = req.body;

    if (!analysisType || !personalDetails || !propertyDetails) {
      return res.status(400).json({
        error: 'Missing required data: analysisType, personalDetails, or propertyDetails'
      });
    }

    console.log(`🔮 Generating ${analysisType} remedies...`);

    const prompt = createRemedyPrompt(analysisType, personalDetails, propertyDetails);
    const remedies = await generateStreamingResponse(prompt);

    console.log(`✅ ${analysisType} remedies generated successfully`);

    res.json({
      success: true,
      remedies,
      timestamp: new Date().toISOString(),
      analysisType
    });

  } catch (error) {
    console.error(`❌ Error generating ${req.body.analysisType || 'unknown'} remedies:`, error);

    if (error.status === 429) {
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

// Streaming response generator
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
            content: "You are an expert in traditional Vastu Shastra, Vedic Astrology, and Numerology. Provide practical, culturally authentic remedies."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        stream: true,
        max_tokens: 1200,
        temperature: 0.7,
      });

      const chunks = [];
      
      for await (const event of stream) {
        const delta = event.choices[0]?.delta;
        if (delta && delta.content) {
          chunks.push(delta.content);
        }
      }
      
      console.log('\n✅ Streaming complete');
      return {
        content: chunks.join('').trim(),
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

// Create remedy prompts based on analysis type
function createRemedyPrompt(analysisType, personalDetails, propertyDetails) {
  const baseInfo = `
PERSON: ${personalDetails.name}
BIRTH DATE: ${personalDetails.birthDate}
BIRTH PLACE: ${personalDetails.birthPlace}
HOUSE NUMBER: ${propertyDetails.houseNumber}
HOUSE DIRECTION: ${propertyDetails.houseDirection}
`;

  switch (analysisType) {
    case 'vastu':
      return `${baseInfo}
ROOM DIRECTIONS:
- Entrance: ${propertyDetails.entrance}
- Master Bedroom: ${propertyDetails.masterBedroom}  
- Kitchen: ${propertyDetails.kitchen}
- Bathroom: ${propertyDetails.bathroom}
- Pooja Room: ${propertyDetails.poojaRoom}
- Living Room: ${propertyDetails.livingRoom}
- Plot Shape: ${propertyDetails.plotShape}

As a Vastu expert, provide specific remedies for improving the directional alignment of rooms and plot shape issues. Focus only on traditional Vastu principles for spatial harmony.

IMPORTANT: Provide exactly 6-7 practical remedies. Each remedy should be:
- One clear sentence per remedy
- Actionable and specific
- Budget-friendly
- Focused on placement, colors, mirrors, plants, or objects

Format: Provide numbered remedies (1. 2. 3. etc.) each on a new line:`;

    case 'numerology':
      return `${baseInfo}
The person's birth number and house number may have compatibility issues.

As a Numerology expert, provide specific remedies for harmonizing the numerical vibrations between the person and their house number.

IMPORTANT RESTRICTIONS:
- DO NOT suggest changing house numbers
- DO NOT suggest changing person's name
- Focus ONLY on practical remedies using:
  * Colors and gemstones
  * Numbers in decoration
  * Timing of activities
  * Objects with specific numerical significance
  * Prayer/meditation practices with numbers

IMPORTANT: Provide exactly 6-7 practical remedies. Each remedy should be:
- One clear sentence per remedy
- Actionable without changing house number or name
- Budget-friendly
- Focused on colors, objects, timing, or practices

Format: Provide numbered remedies (1. 2. 3. etc.) each on a new line:`;

    case 'astrology':
      return `${baseInfo}
The person's house direction may not align with their astrological favorable directions.

As an Astrology expert, provide specific remedies for improving directional compatibility based on the person's birth chart. Include:
- Planetary remedies
- Directional energy enhancements  
- Timing based on planetary positions

IMPORTANT: Provide exactly 6-7 practical remedies. Each remedy should be:
- One clear sentence per remedy
- Actionable and specific
- Budget-friendly
- Focused on planetary items, colors, directions, or timing

Format: Provide numbered remedies (1. 2. 3. etc.) each on a new line:`;

    default:
      return `${baseInfo}
Provide general spiritual and traditional remedies for overall harmony.`;
  }
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(port, () => {
  console.log(`🚀 Comprehensive Vastu-Astrology-Numerology API running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🔑 OpenAI configured: ${OPENAI_API_KEY ? '✅' : '❌'}`);
});

module.exports = app;
