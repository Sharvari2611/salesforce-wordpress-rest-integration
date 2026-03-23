# Salesforce Housing Application Integration
### WordPress Form → Node.js Middleware → Salesforce REST API

> **Built for the Salesforce Developer Community Group**  
> This project was inspired by a real integration built for a nonprofit housing organisation. It demonstrates how to securely connect an external HTML form to Salesforce using a Node.js middleware and a custom Apex REST class — without any third-party tools.

---

## The Story Behind This Project

At a nonprofit housing organisation, applicants needed to submit housing applications through the organisation's WordPress website directly into Salesforce.

We tried:
- ❌ **Web-to-Lead** — limited to Lead object only, no custom fields
- ❌ **Experience Cloud** — too complex and expensive for the use case
- ❌ **Zapier** — budget constraints, and data privacy concerns

The solution was to build a lightweight **Node.js middleware** that sits between the WordPress form and Salesforce. The form never talks to Salesforce directly — the middleware handles authentication securely so credentials never reach the browser.

---

## Architecture

```
┌─────────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│   HTML Form     │        │   Node.js Middleware  │        │   Salesforce    │
│  (WordPress /   │──POST──▶   Express on :3000    │──────▶│   Apex REST     │
│   localhost)    │        │   OAuth + proxy       │        │   Class         │
└─────────────────┘        └──────────────────────┘        └─────────────────┘
                                      │                              │
                                      │ 1. Get OAuth token           │
                                      │──────────────────────────────▶
                                      │ 2. POST form data            │
                                      │──────────────────────────────▶
                                      │                    Creates:
                                      │                    - Applicant__c
                                      │                    - Application__c
                                      ◀──────────────────────────────│
                                      │ 3. Return reference number   │
```

### Why 3 layers?

| Layer | Purpose |
|---|---|
| HTML Form | Collects applicant data. Submits to Node — never directly to Salesforce |
| Node.js | Holds credentials securely. Gets OAuth token. Calls Salesforce REST class |
| Salesforce | Receives JSON. Creates Applicant + Application records in one transaction |

**The key security principle:** The Consumer Key and Consumer Secret never leave the Node server. The browser never sees them.

---

## Salesforce Data Model

```
Property__c (pre-existing records)
      ↑
      │ Lookup
      │
Application__c ──── Lookup ────▶ Applicant__c
  REF-0001                         APP-0001
  Status: Submitted                Status: New
  Household Size: 2                Email: jane@email.com
```

One applicant can apply for multiple properties — each creates a new Application__c record linked to the same Applicant__c.

---

## Project Structure

```
salesforce-wordpress-rest-integration/
│
├── salesforce-app/                    # Salesforce metadata (deploy via SF CLI)
│   ├── sfdx-project.json
│   └── force-app/main/default/
│       ├── classes/
│       │   ├── ApplicationFormHandler.cls
│       │   └── ApplicationFormHandler.cls-meta.xml
│       └── objects/
│           ├── Applicant__c/
│           ├── Property__c/
│           └── Application__c/
│
├── node-middleware/                   # Node.js Express server
│   ├── routes/
│   │   └── submit.js
│   ├── server.js
│   ├── package.json
│   └── .env                          # Never committed — credentials live here
│
├── html-form/
│   └── index.html                    # The volunteer application form
│
└── docs/
```

---

## Prerequisites

- Node.js v16 or higher
- Salesforce CLI
- A Salesforce Developer Edition org
- VS Code with Salesforce Extension Pack
- Live Server VS Code extension

---

## Setup Guide

### Step 1 — Clone the repo

```bash
git clone https://github.com/sharvari2611/salesforce-wordpress-rest-integration.git
cd salesforce-wordpress-rest-integration
```

### Step 2 — Deploy Salesforce metadata

```bash
cd salesforce-app
sf org login web --alias my-dev-org
sf project deploy start --target-org my-dev-org
```

Then add sample Property records manually via App Launcher → Properties → New.

### Step 3 — Configure Salesforce

**A. Create an External Client App**

Setup → App Manager → New External Client App

| Field | Value |
|---|---|
| App Name | Community Connect Integration |
| Callback URL | http://localhost:3000/callback |
| OAuth Scopes | api, refresh_token |
| Flow Enablement | Enable Client Credentials Flow |

Policies tab → Enable Client Credentials Flow → set Run As to your admin user → IP Relaxation → Relax IP restrictions.

**B. Add CORS entries**

Setup → CORS → New:
- http://localhost:3000
- http://localhost:5500

**C. Get your My Domain URL**

Setup → My Domain → copy the Current My Domain URL.
For Trailhead Developer Edition orgs it includes .trailblaze. in the domain.

### Step 4 — Configure Node.js middleware

```bash
cd ../node-middleware
npm install
```

Create a .env file:

```
SF_LOGIN_URL=https://YOUR-ORG.trailblaze.my.salesforce.com
SF_CLIENT_ID=your_consumer_key
SF_CLIENT_SECRET=your_consumer_secret
PORT=3000
```

### Step 5 — Update the HTML form with your Property IDs

Open html-form/index.html and replace the REPLACE_WITH_... placeholders in the property dropdown with your real Property record IDs from Salesforce.

To find a Property ID: App Launcher → Properties → click a record → copy the ID from the URL bar.

### Step 6 — Run and test

**Terminal 1 — Start Node:**
```bash
cd node-middleware
node server.js
```

**Terminal 2 — Open the form:**

Right-click html-form/index.html in VS Code → Open with Live Server

Fill in the form and click Submit. You should see a reference number like REF-0001.

Then go to Salesforce → App Launcher → Applicants to verify the record was created.

---

## Testing with Postman

POST http://localhost:3000/submit

Body (raw JSON):
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@test.com",
  "phone": "0412345678",
  "currentAddress": "10 Test Street Melbourne",
  "employment": "Employed",
  "gender": "Female",
  "propertyId": "YOUR_PROPERTY_ID_HERE",
  "householdSize": 2,
  "incomeRange": "$20k-$40k",
  "specialRequirements": "Ground floor preferred"
}
```

---

## Going to Production

The only change needed to go from demo to production is one line in the HTML form:

```javascript
// Development
const NODE_ENDPOINT = 'http://localhost:3000/submit';

// Production  
const NODE_ENDPOINT = 'https://your-app.onrender.com/submit';
```

Recommended free Node hosting: Render, Railway.

---

## Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| ENOTFOUND | Wrong My Domain URL in .env | Setup → My Domain → copy exact URL |
| invalid_grant | Client Credentials not configured | Set Run As user in External Client App Policies |
| CORS error | Origin not whitelisted | Setup → CORS → add localhost:5500 |
| 401 Unauthorized | Bad token | Check Consumer Key/Secret in .env |
| Reference: null | Auto Number queried before available | Fixed — Apex queries record after insert |
| Duplicate value | Email already exists | Email__c is unique — use a different email |

---

## Key Concepts Covered

- OAuth 2.0 Client Credentials Flow
- Apex REST — @RestResource and @HttpPost
- CORS — cross-origin request handling
- Salesforce Metadata API — deploying via SF CLI
- Environment variables — keeping secrets out of GitHub
- Error handling — developer logs vs user-facing messages

---

## Presented At

Salesforce Developer Community Group  
Presenter: Sharvari Doijode

---

## Licence

MIT — feel free to use, modify and share.