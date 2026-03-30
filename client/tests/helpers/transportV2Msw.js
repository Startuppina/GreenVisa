import { delay, http, HttpResponse } from 'msw';

export function transportV2GetUrl(certificationId = ':certificationId') {
  return `*/transport-v2/${certificationId}`;
}

export function transportV2PutUrl(certificationId = ':certificationId') {
  return `*/transport-v2/${certificationId}/draft`;
}

export function createTransportV2GetHandler(resolver) {
  return http.get(transportV2GetUrl(), resolver);
}

export function createTransportV2PutHandler(resolver) {
  return http.put(transportV2PutUrl(), resolver);
}

export function jsonResponse(body, init) {
  return HttpResponse.json(body, init);
}

export async function delayedJson(body, ms = 50, init) {
  await delay(ms);
  return HttpResponse.json(body, init);
}
