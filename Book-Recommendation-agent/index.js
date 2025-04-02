import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { z } from "zod";
import readline from "readline";
import dotenv from "dotenv";
dotenv.config();

const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
});

const bookDatabase = {
    "fiction": ["The Great Gatsby", "To Kill a Mockingbird", "1984"],
    "non-fiction": ["Sapiens", "Educated", "The Immortal Life of Henrietta Lacks"],
    "mystery": ["Gone Girl", "The Girl with the Dragon Tattoo", "Sherlock Holmes"],
    "fantasy": ["Harry Potter", "The Hobbit", "Percy Jackson"]
};

async function getBookRecommendation(genre) {
    return bookDatabase[genre.toLowerCase()] || ["No recommendations found"];
}

const recommendBooks = tool(async (input) => {
    const { genre } = input;
    return await getBookRecommendation(genre);
}, {
    name: 'recommend_books',
    description: 'Get book recommendations based on genre.',
    schema: z.object({
        genre: z.string().describe("Preferred book genre."),
    })
});

const tools = [recommendBooks];
const llmWithTools = llm.bindTools(tools);

async function llmCall(state) {
    const result = await llmWithTools.invoke([
        {
            role: "system",
            content: "You are a helpful assistant that recommends books based on user preferences. If the user mentions a book genre, use the 'recommend_books' tool to fetch recommendations and solve any query related to books like summarizing it.",
        },
        ...state.messages
    ]);

    return { messages: [...state.messages, result] };
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
        
        messages.push({ role: "assistant", content: result.messages.at(-1)?.content }); // Store AI response
        console.log("AI:", result.messages.at(-1)?.content);
    }

    rl.close();
}

chat();
