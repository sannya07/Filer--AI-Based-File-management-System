# FILER AI

## Technical Requirements Document (TRD)

Version: 1.0

---

# 1. Introduction

## 1.1 Purpose

This document defines the technical implementation requirements for FILER AI.

The objective is to provide a development blueprint covering:

* System structure
* Frontend implementation
* Backend implementation
* Database design
* API specifications
* AI integration
* Cloud storage integration
* DSA implementation

---

# 2. Project Structure

```text
filer-ai/
│
├── client/
│
└── server/
```

---

# 3. Frontend Requirements

## 3.1 Technology Stack

* React
* Tailwind CSS
* React Router DOM
* Axios
* Context API

---

## 3.2 Frontend Folder Structure

```text
client/
│
├── public/
│
├── src/
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   ├── Navbar/
│   │   ├── SearchBar/
│   │   ├── UploadModal/
│   │   ├── AIReviewCard/
│   │   ├── FileCard/
│   │   └── CategoryTree/
│   │
│   ├── pages/
│   │   ├── Login/
│   │   ├── Signup/
│   │   ├── Dashboard/
│   │   ├── FileDetails/
│   │   ├── Categories/
│   │   └── SharedFile/
│   │
│   ├── context/
│   │
│   ├── hooks/
│   │
│   ├── services/
│   │
│   ├── utils/
│   │
│   └── routes/
│
└── package.json
```

---

# 4. Backend Requirements

## 4.1 Technology Stack

* Node.js
* Express.js
* MongoDB Atlas
* JWT
* bcrypt
* Cloudinary SDK

---

## 4.2 Backend Folder Structure

```text
server/
│
├── config/
│
├── controllers/
│
├── middleware/
│
├── models/
│
├── routes/
│
├── services/
│
├── utils/
│
├── uploads/
│
├── app.js
│
└── server.js
```

---

# 5. Authentication Requirements

## Registration

Required Fields:

```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

Validation:

* Unique email
* Password minimum 8 characters

---

## Login

Required Fields:

```json
{
  "email": "string",
  "password": "string"
}
```

Response:

```json
{
  "token": "jwt_token"
}
```

---

# 6. Database Requirements

## Users Collection

```json
{
  "_id": "",
  "name": "",
  "email": "",
  "password": "",
  "createdAt": ""
}
```

Indexes:

```text
email (unique)
```

---

## Files Collection

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
  "accessCount": 0,
  "lastAccessed": "",
  "uploadedAt": ""
}
```

Indexes:

```text
ownerId
hash
category
subcategory
tags
fileName
```

---

## Shares Collection

```json
{
  "_id": "",
  "fileId": "",
  "shareToken": "",
  "expiryDate": "",
  "viewOnly": true,
  "createdAt": ""
}
```

Indexes:

```text
shareToken
expiryDate
```

---

# 7. Upload Requirements

## Supported File Types

```text
PDF
DOCX
TXT
PPT
PPTX
CSV
ZIP
PNG
JPG
JPEG
```

---

## Upload Workflow

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
Review Screen
      ↓
Accept / Edit
      ↓
Cloudinary Upload
      ↓
Metadata Save
```

---

# 8. Duplicate Detection Requirements

## Algorithm

SHA-256

---

## Workflow

```text
File
 ↓
Generate Hash
 ↓
Compare Existing Hashes
```

If duplicate exists:

```text
Possible Duplicate Detected
```

Options:

* Upload Anyway
* Cancel Upload

---

# 9. AI Requirements

## AI Provider

OpenRouter

---

## Generated Outputs

### Summary

Example:

```text
AWS notes covering IAM,
EC2 and S3 fundamentals.
```

---

### Description

Example:

```text
Beginner-level AWS study notes.
```

---

### Tags

Example:

```text
aws
cloud
iam
ec2
```

---

### Category

Example:

```text
Study Material
```

---

### Confidence Score

Example:

```text
92%
```

---

### Reasoning

Example:

```text
Contains educational content
and technical notes.
```

---

# 10. Human Review Requirements

User can:

### Accept

Save all metadata.

---

### Edit

Modify:

* Summary
* Description
* Tags
* Category

---

### Reject

Discard upload.

No cloud storage should occur before approval.

---

# 11. Cloudinary Requirements

Store:

```text
Files
Images
Documents
Archives
```

Required Metadata:

```text
publicId
secureUrl
resourceType
```

---

# 12. Search Requirements

## Filename Search

Search field:

```text
fileName
```

---

## Tag Search

Search field:

```text
tags[]
```

---

## Category Search

Search field:

```text
category
subcategory
```

---

## Semantic Search (Nice To Have)

Search against:

```text
summary
description
tags
category
```

---

# 13. Trie Requirements

Purpose:

Autocomplete

---

Operations:

### Insert

```text
insert(filename)
```

### Search Prefix

```text
search(prefix)
```

### Suggestions

```text
getSuggestions(prefix)
```

---

Example

Input:

```text
re
```

Output:

```text
resume.pdf
research.docx
report.pdf
```

---

# 14. Category Tree Requirements

Structure:

```text
Root
│
├── Study Material
│     ├── AWS
│     ├── DBMS
│     └── OS
│
├── Projects
│     ├── MERN
│     └── Cloud
│
├── Certificates
├── Resumes
├── News
├── Personal
└── Others
```

---

Operations:

* Create Category
* Create Subcategory
* Rename
* Delete
* Move Files

---

# 15. Sharing Requirements

## Share Link Generation

Inputs:

```json
{
  "fileId": "",
  "expiryDate": "",
  "viewOnly": true
}
```

Output:

```text
filer.ai/share/abc123
```

---

## Expiry Validation

If expired:

```text
Link Expired
```

Access denied.

---

# 16. Ask Your File Requirements

Scope:

Single File Only

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
Relevant Chunks
      ↓
OpenRouter
      ↓
Answer
```

---

Requirements:

* Answer only from selected file
* No external knowledge
* Maximum context size configurable

---

# 17. API Specifications

## Authentication APIs

```http
POST /api/auth/register

POST /api/auth/login
```

---

## File APIs

```http
POST   /api/files/upload

GET    /api/files

GET    /api/files/:id

DELETE /api/files/:id
```

---

## Search APIs

```http
GET /api/search
```

---

## Category APIs

```http
POST   /api/categories

GET    /api/categories

PUT    /api/categories/:id

DELETE /api/categories/:id
```

---

## Share APIs

```http
POST /api/share

GET /api/share/:token
```

---

## AI APIs

```http
POST /api/ai/analyze

POST /api/ai/ask
```

---

# 18. Security Requirements

Authentication:

JWT

Password Security:

bcrypt

Protected Routes:

```text
Upload
Delete
Share
Ask Your File
Categories
```

---

# 19. Performance Requirements

Upload Response:

```text
< 5 seconds
```

excluding AI processing.

---

Search Response:

```text
< 1 second
```

for metadata search.

---

Autocomplete:

```text
< 200 ms
```

---

# 20. Development Phases

## Phase 1

Authentication

* Signup
* Login
* JWT

---

## Phase 2

File Management

* Upload
* Delete
* View
* Download

---

## Phase 3

AI Layer

* Summary
* Description
* Tags
* Category
* Review Screen

---

## Phase 4

Search

* Filename Search
* Trie Search
* Category Search

---

## Phase 5

Categories

* Tree Structure
* Subcategories

---

## Phase 6

Sharing

* Share Links
* Expiry Handling

---

## Phase 7

Ask Your File

* File Q&A
* Chunking
* Answer Generation

---

## Phase 8

Nice-To-Have Features

* Semantic Search
* Priority Queue

```

