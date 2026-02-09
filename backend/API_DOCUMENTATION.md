# Lune Platform API Documentation

## Base URL
```
Development: http://localhost:3001/api
Production: https://api.lune.platform/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Token Refresh
Access tokens expire after 1 hour. Use the refresh token to get a new access token.

---

## Authentication Endpoints

### Sign Up
Create a new user account.

**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "role": "candidate" // or "employer"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "candidate"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 3600
  }
}
```

**Errors:**
- `400` - Invalid input (missing fields, invalid email, weak password)
- `409` - Email already exists

---

### Login
Authenticate with email and password.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "candidate"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 3600
  }
}
```

**Errors:**
- `400` - Missing credentials
- `401` - Invalid credentials

---

### Logout
Invalidate the current session.

**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### Refresh Token
Get a new access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 3600
  }
}
```

**Errors:**
- `400` - Missing refresh token
- `401` - Invalid or expired refresh token

---

### Get Current User
Get authenticated user information.

**Endpoint:** `GET /auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "candidate"
  }
}
```

---

## Assessment Endpoints

### Generate Assessment
Generate a new AI-powered assessment for a skill.

**Endpoint:** `POST /assessments/generate`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "skillName": "React",
  "difficulty": "Mid-Level" // "Beginner", "Mid-Level", or "Advanced"
}
```

**Response:** `200 OK`
```json
{
  "assessment": {
    "id": "uuid",
    "skillId": "uuid",
    "title": "React Mid-Level Assessment",
    "description": "Test your React knowledge...",
    "difficulty": "Mid-Level",
    "starterCode": "import React from 'react';\n\nfunction App() {\n  // Your code here\n}",
    "theoryQuestions": [
      {
        "question": "What is the purpose of useEffect?",
        "options": [
          "To manage side effects",
          "To create components",
          "To style components",
          "To handle routing"
        ],
        "correctAnswer": 0
      }
    ]
  }
}
```

**Errors:**
- `400` - Invalid skill or difficulty
- `401` - Unauthorized
- `500` - AI generation failed

---

### Submit Assessment
Submit assessment answers for evaluation.

**Endpoint:** `POST /assessments/submit`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "assessmentId": "uuid",
  "codeSubmission": "import React from 'react';\n\nfunction App() {\n  return <div>Hello World</div>;\n}",
  "theoryAnswers": {
    "0": 0,
    "1": 2
  },
  "proctoringMetrics": {
    "tabSwitches": 0,
    "copyPasteEvents": 1,
    "suspiciousActivity": []
  }
}
```

**Response:** `200 OK`
```json
{
  "result": {
    "submissionId": "uuid",
    "score": 85,
    "passed": true,
    "feedback": "Excellent work! Your code demonstrates...",
    "cheatingDetected": false,
    "cheatingReason": null
  }
}
```

**Errors:**
- `400` - Invalid submission data
- `401` - Unauthorized
- `404` - Assessment not found

---

### Get Assessment History
Get user's assessment submission history.

**Endpoint:** `GET /assessments/history`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "assessments": [
    {
      "id": "uuid",
      "skill": "React",
      "difficulty": "Mid-Level",
      "score": 85,
      "passed": true,
      "submittedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Certificate Endpoints

### Mint Certificate
Mint a blockchain certificate for a passed assessment.

**Endpoint:** `POST /certificates/mint`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "submissionId": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "certificate": {
    "id": "uuid",
    "blockchainHash": "0x1234567890abcdef...",
    "skill": "React",
    "score": 85,
    "difficulty": "Mid-Level",
    "issuedAt": "2024-01-15T10:30:00Z",
    "explorerUrl": "https://explorer.pwrlabs.io/tx/0x1234..."
  }
}
```

**Errors:**
- `400` - Invalid submission or assessment not passed
- `401` - Unauthorized
- `500` - Blockchain minting failed

---

### Verify Certificate
Verify a certificate's authenticity on the blockchain.

**Endpoint:** `GET /certificates/verify/:hash`

**Response:** `200 OK`
```json
{
  "isValid": true,
  "certificate": {
    "candidateName": "John Doe",
    "skill": "React",
    "score": 85,
    "difficulty": "Mid-Level",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `404` - Certificate not found
- `500` - Blockchain verification failed

---

### Get User Certificates
Get all certificates for authenticated user.

**Endpoint:** `GET /certificates`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "certificates": [
    {
      "id": "uuid",
      "skill": "React",
      "score": 85,
      "difficulty": "Mid-Level",
      "blockchainHash": "0x1234...",
      "issuedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Job Endpoints

### Get Jobs
Get all job postings with optional AI matching for candidates.

**Endpoint:** `GET /jobs`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `match=true` - Enable AI matching (candidates only)

**Response:** `200 OK`
```json
{
  "jobs": [
    {
      "id": "uuid",
      "title": "Senior React Developer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "type": "Full-time",
      "salary": "$120k - $160k",
      "description": "We are looking for...",
      "requiredSkills": ["React", "TypeScript", "Node.js"],
      "matchScore": 85,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Create Job
Create a new job posting (employers only).

**Endpoint:** `POST /jobs`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Senior React Developer",
  "company": "Tech Corp",
  "location": "San Francisco, CA",
  "type": "Full-time",
  "salary": "$120k - $160k",
  "description": "We are looking for an experienced React developer...",
  "requiredSkills": ["React", "TypeScript", "Node.js"]
}
```

**Response:** `201 Created`
```json
{
  "job": {
    "id": "uuid",
    "title": "Senior React Developer",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "type": "Full-time",
    "salary": "$120k - $160k",
    "description": "We are looking for...",
    "requiredSkills": ["React", "TypeScript", "Node.js"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `400` - Invalid job data
- `401` - Unauthorized
- `403` - Not an employer

---

### Get Matched Candidates
Get AI-matched candidates for a job (employers only).

**Endpoint:** `GET /jobs/:jobId/candidates`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "candidates": [
    {
      "id": "uuid",
      "name": "John Doe",
      "title": "React Developer",
      "matchScore": 92,
      "skills": {
        "React": 85,
        "TypeScript": 78,
        "Node.js": 80
      },
      "certifications": ["cert-uuid-1", "cert-uuid-2"]
    }
  ]
}
```

---

## Mock Interview Endpoints

### Start Interview
Start a new mock interview session.

**Endpoint:** `POST /interviews/start`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "role": "Senior React Developer",
  "topic": "technical" // or "behavioral"
}
```

**Response:** `200 OK`
```json
{
  "interview": {
    "id": "uuid",
    "question": "Can you explain the difference between useMemo and useCallback?"
  }
}
```

---

### Submit Answer
Submit an answer and get AI feedback.

**Endpoint:** `POST /interviews/answer`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "question": "Can you explain the difference between useMemo and useCallback?",
  "answer": "useMemo is used to memoize values...",
  "role": "Senior React Developer",
  "topic": "technical"
}
```

**Response:** `200 OK`
```json
{
  "feedback": {
    "clarityScore": 85,
    "confidenceScore": 80,
    "relevanceScore": 90,
    "feedback": "Great explanation! You covered...",
    "improvedAnswer": "A more comprehensive answer would be...",
    "nextQuestion": "How would you optimize a React application?"
  }
}
```

---

## User Profile Endpoints

### Get Profile
Get user profile information.

**Endpoint:** `GET /users/:userId`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "profile": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "candidate",
    "candidateProfile": {
      "title": "React Developer",
      "location": "San Francisco, CA",
      "bio": "Passionate developer...",
      "yearsOfExperience": 3,
      "preferredWorkMode": "Remote",
      "videoIntroUrl": "https://storage.supabase.co/..."
    }
  }
}
```

---

### Update Profile
Update user profile information.

**Endpoint:** `PUT /users/:userId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Doe",
  "candidateProfile": {
    "title": "Senior React Developer",
    "location": "San Francisco, CA",
    "bio": "Experienced developer...",
    "yearsOfExperience": 5,
    "preferredWorkMode": "Hybrid"
  }
}
```

**Response:** `200 OK`
```json
{
  "profile": {
    "id": "uuid",
    "name": "John Doe",
    "candidateProfile": {
      "title": "Senior React Developer",
      "location": "San Francisco, CA",
      "bio": "Experienced developer...",
      "yearsOfExperience": 5,
      "preferredWorkMode": "Hybrid"
    }
  }
}
```

---

### Upload Video Introduction
Upload video introduction URL.

**Endpoint:** `POST /users/:userId/video`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "videoUrl": "https://storage.supabase.co/video-introductions/..."
}
```

**Response:** `200 OK`
```json
{
  "message": "Video uploaded successfully",
  "videoUrl": "https://storage.supabase.co/..."
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Authentication endpoints:** 5 requests per minute
- **Assessment generation:** 10 requests per hour
- **Other endpoints:** 100 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642262400
```

---

## Webhooks (Future)

Webhook support for real-time notifications:
- Certificate minted
- Assessment completed
- Job match found

---

## SDK Support

Official SDKs:
- JavaScript/TypeScript (coming soon)
- Python (coming soon)

---

## Support

For API support, contact: support@lune.platform
