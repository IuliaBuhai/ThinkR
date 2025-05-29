const { OpenAI } = require("openai");

exports.handler = async (event) => {
  // Parse request
  const { subject, lesson, days, hoursPerDay, userId } = JSON.parse(event.body);
  
  // Initialize OpenAI
  const openai = new OpenAI(process.env.OPENAI_API_KEY);

  // Generate plan
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
      html: response.choices[0].message.content 
    })
  };
};