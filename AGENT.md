# AGENT.md — VAT API CLI for AI Agents

This document explains how to use the VAT API CLI as an AI agent.

## Overview

The `vatapi` CLI provides access to the VAT API service for European VAT validation, rate lookups, and calculations.

## Prerequisites

The CLI must be configured with an API key before use:

```bash
vatapi config set --api-key <key>
vatapi rates country GB   # Test connectivity
```

## All Commands

### Config

```bash
vatapi config set --api-key <key>
vatapi config show
```

### VAT Number Validation

```bash
vatapi vat validate <vat-number>        # e.g. GB123456789, DE123456789
vatapi vat validate <vat-number> --json
```

VAT number format by country:
- GB: GB + 9 digits (e.g. GB123456789)
- DE: DE + 9 digits (e.g. DE123456789)
- FR: FR + 11 chars (e.g. FR12345678901)

### Country Rates

```bash
vatapi rates country <code>             # e.g. GB, DE, FR, IT, ES
vatapi rates country <code> --json
vatapi rates all
vatapi rates all --json
```

### IP Lookup

```bash
vatapi ip lookup                        # Auto-detect caller's IP
vatapi ip lookup <ip-address>
vatapi ip lookup 1.2.3.4 --json
```

### VAT Calculator

```bash
vatapi calculate vat --country <code> --price <amount>
vatapi calculate vat --country GB --price 100
vatapi calculate vat --country DE --price 200 --rate 7    # Reduced rate
vatapi calculate vat --country FR --price 50 --json
```

## JSON Output

Always use `--json` when parsing results programmatically:

```bash
vatapi vat validate GB123456789 --json
vatapi rates all --json
```

## Example Workflows

### Validate and get company info

```bash
vatapi vat validate GB123456789 --json | jq '{valid: .valid, company: .company_name, address: .company_addr}'
```

### Get all reduced rates above 10%

```bash
vatapi rates all --json | jq '.rates // . | to_entries[] | .value | select(.reduced_rates != null) | {country: .name, reduced: .reduced_rates}'
```

### Determine VAT for a sale

```bash
# Check if buyer's IP is EU
vatapi ip lookup 1.2.3.4 --json | jq '.country_code'

# Get rate for their country
vatapi rates country DE --json | jq '.country.standard_rate'

# Calculate
vatapi calculate vat --country DE --price 100 --json
```

## Error Handling

The CLI exits with code 1 on error. Common errors:

- `API key not configured` — Run `vatapi config set --api-key <key>`
- `Authentication failed` — Check your API key
- `Resource not found` — Country code may be invalid

## Notes

- Country codes are ISO 3166-1 alpha-2 (2-letter codes)
- VAT validation only works for EU VAT numbers
- IP-based lookup may not work for all IP addresses
