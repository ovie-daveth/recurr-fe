# Recurr Merchant Dashboard Implementation Plan

This frontend lives in `FE/` beside the existing `BE/` service. It is a merchant dashboard in the style of Paystack or Stripe: operational, table-driven, developer-friendly, and focused on recurring billing workflows.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Axios
- Zustand for local session/business/mode state
- Lucide icons
- Recharts for dashboard charts

## Backend Contract

The dashboard uses merchant session JWT authentication:

```http
Authorization: Bearer <merchant_access_token>
```

Business API keys are not for the dashboard. They are for merchants' external apps calling public merchant APIs.

Base environment:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_API_VERSION=/api/v1
```

## Navigation

Primary dashboard sections:

1. Overview
2. Businesses
3. API keys
4. Customers
5. Plans
6. Subscriptions
7. Invoices
8. Payment attempts
9. Webhooks
10. Dunning policies
11. Logs

## Build Phases

### Phase 1: Foundation

- Scaffold Vite app.
- Add Tailwind and dashboard layout.
- Add API client with JWT bearer injection.
- Add persisted auth store.
- Add protected routes.
- Add auth pages:
  - signup
  - verify email
  - login

### Phase 2: Merchant Workspace

- Load `/merchants/me`.
- Load businesses.
- Add business selector.
- Add `TEST` / `LIVE` mode switch.
- Add update business form.

### Phase 3: Developer Controls

- API keys table.
- Create API key modal.
- Copy newly-created key once.
- Revoke key action.
- Webhook endpoint table.
- Create webhook endpoint form.
- Test webhook endpoint action.
- Webhook delivery history.

### Phase 4: Billing Setup

- Customers table and create form.
- Customer detail view.
- Payment method setup checkout.
- Payment method list/revoke.
- Plans table and create form.
- Plan lifecycle controls.

### Phase 5: Subscription Operations

- Create subscription flow.
- Subscription detail page.
- Pause/resume/cancel actions.
- Cancel at period end.
- Change plan with upgrade proration and downgrade scheduled for period end.
- Invoice list/detail.
- Manual invoice retry.
- Payment attempt list/detail.

### Phase 6: Dunning and Observability

- Dunning policy list/create/edit.
- Retry steps editor.
- Final action selector.
- Operational logs list.
- Logs summary cards.
- Filter logs by severity, event type, date, and cursor pagination.

### Phase 7: Demo Polish

- Empty states for each section.
- Loading and error states.
- Copy buttons for ids, API keys, webhook secrets, and references.
- Status badges for all lifecycle fields.
- Dashboard metrics from real endpoints.
- Production API URL configuration.

## First Milestone

The first usable demo milestone is:

```txt
Merchant signup/login -> dashboard shell -> business selection -> create API key -> create customer -> create plan.
```

After that, add subscription creation, invoice/payment attempt viewing, webhook logs, and dunning policies.

## File Structure

```txt
FE/
  src/
    app/
    api/
    components/
      layout/
      ui/
    features/
      auth/
      dashboard/
      businesses/
      api-keys/
      customers/
      plans/
      subscriptions/
      invoices/
      payment-attempts/
      webhooks/
      logs/
      dunning/
    lib/
    pages/
```
