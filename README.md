> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# VAT API CLI

A production-ready command-line interface for the [VAT API](https://vatapi.com) European VAT validation service. Validate VAT numbers, look up country rates, and calculate VAT amounts directly from your terminal.

> **Disclaimer**: This is an unofficial CLI tool and is not affiliated with, endorsed by, or supported by VAT API.

## Features

- **VAT Validation** — Validate EU VAT numbers and get company details
- **Country Rates** — Get VAT rates for any EU country
- **All Rates** — Fetch VAT rates for all EU countries at once
- **IP Lookup** — Get VAT rates based on IP geolocation
- **VAT Calculator** — Calculate VAT amounts and prices
- **JSON output** — All commands support `--json` for scripting and piping
- **Colorized output** — Clean, readable terminal output with chalk

## Why CLI > MCP

MCP servers are complex, stateful, and require a running server process. A CLI is:

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe output to `jq`, `grep`, `awk`, and other tools
- **Scriptable** — Use in shell scripts, CI/CD pipelines, cron jobs
- **Debuggable** — See exactly what's happening with `--json` flag
- **AI-friendly** — AI agents can call CLIs just as easily as MCPs, with less overhead

## Installation

```bash
npm install -g @ktmcp-cli/vatapi
```

## Authentication Setup

VAT API uses API key authentication.

### 1. Get your API key

1. Sign up at [vatapi.com](https://vatapi.com)
2. Go to your dashboard and copy your API key

### 2. Configure the CLI

```bash
vatapi config set --api-key YOUR_API_KEY
```

### 3. Verify

```bash
vatapi rates country GB
```

## Commands

### Configuration

```bash
# Set API key
vatapi config set --api-key <key>

# Show current config
vatapi config show
```

### VAT Number Validation

```bash
# Validate a VAT number
vatapi vat validate GB123456789
vatapi vat validate DE123456789

# Output as JSON
vatapi vat validate GB123456789 --json
```

### Country Rates

```bash
# Get VAT rates for a specific country
vatapi rates country GB
vatapi rates country DE
vatapi rates country FR

# Get rates for all EU countries
vatapi rates all
```

### IP-Based Lookup

```bash
# Get VAT rates for your IP (auto-detect)
vatapi ip lookup

# Get VAT rates for a specific IP
vatapi ip lookup 1.2.3.4
```

### VAT Calculator

```bash
# Calculate VAT for a price (country's standard rate)
vatapi calculate vat --country GB --price 100

# Calculate with a specific rate
vatapi calculate vat --country DE --price 200 --rate 19

# Output as JSON for scripting
vatapi calculate vat --country FR --price 50 --json
```

## JSON Output

All commands support `--json` for machine-readable output:

```bash
# Validate and pipe to jq
vatapi vat validate GB123456789 --json | jq '{valid: .valid, company: .company_name}'

# Get all rates and filter
vatapi rates all --json | jq '.[] | select(.standard_rate > 20)'
```

## Contributing

Issues and pull requests are welcome at [github.com/ktmcp-cli/vatapi](https://github.com/ktmcp-cli/vatapi).

## License

MIT — see [LICENSE](LICENSE) for details.

---

Part of the [KTMCP CLI](https://killthemcp.com) project — replacing MCPs with simple, composable CLIs.
