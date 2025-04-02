import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import readline from "readline";
import dotenv from "dotenv";
dotenv.config();

const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
});

const MAX_QUESTIONS = 7;

async function llmCall(state) {
    const userMessages = state.messages.filter(msg => msg.role === "user").length;
    
    const result = await llm.invoke([
        {
            role: "system",
            content: `You are a helpful assistant name BookrBuddy that provides book recommendations and summaries. Only answer questions related to books. You can summarize books, suggest books, and provide any book-related information. Ask the user one question at a time to understand their preferences before recommending books. Ask at most ${MAX_QUESTIONS} questions before making recommendations. If the user asks something unrelated to books, gently steer the conversation back to books.`,
        },
        ...state.messages
    ]);

    return { messages: [...state.messages, result] };
}


const agentBuilder = new StateGraph(MessagesAnnotation)
    .addNode("llmCall", llmCall)
    .addEdge("__start__", "llmCall")
    .addEdge("llmCall", "__end__")
    .compile();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function chat() {
    let messages = [];
    
    function askQuestion(question) {
        return new Promise(resolve => rl.question(question, resolve));
    }

    while (true) {
        let userInput = await askQuestion("You: ");
        if (userInput.toLowerCase() === "exit") break;

        messages.push({ role: "user", content: userInput });
        let result = await agentBuilder.invoke({ messages });
        
        messages.push({ role: "assistant", content: result.messages.at(-1)?.content });
        console.log("AI:", result.messages.at(-1)?.content);
    }

    rl.close();
}

chat();
