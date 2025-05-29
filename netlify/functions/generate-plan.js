const { OpenAI } = require("openai");

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  try {
    console.log("Incoming request body:", event.body);
    
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
      apiKey: process.env.OPENAI_API_KEY || "default-key-if-not-set"
    });

    console.log("Calling OpenAI API...");
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    return {
      statusCode: 200,
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        html: response.choices[0]?.message?.content || "No content generated"
      })
    };
  } catch (error) {
    console.error("Full error:", error);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        error: "Failed to generate plan",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      })
    };
  }
};
