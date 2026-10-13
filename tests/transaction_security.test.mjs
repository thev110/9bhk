import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";
import ts from "typescript";
import { matchesCapturedPayment } from "../lib/payments/settlement.ts";

const asModule = code => `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
async function sourceModule(file, imports = {}) {
  let source = await readFile(new URL(file, import.meta.url), "utf8");
  for (const [specifier, replacement] of Object.entries(imports)) source = source.replaceAll(`"${specifier}"`, JSON.stringify(replacement));
  return import(asModule(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText));
}
const gateway = await sourceModule("../lib/payments/razorpay.ts", { "server-only": asModule("export {};"), "@/lib/split": asModule("export const toPaise = amount => Math.round(amount * 100);") });
const captured = { id: "pay_test", order_id: "order_test", amount: 50000, currency: "INR", status: "captured", captured: true, created_at: 1791840000 };
const expected = { orderId: "order_test", amount: 50000, currency: "INR", paymentId: "pay_test" };

test("settlement rejects authorization, wrong amount/currency/order/payer reference", () => {
  assert.equal(matchesCapturedPayment(captured, expected), true);
  for (const changes of [{ status: "authorized" }, { captured: false }, { amount: 1 }, { currency: "USD" }, { order_id: "order_other" }, { id: "pay_other" }, { created_at: NaN }]) assert.equal(matchesCapturedPayment({ ...captured, ...changes }, expected), false);
});
test("webhook HMAC covers the original raw bytes and rejects reordered JSON", async () => {
  const raw = '{"amount":50000, "currency":"INR"}';
  const signature = createHmac("sha256", "offline-test-secret").update(raw).digest("hex");
  assert.equal(await gateway.verifyWebhookSignature(raw, signature, "offline-test-secret"), true);
  assert.equal(await gateway.verifyWebhookSignature(JSON.stringify(JSON.parse(raw)), signature, "offline-test-secret"), false);
  assert.equal(await gateway.verifyWebhookSignature(raw, signature, "wrong-secret"), false);
  assert.equal(gateway.isCaptureEvent("order.paid"), false);
  assert.equal(gateway.isCaptureEvent("payment.authorized"), false);
});

const transactionMocks = { getUser: async () => ({ data: { user: { id: "user-test", email: "staff@example.com", email_confirmed_at: "2026-01-01" } } }), orderCalls: [] };
globalThis.__transactionSecurityMocks = transactionMocks;
const serviceModule = asModule("export const serviceSupabase=()=>globalThis.__transactionSecurityMocks.service; export const userSupabase=()=>({auth:{getUser: (...args)=>globalThis.__transactionSecurityMocks.getUser(...args)}});");
const responseModule = asModule("export const NextResponse={json:(body,options={})=>({body,status:options.status??200})};");
const gatewayModule = asModule("export const readRazorpayEnv=()=>({keyId:'test-key',keySecret:'test-secret'}); export const createOrder=async args=>{globalThis.__transactionSecurityMocks.orderCalls.push(args); return globalThis.__transactionSecurityMocks.createOrder(args)};");
const transactions = await sourceModule("../lib/server/transactions.ts", {
  "server-only": asModule("export {};"), "next/server": responseModule, "@/lib/supabase/service": serviceModule,
  "@/lib/admin": asModule("export const isAdminEmail=email=>email==='staff@example.com';"), "@/lib/payments/razorpay": gatewayModule,
});
test("real auth helper rejects a supplied token that the provider does not validate", async () => {
  transactionMocks.getUser = async () => ({ data: { user: null }, error: { message: "invalid token" } });
  await assert.rejects(transactions.authenticated(new Request("https://local.test", { headers: { Authorization: "Bearer forged" } })), error => error.status === 401);
  transactionMocks.getUser = async () => ({ data: { user: { id: "user-test", email: "staff@example.com" } } });
  await assert.rejects(transactions.authenticated(new Request("https://local.test", { headers: { Authorization: "Bearer test" } }), true), error => error.status === 403);
});
function serviceFixture(intent, bindingError = null) {
  const calls = [];
  const service = {
    rpc: async (name, args) => { calls.push({ name, args }); return name === "bhk_claim_order" ? { data: intent } : { data: null, error: bindingError }; },
    from: () => ({ update: value => { calls.push({ update: value }); return { eq: () => ({ eq: async () => ({ error: null }) }) }; } }),
  };
  return { service, calls };
}
test("order creation uses the persisted amount and fixed server notes", async () => {
  transactionMocks.orderCalls.length = 0;
  transactionMocks.createOrder = async () => ({ id: "order_test", amount: 850000, currency: "INR" });
  const { service, calls } = serviceFixture({ id: "intent-test", amount_paise: 850000, status: "creating" });
  const result = await transactions.checkoutOrder(service, "user-test", "booking", "booking-test");
  assert.equal(result.amount, 850000);
  assert.deepEqual(transactionMocks.orderCalls[0], { amountRupees: 8500, receipt: "intent-test", commissionRate: 0, notes: { intentId: "intent-test" } });
  assert.equal(calls[0].args.p_user, "user-test");
  assert.equal(calls[1].name, "bhk_bind_order");
});
test("a retry reuses its stored order without creating another payable order", async () => {
  transactionMocks.orderCalls.length = 0;
  const { service } = serviceFixture({ id: "intent-test", amount_paise: 50000, currency: "INR", status: "ready", gateway_order_id: "order_existing" });
  assert.equal((await transactions.checkoutOrder(service, "user-test", "subscription")).orderId, "order_existing");
  assert.equal(transactionMocks.orderCalls.length, 0);
});
test("provider or database binding failure never returns a usable checkout", async () => {
  transactionMocks.createOrder = async () => ({ id: "order_test", amount: 50000, currency: "INR" });
  const { service, calls } = serviceFixture({ id: "intent-test", amount_paise: 50000, status: "creating" }, { code: "XX000" });
  await assert.rejects(transactions.checkoutOrder(service, "user-test", "subscription"));
  assert.deepEqual(calls.at(-1), { update: { status: "failed" } });
  transactionMocks.createOrder = async () => ({ id: "order_test", amount: 1, currency: "INR" });
  await assert.rejects(transactions.checkoutOrder(serviceFixture({ id: "bad-amount", amount_paise: 50000, status: "creating" }).service, "user-test", "subscription"));
});
