# Community Connect Foundation — Salesforce Metadata

This folder contains all Salesforce metadata for the demo project.  
It creates **3 custom objects** and **1 Apex REST class** in one deploy command.

## Objects Created

| Object | Label | Purpose |
|---|---|---|
| `Applicant__c` | Applicant | Person applying for housing (Auto Number: APP-0001) |
| `Property__c` | Property | Housing property available for applicants |
| `Application__c` | Application | Links one Applicant to one Property (Auto Number: REF-0001) |

## Prerequisites

- Salesforce CLI installed: `sf --version`
- Authenticated to your Dev org (see step 1 below)

## Deploy in 3 Steps

### Step 1 — Authenticate to your Salesforce org

```bash
sf org login web --alias my-dev-org
```

This opens a browser. Log in to your Developer Edition org. Come back to the terminal when done.

### Step 2 — Navigate to this folder

```bash
cd salesforce-app
```

### Step 3 — Deploy everything

```bash
sf project deploy start --target-org my-dev-org
```

That's it. Salesforce CLI will create all 3 objects, all fields, and the Apex class.

## After Deploying

Add 3–4 sample **Property records** manually so the HTML form dropdown has options:

1. Go to App Launcher → search "Properties" → New
2. Add records like: Riverside House, Central Lodge, Parkview Flats

## Verify the Deploy

Check Setup → Object Manager — you should see:
- ✅ Applicant
- ✅ Property  
- ✅ Application

And Setup → Apex Classes — you should see:
- ✅ ApplicationFormHandler

## Object Relationship

```
Property__c (existing)
    ↑ lookup
Application__c  ←→  links one applicant to one property
    ↓ lookup
Applicant__c (created by form submission)
```

When the HTML form is submitted, the Apex class creates:
1. One `Applicant__c` record (the person)
2. One `Application__c` record (links them to their chosen property)
