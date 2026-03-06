# WhatsApp Integration API Routes

This directory contains all API routes for WhatsApp integration in Desi Connect USA using Twilio as the messaging provider.

## Routes

### 1. **POST /api/whatsapp/webhook**
Twilio webhook handler for receiving incoming WhatsApp messages.

**File:** `webhook/route.ts`

**Functionality:**
- Receives incoming WhatsApp messages from Twilio webhook
- Validates message structure (from, body required)
- Classifies user intent using `classifyIntent()` from WhatsApp library
- Routes messages based on intent using `routeMessage()`
- Manages multi-step conversation flows and sessions
- Handles collecting data across multiple message exchanges
- Returns TwiML-formatted XML response for Twilio

**Request:** FormData from Twilio containing:
- `From`: Sender phone number (whatsapp:+14695551234)
- `To`: Recipient phone number
- `Body`: Message text
- `MessageSid`: Unique message identifier
- `NumMedia`: Number of media attachments

**Response:** TwiML XML response with bot message

**Error Handling:**
- 400: Missing required fields
- 500: Processing error with fallback response

---

### 2. **POST /api/whatsapp/send**
Send outbound WhatsApp messages to users.

**File:** `send/route.ts`

**Functionality:**
- Sends WhatsApp messages to phone numbers
- Validates phone number format (E.164 standard)
- Validates message length (max 4096 characters)
- Classifies message for Meta 2026 compliance
- In development: mocks Twilio response (no actual sending)
- In production: integrates with Twilio API to send messages

**Request Body:**
```json
{
  "to": "+14695551234",
  "body": "Your message text",
  "template_type": "optional_template_type"
}
```

**Response:**
```json
{
  "success": true,
  "message_sid": "SM...",
  "to": "+14695551234",
  "body": "Your message text",
  "classification": "utility|marketing|authentication",
  "estimated_cost_usd": 0.0043
}
```

**Validation:**
- Phone number must be E.164 format (+1 prefix recommended)
- Message body required and max 4096 characters

**Environment Variables (Production):**
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_PHONE_NUMBER`

---

### 3. **GET /api/whatsapp/sessions**
List and monitor active WhatsApp conversation sessions.

**File:** `sessions/route.ts`

**Functionality:**
- Returns statistics on all active sessions
- Shows session breakdown by intent type
- Shows session breakdown by conversation step
- Displays session age information
- Useful for admin dashboard and monitoring

**Query Parameters:** None

**Response:**
```json
{
  "total_active_sessions": 42,
  "sessions_by_intent": {
    "search_businesses": 15,
    "job_search": 12,
    "submit_business": 8,
    "daily_digest": 7
  },
  "sessions_by_step": {
    "idle": 20,
    "collecting_business_name": 12,
    "collecting_business_address": 10
  },
  "total_collected_data_fields": 125,
  "oldest_session_age_minutes": 28,
  "average_session_age_minutes": 14
}
```

---

### 4. **GET /api/whatsapp/templates**
List all available pre-approved WhatsApp message templates.

**File:** `templates/route.ts`

**Functionality:**
- Returns all pre-approved templates for Meta compliance
- Each template includes type, SID, and content variables
- Templates are pre-registered with Meta Business Platform
- Used for sending messages outside 24-hour session window

**Query Parameters:** None

**Response:**
```json
{
  "templates": [
    {
      "template_type": "welcome",
      "template_sid": "welcome_msg_123",
      "content_variables": {
        "user_name": "Community Member",
        "feature_list": "businesses, jobs, deals, events"
      }
    },
    {
      "template_type": "daily_digest",
      "template_sid": "daily_digest_123",
      "content_variables": {
        "date": "3/4/2026",
        "news_count": "3",
        "deals_count": "5",
        "jobs_count": "2"
      }
    }
  ],
  "total": 5
}
```

**Available Template Types:**
- `welcome` - Greeting and feature introduction
- `daily_digest` - Daily community updates
- `immigration_alert` - Immigration news updates
- `deal_notification` - Local deal announcements
- `event_reminder` - Event notifications

---

## Conversation Flow

### 1. User sends message to WhatsApp bot number
### 2. Twilio webhook triggers `/api/whatsapp/webhook` POST
### 3. Bot classifies intent (search_businesses, job_search, etc.)
### 4. Bot checks for active session:
   - If collecting data: prompt for next field
   - Otherwise: respond with relevant information
### 5. For multi-step flows (like business submission):
   - Create session
   - Ask for field 1 → user responds
   - Ask for field 2 → user responds
   - Confirm and submit

---

## Multi-Step Conversation Steps

Session steps track progress through multi-step flows:

**Business Submission:**
- `collecting_business_name` → `collecting_business_address` → `collecting_business_category` → `collecting_business_phone` → `collecting_business_hours` → `confirming_business_submission`

**Deal Posting:**
- `collecting_deal_business` → `collecting_deal_discount` → `collecting_deal_expiry` → `collecting_deal_terms` → `confirming_deal_submission`

**Rating Submission:**
- `collecting_rating_consultancy` → `collecting_rating_stars` → `collecting_rating_text` → `confirming_rating_submission`

---

## Imports and Dependencies

All routes import from:
- `next/server` - NextRequest, NextResponse
- `@desi-connect/shared` - Types (BotIntent, IncomingWhatsAppMessage, etc.)
- `@/lib/whatsapp` - Bot logic (classifyIntent, routeMessage, buildResponse, etc.)

---

## Development vs Production

### Development Mode (`NODE_ENV === 'development'`)
- Webhook route processes messages and returns responses
- Send route mocks Twilio (no actual SMS sent)
- Console logs show what would be sent

### Production Mode
- All routes use real Twilio API integration
- Messages are actually sent via Twilio
- Requires valid Twilio credentials in environment variables

---

## Meta 2026 Compliance

Messages are classified into three categories:

1. **Utility** ($0.0043/msg)
   - Account/transactional messages
   - No template required
   - Sent anytime (no session window)

2. **Marketing** ($0.0066/msg)
   - Promotional/marketing messages
   - Template required
   - Only sent within 24-hour session window

3. **Authentication** ($0.0043/msg)
   - OTP and verification codes
   - No template required
   - Sent anytime

---

## Error Handling

All routes include:
- Input validation
- Error logging to console
- User-friendly error messages
- Appropriate HTTP status codes
- Fallback responses where applicable
