const crypto = require('crypto');
const axios = require('axios');

const DEFAULT_ACRA_SOURCE_URL = 'https://www.bizfile.gov.sg/';
const DEFAULT_OPEN_DATA_URL = 'https://data.gov.sg/collections/2/view';
const ACTIVE_ENTITY_STATUSES = [
  'ACTIVE',
  'REGISTERED',
  'LIVE',
  'LIVE COMPANY',
  'EXISTING',
  'IN OPERATION'
];

function cleanString(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
}

function normalizeUen(value) {
  return cleanString(value).toUpperCase().replace(/[^0-9A-Z]/g, '');
}

function isValidUen(value) {
  const uen = normalizeUen(value);
  return /^[0-9A-Z]{9,10}$/.test(uen)
    && /[0-9]/.test(uen)
    && /[A-Z]$/.test(uen);
}

function inferEntityTypeFromUen(value) {
  const uen = normalizeUen(value);

  if (/^\d{8}[A-Z]$/.test(uen)) {
    return 'business-registration-number';
  }

  if (/^\d{9}[A-Z]$/.test(uen)) {
    return 'local-company-uen';
  }

  if (/^[ST]\d{2}[A-Z]{2}\d{4}[A-Z]$/.test(uen)) {
    return 'new-entity-uen';
  }

  return 'uen';
}

function firstPresent(record, fields) {
  for (const field of fields) {
    if (record && record[field] !== undefined && record[field] !== null && record[field] !== '') {
      return record[field];
    }
  }

  return '';
}

function normalizeAcraEntity(record = {}, requestedUen = '') {
  const uen = normalizeUen(firstPresent(record, [
    'uen',
    'UEN',
    'uenNumber',
    'uen_number',
    'uenNo',
    'uen_no'
  ]) || requestedUen);

  if (!isValidUen(uen)) {
    throw new Error('A valid Singapore UEN is required');
  }

  const entityName = cleanString(firstPresent(record, [
    'entityName',
    'entity_name',
    'ENTITY_NAME',
    'name',
    'businessName',
    'business_name'
  ]));
  const entityStatus = cleanString(firstPresent(record, [
    'entityStatus',
    'entity_status',
    'ENTITY_STATUS',
    'status',
    'uenStatus',
    'uen_status'
  ]) || 'UNKNOWN').toUpperCase();
  const entityType = cleanString(firstPresent(record, [
    'entityType',
    'entity_type',
    'ENTITY_TYPE',
    'type'
  ]) || inferEntityTypeFromUen(uen));
  const registrationDate = cleanString(firstPresent(record, [
    'registrationDate',
    'registration_date',
    'REGISTRATION_DATE',
    'incorporationDate',
    'date_of_incorporation'
  ]));
  const postalCode = cleanString(firstPresent(record, [
    'postalCode',
    'postal_code',
    'POSTAL_CODE'
  ]));
  const address = cleanString(firstPresent(record, [
    'registeredAddress',
    'registered_address',
    'address',
    'officeAddress',
    'office_address'
  ]));

  const normalized = {
    uen,
    entityName,
    entityType,
    entityStatus,
    registrationDate,
    postalCode,
    registeredAddress: address,
    source: cleanString(record.source) || 'ACRA',
    sourceUrl: cleanString(record.sourceUrl) || DEFAULT_ACRA_SOURCE_URL
  };

  return {
    ...normalized,
    fingerprint: fingerprint(normalized),
    raw: record
  };
}

function namesMatch(expectedName, actualName) {
  const expected = cleanString(expectedName).toUpperCase().replace(/\s+/g, ' ');
  const actual = cleanString(actualName).toUpperCase().replace(/\s+/g, ' ');

  if (!expected || !actual) {
    return null;
  }

  return expected === actual || actual.includes(expected) || expected.includes(actual);
}

function verifyLegalIdentity({ expectedUen, expectedName, entity }) {
  const normalizedEntity = normalizeAcraEntity(entity, expectedUen);
  const normalizedExpectedUen = normalizeUen(expectedUen);
  const uenMatches = normalizedEntity.uen === normalizedExpectedUen;
  const nameMatches = namesMatch(expectedName, normalizedEntity.entityName);
  const activeStatus = ACTIVE_ENTITY_STATUSES.includes(normalizedEntity.entityStatus);
  const verified = uenMatches && activeStatus && nameMatches !== false;

  return {
    verificationStatus: verified ? 'verified' : 'rejected',
    checkedAt: new Date(),
    uenMatches,
    nameMatches,
    activeStatus,
    expectedUen: normalizedExpectedUen,
    expectedName: cleanString(expectedName),
    entity: normalizedEntity,
    reason: verified
      ? 'ACRA entity identity matched the expected Singapore legal entity.'
      : 'ACRA entity identity did not satisfy UEN, name, or active-status checks.'
  };
}

function buildAcraRequestUrl(uen, config = process.env) {
  const template = cleanString(config.ACRA_API_URL_TEMPLATE);
  if (template) {
    return template.replace('{uen}', encodeURIComponent(uen));
  }

  const baseUrl = cleanString(config.ACRA_API_BASE_URL);
  if (baseUrl) {
    return `${baseUrl.replace(/\/+$/, '')}/entities/${encodeURIComponent(uen)}`;
  }

  return '';
}

async function lookupAcraEntity({ uen, record, config = process.env, httpClient = axios }) {
  const normalizedUen = normalizeUen(uen || record?.uen || record?.UEN);

  if (!isValidUen(normalizedUen)) {
    throw new Error('A valid Singapore UEN is required');
  }

  if (record) {
    return normalizeAcraEntity({
      ...record,
      source: record.source || 'ACRA evidence payload',
      sourceUrl: record.sourceUrl || DEFAULT_OPEN_DATA_URL
    }, normalizedUen);
  }

  const requestUrl = buildAcraRequestUrl(normalizedUen, config);
  if (!requestUrl) {
    return normalizeAcraEntity({
      uen: normalizedUen,
      entityStatus: 'PENDING_MANUAL_REVIEW',
      entityType: inferEntityTypeFromUen(normalizedUen),
      source: 'ACRA manual review',
      sourceUrl: DEFAULT_ACRA_SOURCE_URL
    }, normalizedUen);
  }

  const headers = {};
  if (config.ACRA_API_KEY) {
    headers.Authorization = `Bearer ${config.ACRA_API_KEY}`;
  }

  const response = await httpClient.get(requestUrl, {
    headers,
    timeout: Number(config.ACRA_API_TIMEOUT_MS || 10000)
  });
  const payload = response.data?.data || response.data?.result || response.data;
  const recordPayload = Array.isArray(payload) ? payload[0] : payload;

  if (!recordPayload) {
    throw new Error(`No ACRA entity found for UEN ${normalizedUen}`);
  }

  return normalizeAcraEntity({
    ...recordPayload,
    source: recordPayload.source || 'ACRA API',
    sourceUrl: recordPayload.sourceUrl || requestUrl
  }, normalizedUen);
}

module.exports = {
  ACTIVE_ENTITY_STATUSES,
  DEFAULT_ACRA_SOURCE_URL,
  DEFAULT_OPEN_DATA_URL,
  buildAcraRequestUrl,
  inferEntityTypeFromUen,
  isValidUen,
  lookupAcraEntity,
  normalizeAcraEntity,
  normalizeUen,
  verifyLegalIdentity
};
