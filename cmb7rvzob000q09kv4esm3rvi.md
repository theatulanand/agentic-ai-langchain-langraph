---
title: "Let's build Chat with PDF"
seoTitle: "Chat with pdf (RAG)"
seoDescription: "In this blog post, we'll walk through building a full-stack application that allows users to upload PDF documents and chat with them using AI."
datePublished: Wed May 28 2025 09:58:41 GMT+0000 (Coordinated Universal Time)
cuid: cmb7rvzob000q09kv4esm3rvi
slug: lets-build-chat-with-pdf
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1748425800752/ffe5b62f-c8bd-4dd6-9139-a98cfc4533d5.jpeg
tags: ai, nodejs, qdrant, bullmq, gemini, rag

---

In this blog post, we'll walk through building a full-stack application that allows users to upload PDF documents and chat with them using AI. We'll focus primarily on the backend implementation, which handles PDF processing, vector embeddings, and AI-powered chat functionality.

To make the PDFs searchable and chat-capable, we integrate:

* **LangChain** for loading PDF content and generating vector embeddings
    
* **Qdrant** as the vector database to store and search those embeddings
    
* **Gemini (Google’s LLM)** for generating intelligent, context-aware responses
    
* **BullMQ** for handling background tasks like PDF parsing and embedding generation
    

By the end of this post, you’ll have a robust app where users can chat with uploaded PDFs using modern AI technologies.

## Project Overview

Our "Chat with PDF" application will:

1. Allow users to upload PDF documents
    
2. Process and extract text from PDFs
    
3. Store document embeddings in a vector database
    
4. Enable users to ask questions about the document
    
5. Provide AI-generated responses based on the document content
    

## Architecture

The application follows a client-server architecture with the following components:

### Backend (Express.js)

* REST API endpoints for file upload and chat
    
* Authentication middleware using Clerk
    
* PDF processing using LangChain
    
* Vector storage using Qdrant
    
* Background job processing using BullMQ and Redis
    
* AI integration with Google's Generative AI (Gemini)
    

### Data Flow

1. User uploads a PDF document
    
2. Backend stores the file and adds a processing job to the queue
    
3. Worker processes the PDF, extracts text, and stores embeddings in Qdrant
    
4. User asks questions about the document
    
5. Backend retrieves relevant context from the vector store
    
6. AI generates responses based on the retrieved context
    

## Backend Implementation Details

### Installation and Setup

Before diving into the Express server setup, let's install all the necessary dependencies for our backend:

```typescript
# Create a server directory if not already created
mkdir -p server
cd server

# Initialize package.json
npm init -y

# Install core dependencies
npm install express cors dotenv multer

# Install PDF processing and AI dependencies
npm install @langchain/community @langchain/qdrant @google/generative-ai

# Install queue management
npm install bullmq

# Install authentication
npm install @clerk/clerk-sdk-node
```

### Express Server Setup

Now that we have our dependencies installed, let's set up our Express server. The server will handle file uploads, process PDFs, and respond to chat queries.

Here's the pseudocode for our main server file (**index.js**):

```typescript
// Import necessary dependencies
Import Express, CORS, dotenv, ClerkExpressRequireAuth
Import multer middleware for file uploads
Import BullMQ for queue management
Import Gemini service for embeddings

// Load environment variables
Load environment variables from .env file

// Initialize Express app
Create Express app
Configure CORS
Configure JSON parsing

// Initialize BullMQ queue for PDF processing
Create pdfProcessQueue

// Authentication middleware
Create authentication middleware using Clerk

// Define routes

// File upload endpoint
POST '/upload-file':
  - Use authentication middleware
  - Use multer middleware to handle file upload
  - Add PDF processing job to queue with file path and user ID
  - Return success response

// Chat endpoint
POST '/chat':
  - Use authentication middleware
  - Extract question, user ID, and file ID from request
  - Generate embeddings for the question using Gemini service
  - Query vector store (Qdrant) with embeddings to get relevant context
  - Format context and question for AI model
  - Send formatted prompt to Google Generative AI (Gemini)
  - Return AI response

// Start server
Listen on specified port
Log server start message
```

### File Upload Middleware

We'll use Multer to handle file uploads. Here's the pseudocode for our Multer configuration:

```typescript
// Import multer and path
Import multer, path

// Configure storage
Create disk storage with:
  - Destination: './uploads/'
  - Filename: Generate unique filename with original extension

// Create and export upload middleware
Create multer instance with storage configuration
Export uploadFile middleware that accepts single file with field name 'pdf'
```

### PDF Processing Queue

We'll use BullMQ to manage the PDF processing queue. Here's the pseudocode for our queue setup:

```typescript
// Import BullMQ
Import Queue from 'bullmq'

// Create and export PDF processing queue
Create Queue with name 'pdfProcess' and Redis connection options
Export queue
```

### PDF Processing Worker

The worker will process PDF files from the queue. Here's the pseudocode:

```typescript
// Import necessary dependencies
Import Worker from 'bullmq'
Import PDFLoader from '@langchain/community'
Import QdrantVectorStore from '@langchain/qdrant'
Import Gemini service for embeddings

// Create worker
Create Worker with:
  - Queue name: 'pdfProcess'
  - Redis connection options
  - Process function:
    - Load PDF using PDFLoader
    - Split documents into chunks
    - Create vector store using Qdrant with:
      - Documents
      - Embeddings from Gemini service
      - Namespace based on user ID and file ID
    - Log completion message

// Handle worker events (completed, failed)
```

### Gemini Service

We'll use Google's Generative AI for embeddings and chat responses. Here's the pseudocode:

```typescript
// Import Google Generative AI
Import GoogleGenerativeAI, GoogleGenerativeAIEmbeddings

// Initialize Google Generative AI with API key
Create genAI instance with API key from environment variables

// Create and export embeddings function
Export GeminiEmbeddings function that returns GoogleGenerativeAIEmbeddings instance

// Create and export chat function
Export GeminiService function that:
  - Takes prompt as input
  - Creates Gemini model instance
  - Generates content based on prompt
  - Returns generated content
```

### Environment Variables

Create a **.env** file in the server directory with the following variables:

```typescript
PORT=3001
GOOGLE_API_KEY=your_google_api_key
QDRANT_URL=your_qdrant_url
REDIS_URL=your_redis_url
CLERK_SECRET_KEY=your_clerk_secret_key
```

## Conclusion

This backend setup creates a strong base for our "Chat with PDF" application. It manages file uploads, processes PDFs to extract and store embeddings, and uses AI to generate responses based on the PDF content and user questions.

Using queues ensures that PDF processing happens asynchronously, which improves the user experience. The vector store enables efficient semantic searches of PDF content, and the AI model creates natural language responses based on the retrieved context.

In a production setting, you should add error handling, logging, and possibly caching to enhance performance and reliability.

Check the full code here: [https://github.com/showoff-today/chat-with-pdf](https://github.com/showoff-today/chat-with-pdf)