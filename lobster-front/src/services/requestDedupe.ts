import axios, { AxiosAdapter, AxiosHeaders, AxiosRequestHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

interface DedupeConfig {
  method?: string;
  baseURL?: string;
  url?: string;
  params?: unknown;
  headers?: AxiosRequestHeaders | Record<string, unknown>;
  data?: unknown;
}

const inFlightGetRequests = new Map<string, Promise<AxiosResponse>>();

export function buildRequestDedupeKey(config: DedupeConfig): string | null {
  const method = (config.method || 'get').toLowerCase();
  if (method !== 'get') {
    return null;
  }

  return [
    method,
    config.baseURL || '',
    config.url || '',
    stableStringify(config.params || {}),
    authorizationHeader(config.headers),
  ].join(' ');
}

export function createDedupeAdapter(adapter: AxiosAdapter = axios.getAdapter(axios.defaults.adapter)): AxiosAdapter {
  return async (config) => {
    const key = buildRequestDedupeKey(config);
    if (!key) {
      return adapter(config);
    }

    const current = inFlightGetRequests.get(key);
    if (current) {
      return current;
    }

    const requestPromise = adapter(config).finally(() => {
      inFlightGetRequests.delete(key);
    });
    inFlightGetRequests.set(key, requestPromise);
    return requestPromise;
  };
}

function authorizationHeader(headers: DedupeConfig['headers']) {
  if (!headers) {
    return '';
  }

  if (headers instanceof AxiosHeaders) {
    return String(headers.get('Authorization') || '');
  }

  const rawHeaders = headers as Record<string, unknown>;
  return String(rawHeaders.Authorization || rawHeaders.authorization || '');
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
    .join(',')}}`;
}
