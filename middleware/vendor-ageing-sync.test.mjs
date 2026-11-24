import { afterEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ rows: [], bodies: [], deletes: [], failAt: 0, emptyAt: 0, nextId: 0, lastCriterion: null }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  from(table) {
    let operation = 'select', value, criterion, ids;
    const q = {
      select() { return q; }, order() { return q; }, limit() { return q; }, range() { return q; }, gte() { return q; }, in(_k, v) { ids = v; return q; },
      eq(k, v) { criterion = [k, v, false]; return q; }, lt(k, v) { criterion = [k, v, true]; return q; },
      insert(v) { operation = 'insert'; value = v; return q; },
      update(v) { operation = 'update'; value = v; return q; },
      delete() { operation = 'delete'; return q; },
      single() { return q; }, maybeSingle() { return q; },
      then(resolve, reject) {
        try {
          let data = [], count = 0;
          if (table === 'sap_endpoints' && operation === 'select') data = { name: 'Vendor_Ageing', is_active: true, body_template: '{"S_KDATE":"20261123","D1":"30"}', http_method: 'POST', endpoint_path: '/vendor', system_key: 'dev' };
          if (table === 'sap_systems') data = { key: 'dev' };
          if (table === 'sap_sync_runs' && operation === 'insert') data = { id: 'test-run' };
          if (table === 'vendor_ageing' && operation === 'insert') state.rows.push(...value.map((r) => ({ ...r, id: ++state.nextId })));
          if (table === 'vendor_ageing' && operation === 'select' && criterion) {
            state.lastCriterion = criterion;
            data = state.rows.filter((r) => criterion[2] ? r[criterion[0]] < criterion[1] : r[criterion[0]] === criterion[1]).map((r) => ({ id: r.id }));
          }
          if (table === 'vendor_ageing' && operation === 'delete') {
            // Batched cleanup: ids come from the preceding select; record which condition chose them.
            state.deletes.push(ids ? state.lastCriterion : criterion);
            const before = state.rows.length;
            state.rows = ids ? state.rows.filter((r) => !ids.includes(r.id))
              : state.rows.filter((r) => criterion[2] ? r[criterion[0]] >= criterion[1] : r[criterion[0]] !== criterion[1]);
            count = before - state.rows.length;
          }
          return Promise.resolve(resolve({ data, count, error: null }));
        } catch (e) { return reject(e); }
      },
    };
    return q;
  },
}) }));
import { createScheduler } from './scheduler.mjs';

function scheduler() {
  vi.stubEnv('SUPABASE_URL', 'https://example.invalid');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only-not-a-secret');
  state.rows = [{ id: 0, lifnr: 'old', synced_at: '2020-01-01T00:00:00Z' }]; state.bodies = []; state.deletes = [];
  return createScheduler({
    resolveSystem: () => ({ key: 'dev', credentialKey: 'dev' }), logLine: () => {}, newTraceId: () => 'test',
    callSap: async ({ body }) => {
      state.bodies.push(JSON.parse(body));
      if (state.failAt === state.bodies.length) return { ok: false, status: 500, body: '{}' };
      return { ok: true, status: 200, body: JSON.stringify({ DATA: state.emptyAt === state.bodies.length ? [] : [{ LIFNR: '100', WRBTR: '-100' }] }) };
    },
  });
}
afterEach(() => { vi.unstubAllEnvs(); state.failAt = 0; state.emptyAt = 0; });
describe('three-call Vendor Ageing middleware sync', () => {
  it('sends R1/R2/R3 sequentially, stores all labels together and removes old data only once', async () => {
    const s = scheduler(); const result = await s.runEndpoint('Vendor_Ageing', { manual: true });
    expect(result.status).toBe('synced'); expect(result.stored).toBe(3);
    expect(state.bodies.map((b) => [b.R1, b.R2, b.R3])).toEqual([['X', '', ''], ['', 'X', ''], ['', '', 'X']]);
    expect(state.rows.map((r) => r.pc_text)).toEqual(['Due Date', 'Posting Date', 'GRN Date']);
    expect(new Set(state.rows.map((r) => r.synced_at)).size).toBe(1);
    expect(state.deletes.filter((c) => c[2])).toHaveLength(1);
  });
  it('rolls back the first response and retains old data if R2 fails', async () => {
    state.failAt = 2; const result = await scheduler().runEndpoint('Vendor_Ageing', { manual: true });
    expect(result.status).toBe('error'); expect(state.bodies).toHaveLength(2);
    expect(state.rows.map((r) => r.lifnr)).toEqual(['old']);
    expect(state.deletes.filter((c) => c[2])).toHaveLength(0);
  });
  it('retains old data when R3 returns an empty response', async () => {
    state.emptyAt = 3; const result = await scheduler().runEndpoint('Vendor_Ageing', { manual: true });
    expect(result.status).toBe('error'); expect(state.bodies).toHaveLength(3);
    expect(state.rows.map((r) => r.lifnr)).toEqual(['old']);
  });
});
