import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from "axios";
import { ToolNode } from '@langchain/langgraph/prebuilt';
import dotenv from 'dotenv';
dotenv.config();

const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
});

// get weather data from open weather api
async function getWeatherData(location) {
    let weatherData = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=c532e56f877ab8a2225c8c03305290f7`);
    // console.log(weatherData.data);
    return weatherData.data;
}


const getWeather = tool(async (input) => {
    const { location } = input;
    return await getWeatherData(location);
}, {
    name: 'get_weather',
    description: 'Call to get the current weather.',
    schema: z.object({
        location: z.string().describe("Location to get the weather for."),
    })
})


const tools = [getWeather];

const llmWithTools = llm.bindTools(tools);

async function llmCall(state) {
    // LLM decides whether to call a tool or not
    const result = await llmWithTools.invoke([
        {
            role: "system",
            content: "You are a helpful assistant tasked with answering weather queries.",
        },
        ...state.messages
    ]);

    return {
        messages: [result]
    };
}

const toolNode = new ToolNode(tools);

function shouldContinue(state) {
    const messages = state.messages;
    const lastMessage = messages.at(-1);

    if (lastMessage?.tool_calls?.length) {
        return "Action";
    }
    return "__end__";
}

// Build workflow
const agentBuilder = new StateGraph(MessagesAnnotation)
    .addNode("llmCall", llmCall)
    .addNode("tools", toolNode)
    .addEdge("__start__", "llmCall")
    .addConditionalEdges(
        "llmCall",
        shouldContinue,
        {
            "Action": "tools",
            "__end__": "__end__",
        }
    )
    .addEdge("tools", "llmCall")
    .compile();

const messages = [{
    role: "user",
    content: "What is data??"
}];
const result = await agentBuilder.invoke({ messages });
console.log(result.messages);
