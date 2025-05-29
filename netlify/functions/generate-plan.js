const { OpenAI } = require("openai");

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://thinkr-infoeducatie.netlify.app",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  try {
    const { class: classLevel, subject, lesson, days, hoursPerDay } = JSON.parse(event.body);
    const hoursText = hoursPerDay ? `pentru ${hoursPerDay} oră/ore pe zi` : '';

    const prompt = `Crează un plan detaliat de studiu pentru:
- Clasa: ${classLevel}
- Materia: ${subject}
- Lecția: ${lesson}
- Durată: ${days} zile ${hoursText}

Planul trebuie să includă:
1. Detalierea zilnică a subiectelor de abordat
2. Tehnici de studiu sugerate
3. Resurse recomandate cu denumiri de cărți școlare sau populare
4. Exerciții practice - și grele și ușoare

Formatați răspunsul în HTML cu titluri și liste adecvate.`;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: prompt
      }],
      temperature: 0.7
    });

    const generatedHTML = response.choices[0]?.message?.content || "Nu s-a putut genera planul.";

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://thinkr-infoeducatie.netlify.app",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        html: generatedHTML
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://thinkr-infoeducatie.netlify.app",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        error: "Failed to generate plan",
        details: error.message 
      })
    };
  }
};
