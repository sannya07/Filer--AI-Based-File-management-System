# FILER AI

## System Architecture Document (SAD)

Version: 2.0

---

# 1. Purpose

This document defines the technical architecture of FILER AI, including:

* Frontend Architecture
* Backend Architecture
* Database Design
* Cloud Storage Integration
* AI Processing Layer
* Search Architecture
* DSA Integration
* Deployment Architecture

---

# 2. Architectural Principles

The architecture is designed around the following principles:

### AI-First Understanding

Files should be analyzed before permanent storage.

### Human-in-the-Loop

Users approve or modify AI-generated metadata before saving.

### Storage Efficiency

Only approved files are uploaded to cloud storage.

### Modularity

AI providers, storage providers, and services should be replaceable.

### Searchability

Files should be discoverable through multiple search mechanisms.

---

# 3. High-Level System Architecture

```text
┌─────────────────────┐
│      React App      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Express Backend   │
└──────────┬──────────┘
           │
 ┌─────────┼─────────┐
 ▼         ▼         ▼

MongoDB  Cloudinary  OpenRouter
 Atlas    Storage      AI

           │
           ▼

 Search Layer
(Trie + Metadata Search)

           │
           ▼

 Priority Engine
(Priority Queue)
```

---

# 4. Technology Stack

## Frontend

* React
* Tailwind CSS
* React Router
* Axios
* Context API

---

## Backend

* Node.js
* Express.js

---

## Database

* MongoDB Atlas

---

## Storage

* Cloudinary

---

## AI

* OpenRouter Free Models
* DeepSeek
* Qwen
* Gemini Free Models
* Mistral

---

## Authentication

* JWT
* bcrypt

---

# 5. Frontend Architecture

## Modules

### Authentication Module

Responsibilities:

* Login
* Signup
* Logout
* Protected Routes

---

### Dashboard Module

Responsibilities:

* Recent Files
* Important Files
* Categories
* Search
* Upload Entry

---

### Upload Module

Responsibilities:

* File Selection
* Duplicate Check
* AI Review

---

### Search Module

Responsibilities:

* Filename Search
* Tag Search
* Category Search
* Semantic Search
* Autocomplete

---

### File Management Module

Responsibilities:

* Preview
* Download
* Delete
* Share

---

### Ask Your File Module

Responsibilities:

* Ask Questions
* View Answers

---

# 6. Backend Architecture

Architecture Pattern:

```text
Routes
 ↓
Controllers
 ↓
Services
 ↓
Database Layer
```

---

## Routes Layer

Examples:

```text
/api/auth
/api/files
/api/search
/api/categories
/api/share
/api/ai
```

---

## Controllers Layer

Responsibilities:

* Request Validation
* Response Formatting
* Error Handling

---

## Services Layer

Contains business logic.

### Auth Service

* Register
* Login

### File Service

* Upload
* Delete
* Download

### AI Service

* Summary
* Description
* Tags
* Classification

### Search Service

* Search Logic
* Trie Operations

### Share Service

* Share Link Generation
* Expiration Validation

---

# 7. Upload Architecture

Approved Design:

```text
User Selects File
       ↓
Browser Memory
       ↓
Generate SHA-256 Hash
       ↓
Duplicate Check
       ↓
Text Extraction
       ↓
AI Processing
       ↓
AI Review Screen
       ↓
Accept / Edit
       ↓
Cloudinary Upload
       ↓
MongoDB Save
       ↓
Dashboard
```

---

## Browser Memory Strategy

Files remain in browser memory during AI processing.

Benefits:

* No temporary storage
* No orphan files
* Reduced cloud usage
* Simpler architecture

---

# 8. AI Architecture

Provider:

OpenRouter

---

## AI Pipeline

```text
Extracted Text
      ↓
Summary Generation
      ↓
Description Generation
      ↓
Tag Generation
      ↓
Category Prediction
      ↓
Confidence Score
      ↓
Reasoning Generation
```

---

## Human Approval Layer

Before storage:

User can:

* Accept
* Edit
* Reject

AI output is never automatically persisted.

---

# 9. Search Architecture

FILER AI supports four search mechanisms.

---

## Layer 1: Filename Search

Source:

MongoDB

Searches:

```text
fileName
```

---

## Layer 2: Tag Search

Source:

MongoDB

Searches:

```text
tags[]
```

---

## Layer 3: Category Search

Source:

MongoDB

Searches:

```text
category
subcategory
```

---

## Layer 4: Metadata-Based Semantic Search

Source:

```text
summary
description
tags
category
```

Workflow:

```text
User Query
      ↓
AI Intent Analysis
      ↓
Metadata Matching
      ↓
Rank Results
```

No vector database required.

No embedding storage required.

---

# 10. Trie Architecture

Purpose:

Autocomplete Suggestions

---

## Structure

```text
resume.pdf
research.pdf
report.pdf
```

---

## Workflow

```text
User Types
      ↓
Trie Search
      ↓
Suggestions
```

Example:

```text
re
```

Results:

```text
resume.pdf
research.pdf
report.pdf
```

---

## Complexity

Insertion:

```text
O(n)
```

Search:

```text
O(prefix length)
```

---

# 11. Tree Architecture

Purpose:

Category and Subcategory Management

---

## Structure

```text
Root
│
├── Study Material
│     ├── AWS
│     ├── DBMS
│     └── Operating Systems
│
├── Projects
│     ├── MERN
│     └── Cloud
│
├── Resumes
├── Certificates
├── News
├── Personal
└── Others
```

---

## User Capabilities

Users can:

* Create Category
* Create Subcategory
* Rename Category
* Rename Subcategory
* Delete Category
* Move Files

---

# 12. Hashing Architecture

Purpose:

Duplicate Detection

Algorithm:

SHA-256

---

## Workflow

```text
File
 ↓
Hash Generation
 ↓
Compare Existing Hashes
```

If Match Found:

```text
Possible Duplicate Detected
```

---

# 13. Priority Queue Architecture

Purpose:

Rank Important Files

---

## Ranking Factors

* Recent Access
* Access Frequency
* User-Pinned Files

---

## Workflow

```text
File Access
      ↓
Priority Updated
      ↓
Priority Queue
      ↓
Top Files
```

Used In:

```text
Dashboard
```

Section:

```text
Important Files
```

---

# 14. LRU Cache Architecture (Optional)

Purpose:

Reduce repeated database reads.

Stores:

* Frequently accessed metadata
* Recent search results

---

## Operations

```text
Get
Put
Evict
```

Complexity:

```text
O(1)
```

---

# 15. Ask Your File Architecture

Scope:

Single File Only

---

## Lazy Processing Design

Chunks are NOT stored during upload.

Processing happens only when needed.

---

## Workflow

```text
User Opens File
      ↓
Ask Question
      ↓
Fetch File
      ↓
Extract Text
      ↓
Chunk Text
      ↓
Select Relevant Chunks
      ↓
OpenRouter
      ↓
Answer
```

---

## Benefits

* Lower storage requirements
* Simpler architecture
* Reduced upload latency
* No chunk database needed

---

# 16. Cloudinary Architecture

Stores:

* Files
* Images
* Archives

Stored Metadata:

```text
publicId
secureUrl
resourceType
```

---

## Upload Trigger

Only after user approval.

---

# 17. MongoDB Architecture

## Collection: Users

```json
{
  "_id": "",
  "name": "",
  "email": "",
  "password": ""
}
```

---

## Collection: Files

```json
{
  "_id": "",
  "ownerId": "",
  "fileName": "",
  "fileType": "",
  "fileSize": "",
  "hash": "",
  "summary": "",
  "description": "",
  "tags": [],
  "category": "",
  "subcategory": "",
  "confidence": "",
  "reasoning": "",
  "cloudinaryUrl": "",
  "publicId": "",
  "uploadedAt": "",
  "accessCount": 0,
  "lastAccessed": ""
}
```

---

## Collection: Shares

```json
{
  "_id": "",
  "fileId": "",
  "shareToken": "",
  "expiryDate": "",
  "viewOnly": true
}
```

---

# 18. Security Architecture

Authentication:

JWT

Password Security:

bcrypt

Protected Endpoints:

* Upload
* Delete
* Share
* Ask Your File
* Category Management

---

# 19. Deployment Architecture

Frontend:

Vercel

Backend:

Render

Database:

MongoDB Atlas

Storage:

Cloudinary

AI:

OpenRouter

---

## Deployment Diagram

```text
User
 │
 ▼
Vercel (React)
 │
 ▼
Render (Express)
 │
 ├──── MongoDB Atlas
 │
 ├──── Cloudinary
 │
 └──── OpenRouter
```

---

# 20. Future Enhancements

Version 2:

* OCR for Images
* Cross-File RAG
* Multi-User Collaboration
* Team Workspaces
* Folder Sharing
* Vector Search
* Pinecone Integration
* Advanced AI Recommendations

```

This architecture is now consistent with all the decisions we've frozen:

- ✅ Browser-memory upload workflow
- ✅ Human-in-the-loop AI review
- ✅ Metadata-based semantic search
- ✅ Lazy "Ask Your File" processing
- ✅ Tree with categories + subcategories
- ✅ Hashing, Trie, Priority Queue, LRU Cache
- ✅ Completely free deployment stack (within free tiers)


```
