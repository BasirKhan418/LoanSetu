# LoanSetu Mobile App - Architecture Diagrams

## 1. Offline Loan Loading Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    fetchLoans() Entry Point                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Check Network Status (NetInfo)                  │
│         isConnected && isInternetReachable?                  │
└──────────┬────────────────────────────────┬─────────────────┘
           │                                │
     YES   │                                │  NO
           ▼                                ▼
┌──────────────────────┐          ┌─────────────────────────┐
│   Online Flow        │          │   Offline Flow          │
├──────────────────────┤          ├─────────────────────────┤
│ 1. Fetch from API    │          │ 1. Load from SQLite     │
│    getUserLoans()    │          │    SELECT * FROM loans  │
│                      │          │                         │
│ 2. Display in UI     │          │ 2. Transform to Loan[]  │
│    setLoans(data)    │          │                         │
│                      │          │ 3. Display in UI        │
│ 3. Cache to SQLite   │          │    setLoans(cached)     │
│    cacheLoansInSQLite│          │                         │
│    ├─ Check existing │          └─────────────────────────┘
│    ├─ UPDATE or      │
│    └─ INSERT         │
└──────────┬───────────┘
           │
           │  API Error?
           ▼
    ┌──────────────┐
    │   Fallback   │
    │ Load Cached  │
    └──────────────┘

```

## 2. SQLite Cache Management

```
┌─────────────────────────────────────────────────────────────┐
│                   cacheLoansInSQLite()                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  For each loan │
              └───────┬────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │  Check if loan exists:       │
        │  SELECT id FROM loans        │
        │  WHERE loanId = ?            │
        └──────────┬─────────┬─────────┘
                   │         │
              EXISTS│         │NEW
                   │         │
                   ▼         ▼
        ┌──────────────┐  ┌──────────────────┐
        │   UPDATE      │  │   INSERT         │
        ├──────────────┤  ├──────────────────┤
        │ - Name       │  │ - loanId (UNIQUE)│
        │ - Reference  │  │ - beneficiaryId  │
        │ - Scheme     │  │ - Name           │
        │ - Amount     │  │ - Reference      │
        │ - Date       │  │ - Scheme         │
        │ - updatedAt  │  │ - Amount         │
        └──────────────┘  │ - Date           │
                          │ - createdAt      │
                          │ - updatedAt      │
                          └──────────────────┘
                                   │
                                   ▼
                          ┌────────────────┐
                          │ UNIQUE checks  │
                          │ loanId prevents│
                          │ duplicates!    │
                          └────────────────┘
```

## 3. Submission Status Flow

```
┌─────────────────────────────────────────────────────────────┐
│              submission-status.tsx (List View)               │
│  Shows all submissions with badges and sync status           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │  User taps "View Status" button
                       │  with localUuid parameter
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           submission-tracking.tsx (Timeline View)            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Load Submission by UUID                                  │
│     ├─ submissionService.getSubmissionByUuid(uuid)          │
│     └─ Includes media files                                  │
│                                                              │
│  2. Generate Status Steps                                    │
│     ┌──────────────────────────────────────────┐            │
│     │  Step 1: Submitted ✓                     │            │
│     │  ├─ Icon: FileText                       │            │
│     │  ├─ Status: Completed (always)           │            │
│     │  └─ Timestamp: createdAt                 │            │
│     │                                          │            │
│     │  Step 2: In Review ⏱                     │            │
│     │  ├─ Icon: Clock                          │            │
│     │  ├─ Status: Active if SYNCED             │            │
│     │  └─ Timestamp: syncedAt                  │            │
│     │                                          │            │
│     │  Step 3: Approved ✓ / Failed ✗           │            │
│     │  ├─ Icon: CheckCircle / XCircle          │            │
│     │  ├─ Status: Completed if SYNCED          │            │
│     │  ├─ Timestamp: syncedAt (if failed)      │            │
│     │  └─ Notes: Error message (if failed)     │            │
│     └──────────────────────────────────────────┘            │
│                                                              │
│  3. Display Timeline                                         │
│     ├─ Color-coded icons (green/amber/gray)                 │
│     ├─ Connecting lines between steps                       │
│     ├─ Timestamps and notes for each step                   │
│     └─ Retry button for failed submissions                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

```

## 4. Timeline Visual States

```
┌─────────────────────────────────────────────────────────────┐
│                    PENDING Submission                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ● Submitted         ✓  Green (completed)                  │
│   │                      "Application submitted"            │
│   │                      2024-01-15 10:30 AM                │
│   │                                                          │
│   ● In Review         ⏱  Amber (active)                     │
│   │                      "Waiting for sync"                 │
│   │                                                          │
│   ○ Approved             Gray (pending)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SYNCED Submission                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ● Submitted         ✓  Green (completed)                  │
│   │                      "Application submitted"            │
│   │                      2024-01-15 10:30 AM                │
│   │                                                          │
│   ● In Review         ⏱  Green (completed)                  │
│   │                      "Under verification"               │
│   │                      2024-01-15 11:00 AM                │
│   │                                                          │
│   ● Approved          ✓  Green (completed)                  │
│                          "Verification complete"            │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    FAILED Submission                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ● Submitted         ✓  Green (completed)                  │
│   │                      "Application submitted"            │
│   │                      2024-01-15 10:30 AM                │
│   │                                                          │
│   ● In Review         ⏱  Gray (inactive)                    │
│   │                                                          │
│   ● Failed            ✗  Red (error)                        │
│                          "Error: Network timeout"           │
│                          2024-01-15 11:00 AM                │
│                                                              │
│   [Retry Sync Button]                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 5. Modal Transparency Comparison

```
BEFORE (50% opacity):
┌─────────────────────────────────────┐
│  Dashboard                           │
│  ┌─────────────────┐                │
│  │ █████████████████│  Heavy overlay │
│  │ █████████████████│  Hard to see   │
│  │ █████MODAL██████│  background     │
│  │ █████████████████│                │
│  │ █████████████████│                │
│  └─────────────────┘                │
│                                      │
└─────────────────────────────────────┘

AFTER (30% opacity):
┌─────────────────────────────────────┐
│  Dashboard                           │
│  ┌─────────────────┐                │
│  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│  Light overlay │
│  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│  Context       │
│  │ ▒▒▒▒▒MODAL▒▒▒▒▒│  visible       │
│  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│                │
│  │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│                │
│  └─────────────────┘                │
│  Background content more visible     │
└─────────────────────────────────────┘
```

## 6. Data Synchronization Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Sync Strategy                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐           ┌───────────────┐
│  API (Source)  │           │ SQLite (Cache)│
├───────────────┤           ├───────────────┤
│ - Authoritative│◄─────────►│ - Fast access │
│ - Always fresh │  Sync     │ - Offline     │
│ - Network req'd│           │ - Local       │
└───────────────┘           └───────────────┘
        │                           │
        │                           │
        ▼                           ▼
┌─────────────────────────────────────────┐
│           Display Layer (UI)             │
│  - Shows data from either source         │
│  - Automatic fallback on error           │
│  - Transparent to user                   │
└─────────────────────────────────────────┘

Sync Triggers:
├─ App launch (if online)
├─ Manual refresh
├─ Network state change (future)
└─ Background sync (future)

Cache Policy:
├─ Always write through on API fetch
├─ Upsert (no duplicates)
├─ Timestamp tracking (updatedAt)
└─ No automatic expiry (yet)
```

## 7. Database Schema (Loans Table)

```
┌─────────────────────────────────────────────────────────────┐
│                         loans                                │
├──────────────────┬──────────────┬────────────────────────────┤
│ Column           │ Type         │ Constraints                │
├──────────────────┼──────────────┼────────────────────────────┤
│ id               │ INTEGER      │ PRIMARY KEY AUTOINCREMENT  │
│ loanId           │ TEXT         │ UNIQUE, NOT NULL ◄─────────┤ Prevents
│ beneficiaryId    │ TEXT         │ NOT NULL                   │ duplicates!
│ beneficiaryName  │ TEXT         │                            │
│ loanReferenceId  │ TEXT         │                            │
│ schemeName       │ TEXT         │                            │
│ sanctionAmount   │ REAL         │                            │
│ sanctionDate     │ TEXT         │                            │
│ assetType        │ TEXT         │                            │
│ tenantId         │ TEXT         │                            │
│ submissionId     │ INTEGER      │ FOREIGN KEY ◄──────────────┤ Links to
│ createdAt        │ TEXT         │ NOT NULL                   │ submissions
│ updatedAt        │ TEXT         │ NOT NULL                   │
└──────────────────┴──────────────┴────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                         Indexes                              │
├─────────────────────────────────────────────────────────────┤
│ CREATE INDEX idx_loans_loanId ON loans(loanId);             │
│ CREATE INDEX idx_loans_beneficiaryId ON loans(beneficiaryId)│
└─────────────────────────────────────────────────────────────┘
```

## 8. Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     App Navigation                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│  Dashboard   │ │Applications │ │   Profile    │
│              │ │   (tabs)    │ │              │
└──────────────┘ └─────┬───────┘ └──────────────┘
        │              │
        │              │ Tap loan
        │              ▼
        │      ┌───────────────────┐
        │      │ Check verification │
        │      │     status         │
        │      └────┬──────────┬────┘
        │           │          │
        │    pending│          │approved/
        │    resubm│          │rejected
        │           ▼          ▼
        │   ┌─────────┐  ┌──────────────┐
        │   │Submission│  │submission-   │
        │   │ Screen   │  │status.tsx    │
        │   │(Form)    │  │(List View)   │
        │   └─────────┘  └──────┬────────┘
        │                       │
        │                       │ Tap "View Status"
        │                       ▼
        │               ┌────────────────┐
        │               │submission-     │
        │               │tracking.tsx    │
        │               │(Timeline View) │
        │               └────────────────┘
        │
        │ Tap action
        ▼
┌──────────────────┐
│QuickActionModal  │
│(Transparent 30%) │
└──────────────────┘
```

## Summary

These architectural diagrams show:

1. **Offline Flow**: Network detection → API or Cache → Display
2. **Cache Management**: Upsert logic with duplicate prevention
3. **Status Tracking**: Three-step timeline with visual feedback
4. **Timeline States**: Visual representation of PENDING/SYNCED/FAILED
5. **Modal Transparency**: Before/after comparison
6. **Sync Strategy**: Bidirectional data flow between API and SQLite
7. **Database Schema**: Loans table with constraints and indexes
8. **Component Hierarchy**: Navigation flow between screens

All implementations follow offline-first principles with automatic fallback and transparent user experience.
