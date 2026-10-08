import assert from 'node:assert/strict';
import test from 'node:test';
import { allowedReturnResolutions, canConfirmReturnRefund, canDecideReturn, canRejectReturn, returnRefundMessage } from './return-workflow-policy.ts';
import { collectRequestPages } from './return-pagination.ts';

test('refund remains available for incorrect order information and the default print defect', () => {
  assert.ok(allowedReturnResolutions.R08.includes('REFUND'));
  assert.equal(allowedReturnResolutions.R01[0], 'REFUND');
});

test('completed and in-flight refunds cannot trigger another transfer, while failed refunds can retry', () => {
  assert.equal(canConfirmReturnRefund('COMPLETED', 'REFUNDED'), false);
  assert.equal(canConfirmReturnRefund('CONVERTED_TO_REFUND', 'PROCESSING'), false);
  assert.equal(canConfirmReturnRefund('CONVERTED_TO_REFUND', 'REFUNDED'), false);
  assert.equal(canConfirmReturnRefund('CONVERTED_TO_REFUND', 'FAILED'), true);
  assert.equal(canConfirmReturnRefund('CONVERTED_TO_REFUND', 'PENDING'), true);
  assert.equal(canConfirmReturnRefund('AWAITING_ADMIN_REFUND'), true);
});

test('rejection is available during adjudication and hidden after the final decision', () => {
  assert.equal(canRejectReturn('DISPUTED'), true);
  assert.equal(canRejectReturn('PRINTER_PROPOSED_FAULT_CHANGE'), true);
  assert.equal(canRejectReturn('CONVERTED_TO_REFUND'), false);
  assert.equal(canDecideReturn('COMPLETED'), false);
  assert.equal(canDecideReturn('CONVERTED_TO_REFUND'), false);
});

test('approval alone never reports the money as transferred', () => {
  assert.match(returnRefundMessage('PENDING_INTEGRATION'), /chưa.*xác nhận/i);
  assert.match(returnRefundMessage('PENDING'), /Chưa có xác nhận/);
  assert.match(returnRefundMessage('FAILED'), /chưa thành công/);
  assert.match(returnRefundMessage('REFUNDED'), /xác nhận thành công/);
});

test('older refund cases remain accessible when the server uses its own page size', async () => {
  const requests = Array.from({ length: 21 }, (_, index) => `request-${index + 1}`);
  const fetched: number[] = [];
  const items = await collectRequestPages(async page => {
    fetched.push(page);
    return { items: requests.slice((page - 1) * 20, page * 20), total: requests.length, page, pageSize: 20 };
  });
  assert.deepEqual(items, requests);
  assert.deepEqual(fetched, [1, 2]);
});

test('empty return list completes without fetching another page', async () => {
  let calls = 0;
  assert.deepEqual(await collectRequestPages(async page => { calls += 1; return { items: [], total: 0, page, pageSize: 20 }; }), []);
  assert.equal(calls, 1);
});
