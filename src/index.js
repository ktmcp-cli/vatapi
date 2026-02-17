import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  validateVatNumber,
  getCountryRates,
  getAllCountryRates,
  getRatesByIp,
  calculateVat
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 40);
  });

  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));

  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });

  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('VAT API key not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  vatapi config set --api-key <key>'));
    process.exit(1);
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('vatapi')
  .description(chalk.bold('VAT API CLI') + ' - European VAT validation from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--api-key <key>', 'VAT API key')
  .action((options) => {
    if (options.apiKey) {
      setConfig('apiKey', options.apiKey);
      printSuccess('API key set');
    } else {
      printError('No options provided. Use --api-key');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const apiKey = getConfig('apiKey');
    console.log(chalk.bold('\nVAT API CLI Configuration\n'));
    console.log('API Key: ', apiKey ? chalk.green('*'.repeat(8) + apiKey.slice(-4)) : chalk.red('not set'));
    console.log('');
  });

// ============================================================
// VAT VALIDATION
// ============================================================

const vatCmd = program.command('vat').description('VAT number operations');

vatCmd
  .command('validate <vat-number>')
  .description('Validate a VAT number (e.g. GB123456789)')
  .option('--json', 'Output as JSON')
  .action(async (vatNumber, options) => {
    requireAuth();
    try {
      const result = await withSpinner(`Validating VAT number ${vatNumber}...`, () => validateVatNumber(vatNumber));
      if (options.json) { printJson(result); return; }
      console.log(chalk.bold('\nVAT Number Validation\n'));
      console.log('VAT Number: ', chalk.cyan(vatNumber));
      console.log('Valid:      ', result.valid ? chalk.green('Yes') : chalk.red('No'));
      if (result.company_name) console.log('Company:    ', chalk.bold(result.company_name));
      if (result.company_addr) console.log('Address:    ', result.company_addr);
      if (result.country_code) console.log('Country:    ', result.country_code);
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// COUNTRY RATES
// ============================================================

const ratesCmd = program.command('rates').description('VAT rate operations');

ratesCmd
  .command('country <country-code>')
  .description('Get VAT rates for a country (e.g. GB, DE, FR)')
  .option('--json', 'Output as JSON')
  .action(async (countryCode, options) => {
    requireAuth();
    try {
      const result = await withSpinner(`Fetching rates for ${countryCode}...`, () => getCountryRates(countryCode));
      if (options.json) { printJson(result); return; }
      console.log(chalk.bold(`\nVAT Rates for ${countryCode.toUpperCase()}\n`));
      if (result.country) {
        console.log('Country:       ', result.country.name || countryCode);
        console.log('Standard Rate: ', chalk.green(result.country.standard_rate + '%'));
        if (result.country.reduced_rates) {
          console.log('Reduced Rates: ', result.country.reduced_rates.join(', ') + '%');
        }
        if (result.country.super_reduced_rate) {
          console.log('Super Reduced: ', result.country.super_reduced_rate + '%');
        }
        if (result.country.parking_rate) {
          console.log('Parking Rate:  ', result.country.parking_rate + '%');
        }
      }
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

ratesCmd
  .command('all')
  .description('Get VAT rates for all EU countries')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const result = await withSpinner('Fetching all country rates...', () => getAllCountryRates());
      if (options.json) { printJson(result); return; }
      const countries = result.countries || result.rates || [];
      if (Array.isArray(countries)) {
        printTable(countries, [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Country' },
          { key: 'standard_rate', label: 'Standard %' },
          { key: 'reduced_rates', label: 'Reduced %', format: (v) => Array.isArray(v) ? v.join(', ') : (v || 'N/A') }
        ]);
      } else {
        printJson(result);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// IP-BASED RATES
// ============================================================

const ipCmd = program.command('ip').description('IP-based VAT lookup');

ipCmd
  .command('lookup [ip-address]')
  .description('Get VAT rates based on IP address (defaults to your IP)')
  .option('--json', 'Output as JSON')
  .action(async (ipAddress, options) => {
    requireAuth();
    try {
      const result = await withSpinner('Looking up VAT rates by IP...', () => getRatesByIp(ipAddress));
      if (options.json) { printJson(result); return; }
      console.log(chalk.bold('\nVAT Rates by IP\n'));
      console.log('IP Address:    ', result.ip || ipAddress || 'auto-detected');
      console.log('Country:       ', result.country?.name || result.country || 'N/A');
      console.log('Country Code:  ', result.country_code || 'N/A');
      if (result.country?.standard_rate) {
        console.log('Standard Rate: ', chalk.green(result.country.standard_rate + '%'));
      }
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// VAT CALCULATOR
// ============================================================

const calcCmd = program.command('calculate').description('Calculate VAT amounts');

calcCmd
  .command('vat')
  .description('Calculate VAT for a price')
  .option('--country <code>', 'Country code (e.g. GB, DE)')
  .option('--price <amount>', 'Price amount')
  .option('--rate <rate>', 'VAT rate (overrides country default)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    if (!options.price) {
      printError('--price is required');
      process.exit(1);
    }
    try {
      const result = await withSpinner('Calculating VAT...', () =>
        calculateVat({
          countryCode: options.country,
          price: options.price,
          vatRate: options.rate
        })
      );
      if (options.json) { printJson(result); return; }
      console.log(chalk.bold('\nVAT Calculation\n'));
      console.log('Price (ex VAT): ', result.price_excl_vat || options.price);
      console.log('VAT Amount:     ', chalk.yellow(result.vat || 'N/A'));
      console.log('Price (inc VAT):', chalk.green(result.price_incl_vat || 'N/A'));
      console.log('VAT Rate:       ', result.vat_rate ? result.vat_rate + '%' : 'N/A');
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
