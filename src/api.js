import axios from 'axios';
import { getConfig } from './config.js';

const BASE_URL = 'https://vatapi.com/v1';

function getClient() {
  const apiKey = getConfig('apiKey');
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'apikey': apiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
}

function handleApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    if (status === 401) {
      throw new Error('Authentication failed. Check your API key: vatapi config set --api-key <key>');
    } else if (status === 403) {
      throw new Error('Access forbidden. Check your API permissions.');
    } else if (status === 404) {
      throw new Error('Resource not found.');
    } else if (status === 429) {
      throw new Error('Rate limit exceeded. Please wait before retrying.');
    } else {
      const message = data?.message || data?.error || JSON.stringify(data);
      throw new Error(`API Error (${status}): ${message}`);
    }
  } else if (error.request) {
    throw new Error('No response from VAT API. Check your internet connection.');
  } else {
    throw error;
  }
}

// ============================================================
// VAT NUMBER VALIDATION
// ============================================================

export async function validateVatNumber(vatNumber) {
  try {
    const client = getClient();
    const response = await client.get(`/vat-number-check`, { params: { vatid: vatNumber } });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ============================================================
// COUNTRY VAT RATES
// ============================================================

export async function getCountryRates(countryCode) {
  try {
    const client = getClient();
    const response = await client.get(`/country-code-check`, { params: { code: countryCode } });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function getAllCountryRates() {
  try {
    const client = getClient();
    const response = await client.get(`/country-rates`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ============================================================
// IP-BASED RATES
// ============================================================

export async function getRatesByIp(ipAddress) {
  try {
    const client = getClient();
    const params = {};
    if (ipAddress) params.address = ipAddress;
    const response = await client.get(`/ip-check`, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ============================================================
// VAT PRICE CALCULATION
// ============================================================

export async function calculateVat({ countryCode, price, vatRate }) {
  try {
    const client = getClient();
    const params = {};
    if (countryCode) params.code = countryCode;
    if (price) params.price = price;
    if (vatRate) params.rate = vatRate;
    const response = await client.get(`/vat-calculator`, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}
