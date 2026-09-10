# FILER AI

## User Flow Document (UFD)

Version: 1.2

---

# 1. Purpose

This document defines how users interact with FILER AI from authentication to file management, AI interaction, search, sharing, and retrieval.

---

# 2. High-Level User Journey

```text
Landing Page
      ↓
Signup/Login
      ↓
Dashboard
      ↓
Upload File
      ↓
AI Processing
      ↓
Human Review
      ↓
Cloudinary Storage
      ↓
Search / Ask / Share / Manage
```

---

# 3. Screen Inventory

## Public Screens

### Landing Page

Actions:

* Login
* Register
* View Features

---

### Login Page

Inputs:

* Email
* Password

Success:

```text
Dashboard
```

---

### Signup Page

Inputs:

* Name
* Email
* Password

Success:

```text
Dashboard
```

---

# 4. Dashboard Flow

Dashboard acts as the central workspace.

Displays:

* Recent Files
* Categories
* Search Bar
* Upload Button
* Storage Usage
* Shared Files

Actions:

```text
Upload File
Open File
Search
Create Category
Manage Files
```

---

# 5. Upload Flow

## Objective

Allow users to upload files while ensuring:

* Duplicate detection
* AI understanding
* User approval
* Optimized storage

---

## Upload Workflow

```text
User Selects File
       ↓
File Stored In Browser Memory
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
Accept / Edit / Reject
       ↓
Upload To Cloudinary
       ↓
Save Metadata In MongoDB
       ↓
Dashboard
```

---

## Duplicate Flow

```text
Hash Generated
       ↓
Hash Exists?
      /     \
    Yes      No
    ↓         ↓
Show       Continue
Warning    Upload
```

Options:

* Upload Anyway
* Cancel

---

# 6. AI Processing Flow

```text
Extracted Text
       ↓
Summary
       ↓
Description
       ↓
Tags
       ↓
Category Prediction
       ↓
Confidence Score
       ↓
Reasoning
```

Generated Data:

* Summary
* Description
* Tags
* Category
* Confidence
* Reasoning

---

# 7. Human-in-the-Loop Review Flow

Display:

* File Preview
* Summary
* Description
* Tags
* Suggested Category
* Confidence Score
* Reasoning

Actions:

### Accept

```text
Accept
 ↓
Cloudinary Upload
 ↓
Save Metadata
```

### Edit

```text
Edit
 ↓
Modify AI Output
 ↓
Save
```

### Reject

```text
Reject
 ↓
Discard File
```

---

# 8. Category Management Flow

Default Categories:

* Study Material
* Projects
* Resumes
* Certificates
* News
* Personal
* Others

User Actions:

* Create Category
* Rename Category
* Delete Category
* Move Files

Flow:

```text
Dashboard
 ↓
Categories
 ↓
Manage Category
```

---

# 9. File Detail Flow

When a user opens a file:

Display:

* File Preview
* Summary
* Description
* Tags
* Category
* Upload Date
* Share Status

Actions:

* Download
* Delete
* Share
* Ask Questions

---

# 10. Search Flow

Search Bar Available Globally

---

## Search Type 1: Filename Search

Example:

```text
resume
```

Results:

```text
resume.pdf
resume_final.pdf
```

---

## Search Type 2: Tag Search

Example:

```text
aws
```

Results:

```text
AWS Notes
AWS Project
AWS Certification
```

---

## Search Type 3: Category Search

Example:

```text
Certificates
```

Returns:

All files inside category.

---

## Search Type 4: Semantic Search

Example:

```text
cloud security notes
```

Returns:

Relevant files based on meaning rather than exact keywords.

---

# 11. Trie Autocomplete Flow

Used for filename suggestions.

```text
User Types:
re
      ↓
Trie Search
      ↓
Suggestions
```

Results:

```text
resume.pdf
research.docx
report.pdf
```

---

# 12. Ask Your File Flow

Purpose:

Allow users to interact with a specific document.

---

## Entry Point

```text
File Detail Page
```

---

## Workflow

```text
User Opens File
       ↓
Ask Question
       ↓
Chunk Retrieval
       ↓
OpenRouter LLM
       ↓
Answer Generation
```

Example:

Question:

```text
What is IAM?
```

Answer:

Generated only from the selected document.

Constraint:

No external knowledge allowed.

---

# 13. Share Flow

Users can generate secure sharing links.

---

## Workflow

```text
Select File
      ↓
Share
      ↓
Configure Link
      ↓
Generate URL
```

Inputs:

* Expiration Date
* View Only Permission

Output:

```text
filer.ai/share/abc123
```

---

## Expired Link Flow

```text
User Opens Link
      ↓
Expiry Check
      ↓
Expired?
```

If yes:

```text
Link Expired
```

Access denied.

---

# 14. Priority Queue Flow

Purpose:

Rank important files.

Factors:

* Recent Access
* User Priority
* Access Frequency

Flow:

```text
File Opened
      ↓
Priority Score Updated
      ↓
Priority Queue Updated
      ↓
Dashboard Ranking Updated
```

Dashboard Section:

```text
Important Files
```

---

# 15. Recent Files Flow

```text
File Opened
      ↓
Recent History Updated
      ↓
Dashboard Updated
```

Displays:

Last accessed files.

---

# 16. Delete File Flow

```text
Open File
     ↓
Delete
     ↓
Confirmation
     ↓
Cloudinary Delete
     ↓
MongoDB Delete
```

---

# 17. Download Flow

```text
Open File
      ↓
Download
      ↓
Cloudinary URL
      ↓
File Downloaded
```

---

# 18. Error Flows

## Upload Error

```text
Unsupported File Type
```

---

## AI Error

```text
AI Processing Failed

Retry
Continue Without AI
```

---

## Search Error

```text
No Results Found
```

---

## Share Error

```text
Link Expired
```

---

## Network Error

```text
Connection Lost
Please Try Again
```

---

# 19. Final User Journey

```text
Login
 ↓
Dashboard
 ↓
Upload File
 ↓
AI Analysis
 ↓
Review
 ↓
Cloudinary Upload
 ↓
Metadata Save
 ↓
Search
 ↓
Open File
 ↓
Ask Questions
 ↓
Share / Download / Manage
```
