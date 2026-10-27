# SignalHouse JavaScript SDK Documentation

## Installation

```bash
npm install @signalhouse-sms/sdk
```

---

## Initialization

```javascript
import { SignalHouseSDK } from "@signalhouse-sms/sdk";

const signalHouse = new SignalHouseSDK({
  apiKey: "your-api-token",
  baseUrl: "https://v2.signalhouse.io",
});
```

---

## Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `apiKey` | string | Yes | -- | JWT token or service user token for authentication |
| `baseUrl` | string | Yes | -- | API base URL |

The SDK throws an error at initialization if `apiKey` or `baseUrl` is missing.

---

## Per-Request Token Override

Every SDK method accepts an `options` object that can include a `token` to override the default `apiKey` for that single request. This is useful for multi-tenant applications or user impersonation.

```javascript
// Initialize with a service account token
const signalHouse = new SignalHouseSDK({
  apiKey: "service-account-token",
  baseUrl: "https://v2.signalhouse.io",
});

// Make a request on behalf of a specific user
const response = await signalHouse.messages.getMessages({
  page: 1,
  limit: 10,
  options: { token: "user-specific-jwt-token" },
});
```

The per-request token takes precedence over the `apiKey` provided at initialization. The original `apiKey` remains unchanged for subsequent requests.

---

## Custom Headers

Pass additional headers to any SDK method via the `options.headers` property:

```javascript
const response = await signalHouse.numbers.getPhoneNumbers({
  page: 1,
  limit: 20,
  options: {
    headers: {
      "X-Request-Id": "req_abc123",
      "X-Custom-Header": "custom-value",
    },
  },
});
```

---

## Available Domains

The SDK organizes API endpoints into domain namespaces:

| Domain | Description |
|--------|-------------|
| `signalHouse.auth` | Login, session validation, password management |
| `signalHouse.billing` | Wallet balance, transactions, payment methods |
| `signalHouse.brands` | 10DLC brand registration and management |
| `signalHouse.campaigns` | 10DLC campaign creation and management |
| `signalHouse.groups` | Group management |
| `signalHouse.landings` | Landing page creation and management |
| `signalHouse.messages` | Send SMS/MMS/Group MMS, query messages, analytics |
| `signalHouse.notifications` | Notification management |
| `signalHouse.numbers` | Search, purchase, assign, transfer, release numbers |
| `signalHouse.shortlinks` | URL shortener management |
| `signalHouse.subgroups` | Subgroup CRUD operations |
| `signalHouse.subscriptions` | Subscription plan management |
| `signalHouse.templates` | Channel-generic message templates: drafts, versions, publish, validation, media |
| `signalHouse.users` | User management, service users |
| `signalHouse.webhooks` | Webhook registration and management |

---

## Domain Method Reference

### Auth

| Method | Parameters | Description |
|--------|-----------|-------------|
| `login` | `{ email, password }` | Login with email and password |
| `resetPassword` | `{ userId, newPassword }` | Reset a user's password |
| `getAuthHistory` | `{ groupId, userId, page, limit }` | Get token login history |
| `logoutAll` | `{}` | Log out all other users in the caller's active group |
| `getGroupId` | `{}` | Get the Group ID associated with your JWT (your active group) |

```javascript
// Login
const response = await signalHouse.auth.login({
  email: "user@example.com",
  password: "securePassword123",
});

// Reset password
await signalHouse.auth.resetPassword({
  userId: "507f1f77bcf86cd799439011",
  newPassword: "newSecurePassword456",
});

// Get auth history
const history = await signalHouse.auth.getAuthHistory({
  groupId: "G0000001",
  userId: "507f1f77bcf86cd799439011",
  page: 1,
  limit: 25,
});

// Log out all other users in the active group
const response = await signalHouse.auth.logoutAll();
if (response.success) {
  console.log(response.data.loggedOutCount);
}

// Get the Group ID associated with your JWT (needed for most other requests)
const group = await signalHouse.auth.getGroupId();
if (group.success) {
  console.log(group.data.groupId);
}
```

---

### Billing

| Method | Parameters | Description |
|--------|-----------|-------------|
| `getTransactionHistory` | `{ groupId, subgroupId, entryType, transactionType, startDate, endDate }` | Get transaction history with filters |
| `getWallet` | `{ groupId }` | Get wallet balance and settings |
| `updateWallet` | `{ groupId, autoRechargeEnabled, autoRechargeThreshold, autoRechargeToAmount, primaryPaymentMethodId, secondaryPaymentMethodId }` | Update wallet auto-recharge settings |
| `getPaymentMethods` | `{ groupId }` | List saved payment methods |
| `addFunds` | `{ groupId, amount, paymentMethodId }` | Add funds to wallet |
| `addPaymentMethod` | `{ groupId, paymentMethodId }` | Save a new payment method |
| `removePaymentMethod` | `{ groupId, paymentMethodId }` | Remove a saved payment method |
| `getInvoiceDetails` | `{ groupId, subgroupId, startDate, endDate }` | Get invoice/billing details |
| `getFees` | `{ groupId }` | Get fee schedule for the group |

```javascript
// Get wallet balance
const wallet = await signalHouse.billing.getWallet({
  groupId: "G0000001",
});

// Add funds
await signalHouse.billing.addFunds({
  groupId: "G0000001",
  amount: 5000000, // $5.00 in microdollars
  paymentMethodId: "pm_abc123",
});

// Update auto-recharge settings
await signalHouse.billing.updateWallet({
  groupId: "G0000001",
  autoRechargeEnabled: true,
  autoRechargeThreshold: 1000000, // $1.00 in microdollars
  autoRechargeToAmount: 10000000, // $10.00 in microdollars
  primaryPaymentMethodId: "pm_abc123",
});

// Get transaction history
const transactions = await signalHouse.billing.getTransactionHistory({
  groupId: "G0000001",
  startDate: "2026-01-01",
  endDate: "2026-03-14",
});
```

---

### Brands

| Method | Parameters | Description |
|--------|-----------|-------------|
| `getBrands` | `{ id, subgroupId, groupId, page, limit, status, registrationType, currentTollFreeCarrier }` | List brands with filters. With `subgroupId` or `groupId`, `currentTollFreeCarrier: true` returns only toll-free brands that a new toll-free campaign in that group can use. Staff roles listing every brand (no id/subgroupId/groupId) may also pass `search`, `sortBy`, `sortOrder`, `entityType`, `ein`, `email`, `referenceId`, `groupIds`, `createdFrom`, `createdTo`, `excludeDeleted`, and get `{ data, total, page, limit, totalPages }` back when paging |
| `createBrand` | `{ brandData }` | Create a new 10DLC brand |
| `getBusinessVerification` | `{ groupId, subgroupId }` | Get a group's business verification: whether its toll-free brands need one (`required`), its `status` (`NOT_STARTED`, `SUBMITTING`, `IN_REVIEW`, `VERIFIED` or `NEEDS_CHANGES`) and the submitted `details`. Some groups verify each subgroup's business separately: a platform whose subgroups are separate businesses, set up by Signal House. For those groups `subgroupId` is required, and the response is that subgroup's business verification, carrying `subgroupId`. For any other group `subgroupId` is optional, must be one of the group's subgroups, and is otherwise ignored. `subgroupId` is sent as a query parameter only when given. When `required` is true and `status` is `NOT_STARTED`, submit it before creating the first toll-free brand it covers |
| `submitBusinessVerification` | `{ groupId, subgroupId, details }` | Submit or update a group's business verification, or one subgroup's in a group that verifies each subgroup's business separately (`subgroupId` works as it does for `getBusinessVerification`, and the subgroup must also be active). Allowed when it is not started or needs changes. Review usually takes 1–2 business days; the toll-free brands it covers stay pending until it is verified. Returns 202 with the `getBusinessVerification` shape |
| `getTollFreeIsvAccount` | `{ groupId }` | Staff only. Get a group's toll-free ISV account: the group's own top-level account at the toll-free provider, used when its subgroups are separate businesses. Returns `{ groupId, accountSid, apiKeySid, primaryProfileSid, createdAt, updatedAt }`, or `null` when the group has none. The API key secret is never returned |
| `setTollFreeIsvAccount` | `{ groupId, accountSid, apiKeySid, apiKeySecret }` | Staff only (`signalhouse_admin`). Register a group's toll-free ISV account, or replace the API key of the account it already has. The toll-free provider checks the account and key before they are stored. Register it before the group has any toll-free records at the provider; after that, only the API key of the same account can be replaced. Returns the `getTollFreeIsvAccount` shape, never the secret |
| `updateBrand` | `{ brandId, brandData }` | Update brand information |
| `deleteBrand` | `{ brandId }` | Delete (soft) a brand |
| `transferBrand` | `{ subgroupId, brandIds }` | Transfer brands to a different subgroup |
| `getExternalVetting` | `{ brandId }` | Get external vetting info for a brand |
| `createExternalVetting` | `{ brandId }` | Submit brand for external vetting |
| `importExternalVetting` | `{ brandId, vettingProviderId, vettingId, vettingToken }` | Import an existing external vetting record (not billable) |
| `revetBrand` | `{ brandId }` | Resubmit brand for vetting |

```javascript
// List brands
const brands = await signalHouse.brands.getBrands({
  groupId: "G0000001",
  status: "VERIFIED",
  page: 1,
  limit: 25,
});

// Create a brand
const newBrand = await signalHouse.brands.createBrand({
  brandData: {
    entityType: "PRIVATE_PROFIT",
    displayName: "My Company",
    companyName: "My Company LLC",
    ein: "12-3456789",
    // ... additional brand fields
  },
});

// Transfer brands to another subgroup
await signalHouse.brands.transferBrand({
  subgroupId: "SG0000002",
  brandIds: ["brand_abc123", "brand_def456"],
});
```

---

### Campaigns

| Method | Parameters | Description |
|--------|-----------|-------------|
| `getCampaigns` | `{ id, brandId, subgroupId, groupId, page, limit, status }` | List campaigns with filters |
| `createCampaign` | `{ campaignData }` | Create a new 10DLC campaign |
| `updateCampaign` | `{ campaignId, campaignData }` | Update campaign details |
| `deleteCampaign` | `{ campaignId }` | Delete (soft) a campaign |

```javascript
// List campaigns
const campaigns = await signalHouse.campaigns.getCampaigns({
  brandId: "brand_abc123",
  status: "ACTIVE",
  page: 1,
  limit: 25,
});

// Create a campaign
const newCampaign = await signalHouse.campaigns.createCampaign({
  campaignData: {
    brandId: "brand_abc123",
    usecase: "MARKETING",
    description: "Promotional messages for product launches",
    sampleMessages: ["Check out our new product!", "Sale starts today!"],
    // ... additional campaign fields
  },
});

// Update a campaign
await signalHouse.campaigns.updateCampaign({
  campaignId: "cmp_def456",
  campaignData: {
    description: "Updated campaign description",
  },
});
```

---

### Groups

| Method | Parameters | Description |
|--------|-----------|-------------|
| `getGroup` | `{ id }` | Get group details by ID |
| `updateGroup` | `{ id, groupData }` | Update group information |

```javascript
// Get group details
const group = await signalHouse.groups.getGroup({
  id: "G0000001",
});

// Update group
await signalHouse.groups.updateGroup({
  id: "G0000001",
  groupData: {
    companyName: "Updated Company Name",
  },
});
```

---

### Landings

| Method | Parameters | Description |
|--------|-----------|-------------|
| `getLandings` | `{ landingId }` | Get a landing page by ID |
| `getLandingByBrandId` | `{ brandId }` | Get landing page associated with a brand |
| `createLanding` | `{ landingData, file }` | Create a landing page with optional image upload |
| `updateLanding` | `{ landingId, landingData, file }` | Update a landing page with optional image upload |
| `deleteLanding` | `{ landingId }` | Delete a landing page |

```javascript
// Get a landing page
const landing = await signalHouse.landings.getLandings({
  landingId: "land_abc123",
});

// Create a landing page with image
const newLanding = await signalHouse.landings.createLanding({
  landingData: {
    brandId: "brand_abc123",
    title: "My Landing Page",
    body: "Welcome to our page!",
  },
  file: imageFileObject, // File object from browser input
});

// Update a landing page
await signalHouse.landings.updateLanding({
  landingId: "land_abc123",
  landingData: {
    title: "Updated Title",
  },
});
```

---

### Messages

| Method | Parameters | Description |
|--------|-----------|-------------|
| `getMessages` | `{ id, campaignId, brandId, subgroupId, groupId, status, direction, messageType, carrier, sentimentLabel, startDate, endDate, sortField, sortOrder, page, limit }` | List messages with filters |
| `getAnalytics` | `{ groupId, subgroupId, brandId, campaignId, phoneNumber, carrier, startDate, endDate }` | Get aggregated message analytics |
| `sendSMS` | `{ senderPhoneNumber, recipientPhoneNumbers, messageBody, statusCallbackUrl, enableShortlink }` | Send an SMS message |
| `sendMMS` | `{ senderPhoneNumber, recipientPhoneNumbers, messageBody, mediaUrls, statusCallbackUrl, enableShortlink, enableCompression, images }` | Send an MMS message with media |
| `sendGroupMessage` | `{ senderPhoneNumber, recipientPhoneNumbers, messageBody, mediaUrls, statusCallbackUrl, enableShortlink, enableCompression, images }` | Send a group MMS message |

```javascript
// Send an SMS
const smsResponse = await signalHouse.messages.sendSMS({
  senderPhoneNumber: "11234567890",
  recipientPhoneNumbers: ["10987654321"],
  messageBody: "Hello from SignalHouse!",
  statusCallbackUrl: "https://example.com/webhook",
  enableShortlink: true,
});

// Send an MMS with media URLs
const mmsResponse = await signalHouse.messages.sendMMS({
  senderPhoneNumber: "11234567890",
  recipientPhoneNumbers: ["10987654321"],
  messageBody: "Check this out!",
  mediaUrls: ["https://example.com/image.jpg"],
  enableCompression: true,
});

// Send an MMS with file uploads
const mmsUpload = await signalHouse.messages.sendMMS({
  senderPhoneNumber: "11234567890",
  recipientPhoneNumbers: ["10987654321"],
  messageBody: "Photo attached!",
  images: [fileObject], // File objects from browser input
  enableCompression: true,
});

// Send a group MMS
const groupResponse = await signalHouse.messages.sendGroupMessage({
  senderPhoneNumber: "11234567890",
  recipientPhoneNumbers: ["10987654321", "10987654322", "10987654323"],
  messageBody: "Group message!",
  mediaUrls: ["https://example.com/image.jpg"],
});

// Get messages with filters
const messages = await signalHouse.messages.getMessages({
  status: "DELIVERED",
  direction: "OUTBOUND",
  startDate: "2026-01-01",
  endDate: "2026-03-14",
  page: 1,
  limit: 50,
});

// Get analytics
const analytics = await signalHouse.messages.getAnalytics({
  groupId: "G0000001",
  startDate: "2026-01-01",
  endDate: "2026-03-14",
});
```

---

### Templates

Channel-generic templates under `/template` (today the only channel is `"rcs"`). Each template has an immutable published version and at most one editable draft. Every call takes `groupId`. Writes apply directly (last write wins); 409 codes are `TEMPLATE_ARCHIVED`, `TEMPLATE_NAME_TAKEN`, `NO_DRAFT` (publish with no draft) and `DRAFT_CHANGED` (publish only: the draft changed while it was being published; publish again). Returns 404 while RCS is disabled for the environment. Bodies are the raw `RcsTemplateBody` (`channel: "rcs"`, `contentFormat: "rcs.blocks.v1"`, `content.blocks`, `variables`, `defaults`, `fallback`); the SDK never converts them. A `version` selector is a positive integer, `"draft"` or `"published"`; omitted means the published version, else the draft.

| Method | Parameters | Description |
|--------|-----------|-------------|
| `create` | `{ groupId, name, tag, body }` | Create a template with draft version 1; returns `{ head, version }` |
| `list` | `{ groupId, state, channel, tag, search, sortBy, sortOrder, page, limit }` | List templates; returns `{ data, total, page, limit }` |
| `get` | `{ templateId, groupId, version }` | Get a template head with one version |
| `update` | `{ templateId, groupId, name, tag, body }` | Rename, retag or replace the draft body; `tag: null` clears it, omitted leaves it unchanged |
| `publish` | `{ templateId, groupId }` | Publish the current draft; no draft returns 409 `NO_DRAFT`, a draft changed mid-publish returns 409 `DRAFT_CHANGED` (publish again), an incomplete draft returns 400 `TEMPLATE_INVALID` |
| `archive` | `{ templateId, groupId }` | Archive a template; returns the head |
| `versions` | `{ templateId, groupId, page, limit }` | List versions without bodies |
| `validate` | `{ templateId, groupId, body, version }` | Validate exactly one of an unsaved `body` or a stored `version`; writes nothing |
| `capabilities` | `{ groupId, channel, provider }` | Allowed blocks, actions, limits and upload constraints; `provider` (`infobip`/`sinch`) adds provider limits |
| `uploadMedia` | `{ groupId, file, fileName }` | Upload a `Blob`/`File` (multipart); returns `{ mediaId, url, ... }` |

```javascript
const body = {
  channel: "rcs",
  contentFormat: "rcs.blocks.v1",
  content: { blocks: [{ id: "intro", kind: "text", text: "Hi {{first_name}}" }] },
  variables: [{ key: "first_name", type: "text", required: true }],
};

const created = await signalHouse.templates.create({
  groupId: "G0000001",
  name: "Welcome",
  body,
  options: { idempotencyKey: crypto.randomUUID() },
});
const { head } = created.data;

// Check the draft before publishing
const check = await signalHouse.templates.validate({
  templateId: head.templateId,
  groupId: "G0000001",
  version: "draft",
});

await signalHouse.templates.publish({
  templateId: head.templateId,
  groupId: "G0000001",
});
```

---

### Notifications

| Method | Parameters | Description |
|--------|-----------|-------------|
| `getNotifications` | `{ id, groupId, page, limit, status, eventTypes }` | Get notifications with filters |
| `updateNotificationStatus` | `{ ids, status }` | Mark notifications as READ or UNREAD |
| `deleteNotification` | `{ id }` | Delete a notification |

```javascript
// Get notifications
const notifications = await signalHouse.notifications.getNotifications({
  groupId: "G0000001",
  status: "UNREAD",
  page: 1,
  limit: 25,
});

// Mark notifications as read
await signalHouse.notifications.updateNotificationStatus({
  ids: ["notif_abc123", "notif_def456"],
  status: "READ",
});

// Delete a notification
await signalHouse.notifications.deleteNotification({
  id: "notif_abc123",
});
```

---

### Numbers

| Method | Parameters | Description |
|--------|-----------|-------------|
| `getPhoneNumbers` | `{ phoneNumber, campaignId, brandId, subgroupId, groupId, currentTollFreeCarrier, page, limit }` | List your phone numbers with filters. With `subgroupId` or `groupId`, `currentTollFreeCarrier: true` returns only toll-free numbers that a new toll-free campaign in that group can use |
| `getAvailablePhoneNumbers` | `{ smsEnabled, mmsEnabled, voiceEnabled, country, state, npa, nxx, phoneNumber, limit, page }` | Search available numbers for purchase |
| `purchasePhoneNumber` | `{ phoneNumbers, subgroupId }` | Purchase one or more phone numbers |
| `updatePhoneNumber` | `{ phoneNumber, updateData }` | Update phone number details (e.g., friendly name) |
| `assignPhoneNumberToCampaign` | `{ campaignId, phoneNumbers }` | Assign numbers to a campaign |
| `unassignPhoneNumbersFromCampaigns` | `{ phoneNumbers }` | Unassign numbers from their campaigns |
| `deletePhoneNumbers` | `{ phoneNumbers }` | Release phone numbers |
| `transferPhoneNumbers` | `{ phoneNumbers, newSubgroupId }` | Transfer unassigned numbers between subgroups |
| `searchNpaNxx` | `{ country, state, city, npa, nxx }` | Search NPA/NXX area code lookup data |
| `lookupLocations` | `{ entries }` | Batch lookup city/state for NPA/NXX pairs |

```javascript
// Search available numbers
const available = await signalHouse.numbers.getAvailablePhoneNumbers({
  state: "CA",
  smsEnabled: true,
  mmsEnabled: true,
  limit: 10,
});

// Purchase numbers
const purchase = await signalHouse.numbers.purchasePhoneNumber({
  phoneNumbers: ["11234567890", "11234567891"],
  subgroupId: "SG0000001",
});

// List your numbers
const myNumbers = await signalHouse.numbers.getPhoneNumbers({
  groupId: "G0000001",
  page: 1,
  limit: 20,
});

// Assign numbers to a campaign
await signalHouse.numbers.assignPhoneNumberToCampaign({
  campaignId: "cmp_def456",
  phoneNumbers: ["11234567890"],
});

// Transfer numbers to another subgroup
await signalHouse.numbers.transferPhoneNumbers({
  phoneNumbers: ["11234567890"],
  newSubgroupId: "SG0000002",
});

// Release numbers
await signalHouse.numbers.deletePhoneNumbers({
  phoneNumbers: ["11234567890"],
});

// Search NPA/NXX data
const npaNxx = await signalHouse.numbers.searchNpaNxx({
  state: "CA",
  city: "Los Angeles",
});

// Batch lookup locations
const locations = await signalHouse.numbers.lookupLocations({
  entries: [
    { npa: "213", nxx: "555" },
    { npa: "310", nxx: "555" },
  ],
});
```

---

### Shortlinks

| Method | Parameters | Description |
|--------|-----------|-------------|
| `getShortlink` | `{ shortlinkId, messageId, phoneNumber, campaignId, brandId, subgroupId, groupId, page, limit }` | Get shortlink details and click data |
| `getShortlinkRedirect` | `{ shortlinkId }` | Get the redirect URL for a shortlink |

```javascript
// Get shortlink details
const shortlink = await signalHouse.shortlinks.getShortlink({
  shortlinkId: "sl_abc123",
});

// Get shortlink redirect URL
const redirect = await signalHouse.shortlinks.getShortlinkRedirect({
  shortlinkId: "sl_abc123",
});
```

---

### Subgroups

| Method | Parameters | Description |
|--------|-----------|-------------|
| `getSubgroups` | `{ id, groupId, page, limit }` | List subgroups with filters |
| `createSubgroup` | `{ subgroupData }` | Create a new subgroup |
| `updateSubgroup` | `{ id, updateData }` | Update subgroup details |
| `deleteSubgroup` | `{ id }` | Delete (deactivate) a subgroup |

```javascript
// List subgroups
const subgroups = await signalHouse.subgroups.getSubgroups({
  groupId: "G0000001",
  page: 1,
  limit: 25,
});

// Create a subgroup. carrierIdFamily/carrierIdRegion require signalhouse_api,
// signalhouse_admin, signalhouse_user, api, admin, developer, or billing role.
const newSubgroup = await signalHouse.subgroups.createSubgroup({
  subgroupData: {
    groupId: "G0000001",
    subgroupName: "Marketing Team",
    carrierIdFamily: "ClearSky",
    carrierIdRegion: "PRClaro",
  },
});

// Update a subgroup. carrierIdFamily/carrierIdRegion require signalhouse_api,
// signalhouse_admin, signalhouse_user, api, admin, developer, or billing role.
await signalHouse.subgroups.updateSubgroup({
  id: "SG0000001",
  updateData: {
    subgroupName: "Updated Marketing Team",
    carrierIdFamily: "Default",
    carrierIdRegion: null,
  },
});

// Delete a subgroup
await signalHouse.subgroups.deleteSubgroup({
  id: "SG0000001",
});
```

---

### Subscriptions

| Method | Parameters | Description |
|--------|-----------|-------------|
| `getSubscriptions` | `{ groupId, onlyActive }` | Get subscription history for a group |
| `subscribe` | `{ groupId, templateId }` | Subscribe a group to a plan |
| `unsubscribe` | `{ groupId }` | Unsubscribe a group from their current plan |

```javascript
// Get subscriptions
const subscriptions = await signalHouse.subscriptions.getSubscriptions({
  groupId: "G0000001",
  onlyActive: true,
});

// Subscribe to a plan
await signalHouse.subscriptions.subscribe({
  groupId: "G0000001",
  templateId: "tmpl_abc123",
});

// Unsubscribe
await signalHouse.subscriptions.unsubscribe({
  groupId: "G0000001",
});
```

---

### Users

| Method | Parameters | Description |
|--------|-----------|-------------|
| `getUsers` | `{ id, groupId, userType }` | List users with filters |
| `createUser` | `{ data }` | Create a new user |
| `createServiceUser` | `{ data }` | Create a service user (API key) |
| `updateUser` | `{ id, data }` | Update user information |
| `deleteUser` | `{ id }` | Delete (deactivate) a user |
| `getNotificationPreferences` | `{ id }` | Get user notification preferences |
| `updateNotificationPreferences` | `{ id, notificationPreferences }` | Update notification preferences |

```javascript
// List users
const users = await signalHouse.users.getUsers({
  groupId: "G0000001",
  userType: "standard",
});

// Create a user
const newUser = await signalHouse.users.createUser({
  data: {
    email: "newuser@example.com",
    firstName: "Jane",
    lastName: "Doe",
    role: "user",
  },
});

// Create a service user (API key)
const serviceUser = await signalHouse.users.createServiceUser({
  data: {
    groupId: "G0000001",
    name: "My API Integration",
    role: "api",
  },
});

// Create an API key that only works from your servers in the US.
// Requests from anywhere else get a 403 naming the caller's IP and country.
const lockedKey = await signalHouse.users.createServiceUser({
  data: {
    groupId: "G0000001",
    name: "Production backend",
    role: "api",
    allowedIps: ["203.0.113.0/24", "2001:db8::/32"],
    allowedCountries: ["US"],
  },
});

// Limit where a key can send. A send to any other country is rejected with a 403
// (details.code "DESTINATION_COUNTRY_NOT_ALLOWED") and nothing goes out.
const domesticKey = await signalHouse.users.createServiceUser({
  data: {
    groupId: "G0000001",
    name: "US and Canada only",
    role: "api",
    allowedDestinationCountries: ["US", "CA"],
  },
});

// Change or remove a key's restrictions ([] removes one). Needs a portal login
// with the admin or developer role: an API key cannot change its own restrictions.
await signalHouse.users.updateUser({
  id: "507f1f77bcf86cd799439022",
  data: { allowedIps: [], allowedCountries: ["US", "CA"], allowedDestinationCountries: ["US"] },
});

// Update a user
await signalHouse.users.updateUser({
  id: "507f1f77bcf86cd799439011",
  data: {
    firstName: "Updated Name",
  },
});

// Get notification preferences
const prefs = await signalHouse.users.getNotificationPreferences({
  id: "507f1f77bcf86cd799439011",
});

// Update notification preferences
await signalHouse.users.updateNotificationPreferences({
  id: "507f1f77bcf86cd799439011",
  notificationPreferences: {
    emailEnabled: true,
    smsEnabled: false,
  },
});
```

---

### Webhooks

| Method | Parameters | Description |
|--------|-----------|-------------|
| `getWebhooks` | `{ id, groupId, endpointType, phoneNumber, page, limit }` | List webhooks with filters |
| `createWebhook` | `{ webhookData }` | Create a new webhook |
| `updateWebhook` | `{ id, updateData }` | Update webhook configuration, including auth type and credentials |
| `rotateWebhookSecret` | `{ id, graceSeconds }` | Rotate the signing secret (returns the new one once) |
| `deleteWebhook` | `{ id }` | Delete a webhook |

```javascript
// List webhooks
const webhooks = await signalHouse.webhooks.getWebhooks({
  groupId: "G0000001",
  page: 1,
  limit: 25,
});

// Create a webhook
const newWebhook = await signalHouse.webhooks.createWebhook({
  webhookData: {
    url: "https://example.com/webhook",
    endpointType: "DELIVERY_STATUS",
    phoneNumber: "11234567890",
  },
});

// Update a webhook
await signalHouse.webhooks.updateWebhook({
  id: "wh_abc123",
  updateData: {
    url: "https://example.com/new-webhook-url",
  },
});

// Delete a webhook
await signalHouse.webhooks.deleteWebhook({
  id: "wh_abc123",
});

// Rotate the signing secret. The old secret keeps working for 24h so you can switch without
// dropping deliveries. Store the new secret now: it is only returned this once.
const rotated = await signalHouse.webhooks.rotateWebhookSecret({ id: "wh_abc123", graceSeconds: 86400 });
const newSecret = rotated.data.signingSecret;
```

#### Verifying deliveries (Node.js)

Every delivery is signed. Verify it on your server with the Node-only helper. It is a separate import
because it uses `node:crypto`, which the browser build of the SDK can't load.

```javascript
import express from "express";
import { verifyWebhookSignature } from "@signalhouse-sms/sdk/webhooks";

const app = express();
// Keep the raw body: the signature covers the exact bytes Signal House sent
app.post("/signalhouse", express.raw({ type: "application/json" }), (req, res) => {
  const { valid, reason } = verifyWebhookSignature({
    rawBody: req.body, // Buffer
    headers: req.headers,
    secret: process.env.SIGNALHOUSE_WEBHOOK_SECRET,
    // While rotating, accept both: secrets: [process.env.NEW_SECRET, process.env.OLD_SECRET]
  });
  if (!valid) return res.status(401).send(reason);
  const event = JSON.parse(req.body.toString("utf8"));
  // ...handle event
  res.sendStatus(200);
});
```

---

## Multipart Requests

The following methods use a multipart client that handles `FormData` construction automatically:

- `messages.sendMMS(...)` -- Media message with file uploads or media URLs
- `messages.sendGroupMessage(...)` -- Group MMS with file uploads or media URLs
- `landings.createLanding(...)` -- Landing page with image uploads
- `landings.updateLanding(...)` -- Landing page update with image uploads
- `templates.uploadMedia(...)` -- Template media upload

You do not need to construct `FormData` manually. Pass parameters as a normal object and the SDK builds the form data internally.

For multipart requests, the SDK omits the `Content-Type: application/json` header and lets the HTTP client set the appropriate `multipart/form-data` boundary.

---

## Query String Helpers

The SDK automatically constructs query strings from method parameters. Any parameter with an `undefined` value is excluded from the query string, so you only need to pass the filters you care about:

```javascript
// Only sends ?status=FAILED&page=1&limit=50
// groupId and direction are excluded because they are undefined
const messages = await signalHouse.messages.getMessages({
  status: "FAILED",
  groupId: undefined,
  direction: undefined,
  page: 1,
  limit: 50,
});
```

This means you can safely spread objects or pass optional parameters without worrying about `undefined` values appearing in the URL.

---

## Validation

The SDK validates required parameters client-side before making any HTTP request. If a required parameter is missing, `null`, or an empty string, the SDK throws a `SignalHouseValidationError` immediately -- no network request is made.

```javascript
try {
  // This throws SignalHouseValidationError because messageBody is missing
  await signalHouse.messages.sendSMS({
    senderPhoneNumber: "11234567890",
    recipientPhoneNumbers: ["10987654321"],
    messageBody: "", // empty string triggers validation
  });
} catch (error) {
  if (error.name === "SignalHouseValidationError") {
    console.error("Validation failed:", error.message);
    // "Missing required parameter: messageBody"
    console.error("Status:", error.status);
    // 400
  }
}
```

Validation errors have:
- `name`: `"SignalHouseValidationError"`
- `message`: `"Missing required parameter: <fieldName>"`
- `status`: `400`

This is distinct from API errors, which are returned as response objects (not thrown).

---

## Error Handling

The SDK uses a standardized response format for all API calls. Errors are **not thrown** -- they are returned as response objects with `success: false`.

### Success Response

```javascript
{
  success: true,
  data: { /* API response data */ },
  status: 200
}
```

### Error Response

```javascript
{
  success: false,
  error: "Error message or error object from the API",
  status: 400 // HTTP status code
}
```

### Recommended Pattern

```javascript
async function safeSendSMS(sender, recipient, body) {
  try {
    // Validation errors are thrown
    const response = await signalHouse.messages.sendSMS({
      senderPhoneNumber: sender,
      recipientPhoneNumbers: [recipient],
      messageBody: body,
    });

    // API errors are returned, not thrown
    if (!response.success) {
      console.error(`API error (${response.status}):`, response.error);
      return null;
    }

    return response.data;
  } catch (error) {
    // Only SignalHouseValidationError is thrown
    if (error.name === "SignalHouseValidationError") {
      console.error("Invalid parameters:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
    return null;
  }
}
```

### Error Types Summary

| Source | Behavior | How to Handle |
|--------|----------|---------------|
| Missing required param | Throws `SignalHouseValidationError` | `try/catch` |
| HTTP 4xx/5xx from API | Returns `{ success: false, error, status }` | Check `response.success` |
| Network failure | Returns `{ success: false, error, status: null }` | Check `response.success` |

---

## Complete Integration Example

A real-world Express.js server that uses the SDK to manage a messaging workflow:

```javascript
import express from "express";
import { SignalHouseSDK } from "@signalhouse-sms/sdk";

const app = express();
app.use(express.json());

// Initialize the SDK once
const signalHouse = new SignalHouseSDK({
  apiKey: process.env.SIGNALHOUSE_API_KEY,
  baseUrl: "https://v2.signalhouse.io",
});

// Send an SMS notification
app.post("/api/notify", async (req, res) => {
  const { recipientNumber, message, senderNumber } = req.body;

  try {
    const response = await signalHouse.messages.sendSMS({
      senderPhoneNumber: senderNumber,
      recipientPhoneNumbers: [recipientNumber],
      messageBody: message,
      statusCallbackUrl: `${process.env.BASE_URL}/api/delivery-status`,
    });

    if (!response.success) {
      return res.status(response.status || 500).json({
        error: response.error,
      });
    }

    return res.json({
      messageId: response.data.messageId,
      status: response.data.status,
    });
  } catch (error) {
    if (error.name === "SignalHouseValidationError") {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Receive delivery status callbacks
app.post("/api/delivery-status", (req, res) => {
  const { messageId, status } = req.body;
  console.log(`Message ${messageId} status: ${status}`);
  res.status(200).json({ received: true });
});

// List phone numbers with per-request token override
app.get("/api/numbers", async (req, res) => {
  const userToken = req.headers.authorization?.replace("Bearer ", "");

  const response = await signalHouse.numbers.getPhoneNumbers({
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    options: { token: userToken },
  });

  if (!response.success) {
    return res.status(response.status || 500).json({
      error: response.error,
    });
  }

  return res.json(response.data);
});

// Get message analytics
app.get("/api/analytics", async (req, res) => {
  const { startDate, endDate, campaignId } = req.query;

  const response = await signalHouse.messages.getAnalytics({
    startDate,
    endDate,
    campaignId,
  });

  if (!response.success) {
    return res.status(response.status || 500).json({
      error: response.error,
    });
  }

  return res.json(response.data);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```
