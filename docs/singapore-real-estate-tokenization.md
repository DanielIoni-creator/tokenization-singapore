# Singapore Real Estate Tokenization Model

This backend now includes a focused model for creating Singapore real-estate tokens with property metadata, fractional ownership calculations, and registry verification hooks.

## Scope

- Property data model for Singapore real estate assets
- Token fractionalization model for share count, token price, issuer reserve, and minimum allocation
- Registry reference fields for Singapore Land Authority title or lot evidence
- SPV and compliance fields for Singapore offering workflows
- Admin API endpoints for preview, creation, and registry evidence checks

## Registry Sources

Singapore property title and land information should be checked against official sources before activating a token:

- Singapore Land Authority land title search: https://www.sla.gov.sg/regulatory/property-ownership/land-titles-search/
- INLIS portal: https://app.sla.gov.sg/inlis/
- Singapore Land Authority role as land registration authority: https://www.sla.gov.sg/
- ACRA/BizFile company registry portal for SPV entity checks: https://www.bizfile.gov.sg/

The current implementation stores the registry reference, derives a deterministic fingerprint from the title or lot data, and exposes a verification endpoint for matching official evidence. A live ACRA API integration is intentionally left separate because it is covered by the dedicated ACRA integration issue.

## Data Model

`backend/models/Token.js` now supports:

- `propertyDetails.address`: Singapore address, building, unit, and postal code
- `propertyDetails`: property type, areas, valuation, valuation date, valuer, yield, tenure, planning region, and district
- `registry`: SLA/INLIS authority, title number, lot number, strata lot number, reference date, source URL, verification status, and fingerprint
- `fractionalization`: valuation, currency, total shares, token price, issuer reserve, investor-available tokens, minimum investment, and ownership percent per token
- `spv`: Singapore SPV name, UEN or registration number, entity type, and address
- `compliance`: jurisdiction, offering type, investor eligibility flag, transfer restrictions, and risk disclosure

## API

All endpoints are mounted under `/api/tokens` and require authentication. Creation and verification endpoints require an admin user.

### Preview Fractionalization

`POST /api/tokens/fractionalize`

```json
{
  "valuation": 10000000,
  "totalSupply": 10000,
  "currency": "SGD",
  "issuerReservePercent": 10,
  "minimumInvestment": 5000
}
```

Returns token price, ownership per token, issuer reserve, investor-available supply, and minimum token count.

### Create Real Estate Token

`POST /api/tokens/real-estate`

```json
{
  "name": "Marina Bay Fractional Tower",
  "symbol": "MBFT",
  "description": "Fractionalized Singapore commercial property model",
  "totalSupply": 10000,
  "propertyDetails": {
    "address": {
      "street": "10 Marina Boulevard",
      "postalCode": "018983",
      "buildingName": "Marina Bay Financial Centre"
    },
    "propertyType": "commercial",
    "valuation": 10000000,
    "valuationCurrency": "SGD",
    "rentalYield": 4.2,
    "tenure": "99-year leasehold",
    "planningRegion": "Central Region",
    "district": "01"
  },
  "registry": {
    "authority": "SLA_INLIS",
    "titleNumber": "MK01-12345A",
    "lotNumber": "TS01-99999X"
  },
  "fractionalization": {
    "issuerReservePercent": 10,
    "minimumInvestment": 5000
  },
  "spv": {
    "name": "MBFT Holdings Pte. Ltd.",
    "uen": "202400001A",
    "entityType": "Private Company Limited by Shares"
  }
}
```

### Verify Registry Evidence

`POST /api/tokens/:id/registry/verify`

```json
{
  "registryFingerprint": "stored-or-official-evidence-fingerprint",
  "checkedBy": "legal-ops",
  "notes": "Matched against SLA title evidence"
}
```

When the submitted evidence fingerprint matches the stored registry reference fingerprint, the token's registry status is updated to `verified`; otherwise it is set to `rejected`.

## Validation

Run from `backend/`:

```bash
npm test
```

This executes `scripts/validateTokenizationModel.js`, which checks model creation, fractionalization calculations, deterministic registry fingerprints, registry verification, and postal-code validation.
