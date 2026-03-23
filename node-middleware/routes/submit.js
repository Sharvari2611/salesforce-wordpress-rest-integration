const express = require('express');
const axios   = require('axios');
const router  = express.Router();

// ── Why a separate router file? ───────────────────────────────────────────────
// express.Router() creates a mini app that handles one group of routes
// All the Salesforce logic lives here, keeping server.js clean
// In a bigger project you'd have routes/submit.js, routes/properties.js etc.

// ── Step 1: Get OAuth token from Salesforce ───────────────────────────────────
// This function runs before every form submission
// Client Credentials Flow: we send Client ID + Secret, Salesforce returns a token
// The token is temporary (expires after a few hours) — so we get a fresh one each time
// WHY fresh each time? Simpler than storing and refreshing tokens. Fine for our use case.

async function getSalesforceToken() {
    // URLSearchParams builds the form-encoded body that OAuth expects
    // OAuth token endpoint does NOT accept JSON — it requires form encoding
    // This is why we use URLSearchParams and not just JSON.stringify()
  const params = new URLSearchParams();
    params.append('grant_type',    'client_credentials');
    params.append('client_id',     process.env.SF_CLIENT_ID);
    params.append('client_secret', process.env.SF_CLIENT_SECRET);

    const response = await axios.post(
        `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
        params
    );

    // Salesforce returns: access_token, instance_url, token_type, issued_at
    // instance_url is YOUR org's unique URL e.g. https://wise-narwhal-jsj16z.my.salesforce.com
    // We need instance_url because every Salesforce org has a different domain
    // access_token is the temporary key that proves we are who we say we are
    return {
        token:       response.data.access_token,
        instanceUrl: response.data.instance_url
    };
}

// ── Step 2: Handle POST from the HTML form ────────────────────────────────────
// router.post('/') means: when a POST hits /submit, run this
// async because both network calls (token + Salesforce) take time
// await pauses execution until each call completes — clean and readable

router.post('/', async (req, res) => {
    // Log what came in — really useful during demo to show the audience
    // the raw data travelling from the form to the middleware
    console.log('\n📨 New application received:');
    console.log(JSON.stringify(req.body, null, 2));

    try {
        // ── Get token ─────────────────────────────────────────────────────────
        console.log('\n🔑 Getting Salesforce token...');
        const { token, instanceUrl } = await getSalesforceToken();
        console.log(`✅ Token obtained from: ${instanceUrl}`);

        // ── Call Apex REST class ──────────────────────────────────────────────
        // instanceUrl   = your org URL  e.g. https://wise-narwhal-jsj16z.my.salesforce.com
        // /services/apexrest/ = Salesforce's path for all custom REST classes
        // /housingApplication/ = the urlMapping in your @RestResource annotation
        // The Authorization header is HOW Salesforce knows this call is trusted
        // Bearer + token = "I have a valid token, please trust me"
        console.log('\n🚀 Sending data to Salesforce...');
        const sfResponse = await axios.post(
            `${instanceUrl}/services/apexrest/housingApplication/`,
            req.body,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type':  'application/json'
                }
            }
        );

        console.log('\n✅ Salesforce created records:');
        console.log(JSON.stringify(sfResponse.data, null, 2));

        // Send Salesforce's response back to the HTML form
        // This triggers the success message the applicant sees
        res.json(sfResponse.data);

    } catch (error) {
        // Detailed logging for YOU to debug
        console.error('\n❌ Error details:');
        console.error(error.response?.data || error.message);

        // Clean message for the FORM — never expose raw errors to users
        // Raw errors can leak credential details or server information
        res.status(500).json({
            status:  'error',
            message: 'Something went wrong submitting your application. Please try again.'
        });
    }
});

module.exports = router;