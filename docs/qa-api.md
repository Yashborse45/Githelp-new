# Q&A API Documentation

## Overview

The Q&A API allows you to ask questions about your projects and get AI-powered answers based on the project's codebase. The API is implemented as a Next.js API route at `/api/ask`.

## API Endpoints

### POST `/api/ask`

Ask a question about a specific project.

**Request Body:**
```json
{
  "projectId": "string (required)",
  "question": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "question": "string",
    "answer": "string",
    "citations": [
      {
        "path": "string",
        "chunkIndex": "number",
        "excerpt": "string"
      }
    ],
    "createdAt": "string (ISO date)"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "string"
}
```

### GET `/api/ask?projectId={projectId}`

Get Q&A history for a specific project.

**Query Parameters:**
- `projectId` (required): The ID of the project

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "question": "string",
      "answer": "string",
      "citations": [...],
      "createdAt": "string (ISO date)"
    }
  ]
}
```

## Usage Examples

### Frontend Usage with TypeScript

```typescript
import { askQuestion, getQAHistory } from '@/lib/ask-api';

// Ask a question
const result = await askQuestion('project-id', 'How does authentication work?');
if (result.success) {
  console.log('Answer:', result.data.answer);
  console.log('Citations:', result.data.citations);
} else {
  console.error('Error:', result.error);
}

// Get history
const history = await getQAHistory('project-id');
if (history.success) {
  console.log('Q&A History:', history.data);
}
```

### Using with React Hook

```typescript
import { useAskQuestion } from '@/lib/ask-api';

function MyComponent({ projectId }: { projectId: string }) {
  const { ask, isLoading, error } = useAskQuestion();

  const handleSubmit = async (question: string) => {
    const result = await ask(projectId, question);
    if (result) {
      console.log('Got answer:', result.answer);
    }
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {/* Your UI here */}
    </div>
  );
}
```

### Direct Fetch Usage

```javascript
// Ask a question
const response = await fetch('/api/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    projectId: 'your-project-id',
    question: 'Your question here'
  })
});

const result = await response.json();
console.log(result);

// Get history
const historyResponse = await fetch('/api/ask?projectId=your-project-id');
const history = await historyResponse.json();
console.log(history);
```

### Using with curl

```bash
# Ask a question
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "question": "How does the authentication system work?"
  }'

# Get Q&A history
curl "http://localhost:3000/api/ask?projectId=your-project-id"
```

## Authentication

The API requires authentication via Clerk. Make sure the user is logged in before making requests. The API will return a 401 status code if the user is not authenticated.

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (missing required fields)
- `401`: Unauthorized (not logged in)
- `404`: Not Found (project doesn't exist)
- `500`: Internal Server Error

## Integration with Components

You can use the provided `QAComponent` to quickly add Q&A functionality to any page:

```typescript
import QAComponent from '@/components/qa-component';

export default function ProjectPage({ projectId }: { projectId: string }) {
  return (
    <div>
      <h1>Project Details</h1>
      <QAComponent projectId={projectId} />
    </div>
  );
}
```

## File Structure

```
src/
├── app/
│   └── api/
│       └── ask/
│           └── route.ts          # Main API route
├── components/
│   └── qa-component.tsx          # React component for Q&A UI
├── lib/
│   └── ask-api.ts               # TypeScript client helpers
└── server/
    └── qa.ts                    # Core Q&A logic (existing)
```

## Environment Variables

Make sure these environment variables are set:

- `PINECONE_API_KEY`: For vector search
- `GEMINI_API_KEY`: For AI responses
- `DATABASE_URL`: For storing Q&A history

If these are not set, the API will return a helpful error message instead of failing silently.