# Google Sheets & Supabase Sync Integration Guide

This guide walks you step-by-step through connecting your Google Sheets to your Supabase database and the website frontend, tailored to your chapter's exact spreadsheets:
1. **Member Status** (`MemberStatus` tab)
2. **Calendar and Links** (`Calendar` and `Links` tabs)
3. **Finances** (`FinancesOverview` and `Budget` tabs)
4. **Alumni Management** (`AlumniOverview` tab)

---

## Table of Contents
1. [Core Integration Overview](#1-core-integration-overview)
2. [Sharing Sheets with the Service Account](#2-sharing-sheets-with-the-service-account)
3. [Connecting Your Spreadsheets](#3-connecting-your-spreadsheets)
   - [Sheet 1: Member Status](#sheet-1-member-status)
   - [Sheet 2: Calendar and Links](#sheet-2-calendar-and-links)
   - [Sheet 3: Finances (Future-Ready)](#sheet-3-finances-future-ready)
   - [Sheet 4: Alumni Management (Future-Ready)](#sheet-4-alumni-management-future-ready)
4. [How the Auto-Append Missing Members Works](#4-how-the-auto-append-missing-members-works)
5. [Setting Up Checkboxes in Google Sheets](#5-setting-up-checkboxes-in-google-sheets)
6. [Supabase Database Schemas (SQL)](#6-supabase-database-schemas-sql)
7. [Syncing from Frontend & API](#7-syncing-from-frontend--api)

---

## 1. Core Integration Overview

The system uses a declarative configuration registry in [`src/config/sheets.ts`](file:///c:/Users/blake/LocalFiles/Theta%20Tau/website/src/config/sheets.ts).

You can connect any spreadsheet in **two ways**:
- **Option A (Recommended)**: Set the spreadsheet URL or ID in [`.env.local`](file:///c:/Users/blake/LocalFiles/Theta%20Tau/website/.env.local) (and in your Vercel deployment settings).
- **Option B**: Directly paste the full Google Sheets link into `spreadsheetIdOrUrl` in [`src/config/sheets.ts`](file:///c:/Users/blake/LocalFiles/Theta%20Tau/website/src/config/sheets.ts).

---

## 2. Sharing Sheets with the Service Account

> [!IMPORTANT]
> **Every Google Sheet you want to connect MUST be shared with the Service Account email.**
> 
> **Service Account Email**:
> ```
> tt-website-members-portal@thetatauwebsite-496420.iam.gserviceaccount.com
> ```

1. Open each Google Sheet in your browser.
2. Click the green **Share** button in the top right.
3. Paste: `tt-website-members-portal@thetatauwebsite-496420.iam.gserviceaccount.com`
4. Choose permission level:
   - **Editor** for **Member Status** (required so the site can auto-append newly registered brothers to the bottom of the sheet).
   - **Viewer** or **Editor** for Calendar, Links, Finances, and Alumni.
5. Uncheck "Notify people" and click **Share**.

---

## 3. Connecting Your Spreadsheets

### Sheet 1: Member Status
- **Google Sheet Name**: Member Status
- **Tabs**:
  1. `MemberStatus` (Roster & Points)
     - **Headers in Row 1**:
       ```
       username | dues_paid | brotherhood_met | prof_dev_met | comm_service_met | concessions_done | attendance_points
       ```
     - **Sync Behavior**:
       - Google Sheet is the single source of truth.
       - When sync is clicked, all member statuses in Supabase `profiles` are updated to match the sheet.
       - **Automatic Missing Member Backfill**: If a brother signs up or exists in Supabase whose username is not yet in the Google Sheet, the sync engine automatically appends a new row at the bottom with:
         `username | FALSE | FALSE | FALSE | FALSE | FALSE | 0`

  2. `NewAccountIntake` (Prospective Member Invitations)
     - **Headers in Row 1**:
       ```
       wiscEmail
       ```
       *(or `wiscEmail` / `email`)*
     - **Workflow & Sync Behavior**:
       - Prospective members or administrators enter University of Wisconsin emails (e.g. `bucky@wisc.edu` or simply netIDs like `bucky`) into the `wiscEmail` column (row 2 downwards).
       - Clicking **"Sync New Account Intake"** in the Admin Member Portal:
         1. Pulls prospective emails from the `NewAccountIntake` tab.
         2. Automatically formats any netIDs missing `@wisc.edu`.
         3. Checks Supabase Auth and `profiles` to verify if the account is already registered or invited.
         4. Sends official Supabase invitation emails to new emails with a secure link to `/setup-profile`.
         5. Automatically **wipes only the rows of emails that were sent or already in use**. If an email cannot be sent (e.g. format typo, API error), its row is preserved in the sheet for inspection and retry.
         6. Displays a modal pop-up with the summary:
            `"# invites sent. # emails already in use."`
     - **Required Environment Variable**:
       - `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (and in Vercel project settings).

- **Connection Variable** in `.env.local`:
  ```bash
  GOOGLE_MEMBER_STATUS_SPREADSHEET_ID="YOUR_MEMBER_STATUS_SPREADSHEET_ID_OR_FULL_URL"
  ```

---

### Sheet 2: Calendar and Links
- **Google Sheet Name**: Calendar and Links
- **Tabs**:
  1. `Calendar`
     - **Headers in Row 1**:
       ```
       event_name | time | location | details
       ```
  2. `Links`
     - **Headers in Row 1**:
       ```
       label | url
       ```
- **Connection Variable** in `.env.local`:
  ```bash
  GOOGLE_CALENDAR_LINKS_SPREADSHEET_ID="YOUR_CALENDAR_LINKS_SPREADSHEET_ID_OR_FULL_URL"
  ```
- **Frontend Display**:
  - The Member Portal (`/members-only`) automatically reads and displays upcoming events and important links from these two tabs in real time.

---

### Sheet 3: Finances (Future-Ready)
- **Google Sheet Name**: Finances
- **Tabs**:
  1. `FinancesOverview`
     - **Headers in Row 1**:
       ```
       id | account_name | category | balance | notes
       ```
  2. `Budget`
     - **Headers in Row 1**:
       ```
       category | allocated_amount | spent_amount | remaining_amount | notes
       ```
- **Connection Variable** in `.env.local`:
  ```bash
  GOOGLE_FINANCES_SPREADSHEET_ID="YOUR_FINANCES_SPREADSHEET_ID_OR_FULL_URL"
  ```
- *Already pre-configured in `src/config/sheets.ts` with IDs `finances_overview` and `finances_budget`.*

---

### Sheet 4: Alumni Management (Future-Ready)
- **Google Sheet Name**: Alumni Management
- **Tab**: `AlumniOverview`
  - **Headers in Row 1**:
    ```
    email | full_name | grad_year | major | company | location | linkedin_url
    ```
- **Connection Variable** in `.env.local`:
  ```bash
  GOOGLE_ALUMNI_SPREADSHEET_ID="YOUR_ALUMNI_SPREADSHEET_ID_OR_FULL_URL"
  ```
- *Already pre-configured in `src/config/sheets.ts` with ID `alumni_overview`.*

---

## 4. How the Auto-Append Missing Members Works

When an E-board member clicks **Sync Member Roster** (or runs `syncSheetAction('roster_status')`):
1. The sync engine reads all existing usernames in the `MemberStatus` Google Sheet.
2. It queries Supabase `profiles` for all registered chapter members.
3. If any username exists in Supabase that is not in the Google Sheet:
   - It appends a new row to the bottom of the Google Sheet:
     `username | FALSE | FALSE | FALSE | FALSE | FALSE | 0`
   - Using Google Sheets API `USER_ENTERED` mode, the values are written as native booleans and integers.
   - If columns B:F are formatted as checkboxes, the cells immediately appear as clean unchecked checkboxes!
4. The engine then updates all Supabase profiles with the latest sheet data.
5. The UI shows: `Synced 45 rows & added 2 new member(s) to Sheet`.

---

## 5. Setting Up Checkboxes in Google Sheets

To format columns B through F as checkboxes in your `MemberStatus` sheet:
1. Open your **Member Status** Google Sheet.
2. Click on column header **B** and drag across to column header **F** (selecting columns B:F).
3. In the top Google Sheets menu, click **Insert** &rarr; **Checkbox**.
4. That's it! Any row with `TRUE` will appear as a checked box, and any row with `FALSE` (including new automatically appended members) will appear as an unchecked box.

---

## 6. Supabase Database Schemas (SQL)

If you have not created the database tables yet, run the following SQL queries in the **Supabase SQL Editor**:

### Profiles (Member Status) Table:
```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dues_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS brotherhood_met boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS prof_dev_met boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS comm_service_met boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS concessions_done boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS attendance_points integer DEFAULT 0;
```

### Calendar Events Table (Optional if caching in Supabase):
```sql
CREATE TABLE IF NOT EXISTS public.events (
  id bigserial PRIMARY KEY,
  title text UNIQUE NOT NULL,
  date text,
  location text,
  details text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Important Links Table (Optional if caching in Supabase):
```sql
CREATE TABLE IF NOT EXISTS public.links (
  id bigserial PRIMARY KEY,
  title text UNIQUE NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Finances Tables (When you are ready):
```sql
CREATE TABLE IF NOT EXISTS public.finances_overview (
  id text PRIMARY KEY,
  account_name text NOT NULL,
  category text,
  balance numeric DEFAULT 0,
  notes text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.finances_budget (
  category text PRIMARY KEY,
  allocated_amount numeric DEFAULT 0,
  spent_amount numeric DEFAULT 0,
  remaining_amount numeric DEFAULT 0,
  notes text,
  updated_at timestamptz DEFAULT now()
);
```

### Alumni Table (When you are ready):
```sql
CREATE TABLE IF NOT EXISTS public.alumni (
  email text PRIMARY KEY,
  full_name text NOT NULL,
  grad_year integer,
  major text,
  company text,
  location text,
  linkedin_url text,
  updated_at timestamptz DEFAULT now()
);
```

---

## 7. Syncing from Frontend & API

### From the Frontend Portal:
1. Log in to the website with an E-board or Admin account.
2. Go to `/members-only`.
3. Under **E-Board Tools**, click **Sync Member Roster** for 1-click sync.
4. Click **More Sheets** to sync Calendar, Links, Finances, or click **Sync All Integrations**.

### Setting Up Environment Variables in `.env.local` & Vercel:
```bash
# Google Cloud Service Account Credentials
GOOGLE_CLIENT_EMAIL="tt-website-members-portal@thetatauwebsite-496420.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Specific Spreadsheet IDs / Links (paste full URL or clean ID)
GOOGLE_MEMBER_STATUS_SPREADSHEET_ID="YOUR_MEMBER_STATUS_SPREADSHEET_LINK"
GOOGLE_CALENDAR_LINKS_SPREADSHEET_ID="YOUR_CALENDAR_AND_LINKS_SPREADSHEET_LINK"
GOOGLE_FINANCES_SPREADSHEET_ID="YOUR_FINANCES_SPREADSHEET_LINK"
GOOGLE_ALUMNI_SPREADSHEET_ID="YOUR_ALUMNI_SPREADSHEET_LINK"

# Fallback default ID
GOOGLE_SPREADSHEET_ID="YOUR_MEMBER_STATUS_SPREADSHEET_LINK"
```
