// Use require instead of import for better Netlify compatibility
const { OpenAI } = require("openai");

exports.handler = async (event) => {
  try {
    const { subject, lesson, days, hoursPerDay } = JSON.parse(event.body);
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Crează un plan de studiu în română pentru ${subject} (${days} zile, ${hoursPerDay} ore/zi)`
      }]
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        html: response.choices[0]?.message?.content || "No content generated"
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to generate plan",
        details: error.message 
      })
    };
  }
};
