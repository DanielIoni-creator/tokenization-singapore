# ACRA Legal Identity Integration

The backend includes an ACRA integration layer for Singapore SPV and entity verification. It is designed to work in three modes:

- Evidence payload mode for tests and manual legal review
- Configurable live API mode using `ACRA_API_URL_TEMPLATE`
- Manual-review fallback when no API endpoint is configured

## Official Data Sources

- ACRA Open Data Initiative: https://www.acra.gov.sg/resources/open-data-initiative/
- ACRA API Marketplace: https://www.acra.gov.sg/resources/eservice-tools-portals/api-marketplace/
- ACRA corporate entities collection on data.gov.sg: https://data.gov.sg/collections/2/view
- BizFile portal: https://www.bizfile.gov.sg/

ACRA states that its open datasets include entity name, UEN, registration date, status, entity type, registered office address, SSIC activity, officers, former names, and audit firms. The data.gov.sg corporate entity collection is updated monthly and split into alphabetic CSV datasets. ACRA also provides API Marketplace services, including Entity Information Query and Business Profile Data APIs, with mock APIs available for testing.

## Configuration

For production or staging API calls, set:

```bash
ACRA_API_URL_TEMPLATE=https://your-acra-adapter.example/entities/{uen}
ACRA_API_KEY=optional-api-token
ACRA_API_TIMEOUT_MS=10000
```

`{uen}` is replaced with the normalized Singapore UEN. If `ACRA_API_URL_TEMPLATE` is not configured, the service returns a manual-review profile unless an evidence `record` is provided in the API request.

## Verification Logic

`backend/services/acraService.js` provides:

- `normalizeUen(value)`: uppercases and removes formatting characters
- `isValidUen(value)`: validates common Singapore UEN shapes
- `lookupAcraEntity({ uen, record })`: normalizes an evidence record or fetches from the configured ACRA endpoint
- `verifyLegalIdentity({ expectedUen, expectedName, entity })`: checks UEN match, active entity status, and entity-name match

Active statuses include `ACTIVE`, `REGISTERED`, `LIVE`, `LIVE COMPANY`, `EXISTING`, and `IN OPERATION`.

## API Endpoints

All endpoints require JWT authentication. Admin-only routes also require `admin` or `superadmin`.

### Lookup ACRA Entity

`POST /api/acra/lookup`

Admin only.

```json
{
  "uen": "202400001A",
  "record": {
    "uen": "202400001A",
    "entity_name": "MBFT Holdings Pte. Ltd.",
    "entity_status": "LIVE COMPANY",
    "entity_type": "Private Company Limited by Shares",
    "registration_date": "2024-01-02",
    "registered_address": "10 Marina Boulevard, Singapore 018983",
    "postal_code": "018983"
  }
}
```

The optional `record` field lets admins attach official evidence from ACRA or data.gov.sg while the production API adapter is not configured.

### Verify Token SPV

`POST /api/acra/tokens/:id/verify-spv`

Admin only.

```json
{
  "uen": "202400001A",
  "record": {
    "uen": "202400001A",
    "entity_name": "MBFT Holdings Pte. Ltd.",
    "entity_status": "LIVE COMPANY"
  }
}
```

This compares the token's `spv.uen` and `spv.name` against the ACRA profile. The normalized ACRA profile, fingerprint, verification status, and reason are saved under `token.spv.acra`.

### Verify User Legal Entity

`POST /api/acra/auth/verify-entity`

Authenticated user route.

```json
{
  "uen": "202400001A",
  "entityName": "MBFT Holdings Pte. Ltd.",
  "record": {
    "uen": "202400001A",
    "entity_name": "MBFT Holdings Pte. Ltd.",
    "entity_status": "LIVE COMPANY"
  }
}
```

This stores the verified ACRA legal identity on `user.legalIdentity`. It complements the existing JWT login flow by binding the authenticated user account to a verified Singapore legal entity.

## Validation

Run from `backend/`:

```bash
npm test
```

The validation script checks UEN normalization, API URL template construction, ACRA evidence normalization, active-status matching, SPV identity verification, rejection for mismatched names, and the Singapore real-estate token model.
