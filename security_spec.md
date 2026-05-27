# Security Specifications & Threat Model (Couture Atelier)

This document defines the 8-pillar zero-trust security architecture for the Couture Atelier Firestore database.

## 1. Data Invariants

1. **Relation-Sync Integrity**:
   - A `DesignProject` cannot be created or accessed unless its associated `customerId` maps to an authentic `Customer` in the system.
2. **Measurement Immutability & Bounds**:
   - Customer measurements (chest, waist, hips, height, shoulder, sleeve, neck, inseam) must be strictly non-negative numbers and conform to physical bounds.
3. **Identity & Role Division**:
   - A customer user (identified by Google email token) can view and comment on their own project configurations but is forbidden from modifying core CAD drafting coefficients.
   - Comment items must have a validated `author` (Designer or Customer) matching their session credentials.
4. **Finite State Transitions**:
   - A project's `customerApprovalStatus` can only be set to "Pending", "Approved", or "Change-Requested". Once terminal approval status ("Approved") is acknowledged, state updates are frozen.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads attempt to breach Identity, Data Integrity, or Finite State limits and must return `PERMISSION_DENIED`.

### Payload 1: PII Access & Identity Spoofing
- **Type**: Unauthorized Customer record creation with another user's email ID.
- **Goal**: Register a custom customer document with spoofed `email` field to hijack notifications.
- **Payload**:
  ```json
  {
    "id": "cust-malicious",
    "email": "victim@domain.com",
    "name": "Attacker Spoof",
    "phone": "+123456789",
    "measurements": { "chest": 32, "waist": 24, "hips": 34, "height": 64 }
  }
  ```

### Payload 2: Negative Measurement Injection (Value Poisoning)
- **Type**: Inject negative or zero dimensions into measurements.
- **Goal**: Crash the rendering/drapery scaling pipeline with invalid floating coefficients.
- **Payload**:
  ```json
  {
    "id": "cust-3",
    "measurements": { "chest": -40, "waist": -34, "hips": -42, "height": -71 }
  }
  ```

### Payload 3: Excess Key Exploit (Shadow Payload)
- **Type**: Injecting phantom keys (`isAdmin: true`) into a Customer schema update.
- **Goal**: Escalate privilege or bypass rules.
- **Payload**:
  ```json
  {
    "id": "cust-3",
    "isAdmin": true,
    "name": "Kwame Osei"
  }
  ```

### Payload 4: State Shortcutting (Illegal Workflow Jump)
- **Type**: Bypassing review state by force-publishing project as "Approved" without Designer review.
- **Goal**: Skip negotiation loops.
- **Payload**:
  ```json
  {
    "id": "proj-1",
    "customerApprovalStatus": "Approved",
    "lastUpdated": "2026-05-27T21:54:03Z"
  }
  ```

### Payload 5: Deny-of-Wallet Character Flooding (Resource Poisoning)
- **Type**: Injecting massive 2MB strings into naming fields.
- **Goal**: Trigger excessive Firestore download bytes and memory leaks.
- **Payload**:
  ```json
  {
    "id": "proj-1",
    "designName": "EXCESS_STRING_REPEATED_2MB..."
  }
  ```

### Payload 6: Untrusted Client Timestamp Manipulation (Temporal Integrity Breach)
- **Type**: Set `lastUpdated` as a physical past date to spoof delivery queue.
- **Goal**: Spoof SLA tracking systems.
- **Payload**:
  ```json
  {
    "id": "proj-1",
    "lastUpdated": "2020-01-01T00:00:00Z"
  }
  ```

### Payload 7: Orphaned Project Record (Relational Integrity Breach)
- **Type**: Creating a `DesignProject` referencing a `customerId` that does not exist.
- **Goal**: Create invalid records in database and trigger runtime null dereferencing.
- **Payload**:
  ```json
  {
    "id": "proj-orphaned",
    "customerId": "non-existent-id",
    "designName": "Ghost Dress"
  }
  ```

### Payload 8: Mutative Key Escalation on List Comments
- **Type**: Modify historical comment author strings by changing comment properties in updates.
- **Goal**: Change author from "Customer" to "Designer" to forge designer decisions.
- **Payload**:
  ```json
  {
    "id": "proj-1",
    "comments": [
      { "id": "c1", "author": "Designer", "text": "This was altered from Customer to Designer!" }
    ]
  }
  ```

### Payload 9: Invalid Document String ID Injection
- **Type**: Create a document where document ID is loaded with path traversal symbols.
- **Goal**: Escape database scoping constraints.
- **Payload**:
  - Target Path: `/customers/../projects/hackedDoc`

### Payload 10: Custom Pattern Injecting Executable Content
- **Type**: Storing malicious javascript inside the custom pattern base64 string.
- **Goal**: Inject XSS payload via custom SVG texture URLs.
- **Payload**:
  ```json
  {
    "fabric": {
      "pattern": "custom",
      "customPatternUrl": "javascript:alert('xss')"
    }
  }
  ```

### Payload 11: Blanket Unrestricted Query Read Hack
- **Type**: Request list query against all customer projects from the client SDK without constraints.
- **Goal**: Leak other customer profile details and measurements.

### Payload 12: Terminal State Lock Crack
- **Type**: Modifying a project's parameters after high-fashion status was committed as "Approved".
- **Goal**: Bypass final physical pattern dimensions.

---

## 3. Test Runner Design

The `firestore.rules.test.ts` specification maps these invariants. We verify that all operations return `PERMISSION_DENIED` on invalid shapes and successfully allow compliant operations on authenticated routes.
