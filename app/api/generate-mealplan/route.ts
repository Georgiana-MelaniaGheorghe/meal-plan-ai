

import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openAI = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1", 
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

export async function POST(request: Request) {
  try {

    const { dietType, calories, allergies, cuisine, snacks } =
      await request.json();

    const prompt = `
      You are a professional nutritionist. Create a 7-day meal plan for an individual following a ${dietType} diet aiming for ${calories} calories per day.
      
      Allergies or restrictions: ${allergies || "none"}.
      Preferred cuisine: ${cuisine || "no preference"}.
      Snacks included: ${snacks ? "yes" : "no"}.
      
      For each day, provide:
        - Breakfast
        - Lunch
        - Dinner
        ${snacks ? "- Snacks" : ""}
      
      Use simple ingredients and provide brief instructions. Include approximate calorie counts for each meal.
      
      Structure the response as a JSON object where each day is a key, and each meal (breakfast, lunch, dinner, snacks) is a sub-key. Example:
      
      {
        "Monday": {
          "Breakfast": "Oatmeal with fruits - 350 calories",
          "Lunch": "Grilled chicken salad - 500 calories",
          "Dinner": "Steamed vegetables with quinoa - 600 calories",
          "Snacks": "Greek yogurt - 150 calories"
        },
        "Tuesday": {
          "Breakfast": "Smoothie bowl - 300 calories",
          "Lunch": "Turkey sandwich - 450 calories",
          "Dinner": "Baked salmon with asparagus - 700 calories",
          "Snacks": "Almonds - 200 calories"
        }
        // ...and so on for each day
      }

      Return just the json with no extra commentaries and no backticks.
    `;

    
    // const response = await openAI.chat.completions.create({
    //   model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    //   // model: "meta-llama/llama-3.2-3b-instruct:free", 
    //   messages: [
    //     {
    //       role: "user",
    //       content: prompt,
    //     },
    //   ],
    //   temperature: 0.7, 
    //   max_tokens: 1500, 
    // });
    const response = await openAI.chat.completions.create({
  model: "nvidia/nemotron-3-ultra-550b-a55b:free",

  response_format: {
    type: "json_object",
  },

  messages: [
    {
      role: "system",
      content:
        "You are a nutritionist. Always respond with valid JSON only.",
    },
    {
      role: "user",
      content: prompt,
    },
  ],

  temperature: 0.2,
});

   const content = response.choices[0]?.message?.content;

if (!content) {
  return NextResponse.json(
    { error: "No response received from AI." },
    { status: 500 }
  );
}

const aiContent = content.trim();

 
    let parsedMealPlan: { [day: string]: DailyMealPlan };
    console.log(aiContent);
    try {
      parsedMealPlan = JSON.parse(aiContent);
    } catch (parseError) {
      console.error("Error parsing AI response as JSON:", parseError);
   
      return NextResponse.json(
        { error: "Failed to parse meal plan. Please try again." },
        { status: 500 }
      );
    }

  
    if (typeof parsedMealPlan !== "object" || parsedMealPlan === null) {
      throw new Error("Invalid meal plan format received from AI.");
    }

  

  
    return NextResponse.json({ mealPlan: parsedMealPlan });
  } catch (error) {
    console.error("Error generating meal plan:", error);
    return NextResponse.json(
      { error: "Failed to generate meal plan. Please try again later." },
      { status: 500 }
    );
  }
}

interface DailyMealPlan {
  Breakfast?: string;
  Lunch?: string;
  Dinner?: string;
  Snacks?: string;
}