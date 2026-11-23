import { describe, expect, it } from "vitest";
import { payShape, toJobPay } from "@/lib/job-pay";

describe("toJobPay", () => {
  it("keeps the figures with their unit", () => {
    expect(
      toJobPay({ payMin: 19, payMax: 23, payUnit: "hour", payText: null }),
    ).toEqual({ text: null, salary: { min: 19, max: 23, unit: "hour" } });
  });

  it("keeps one limit alone", () => {
    expect(
      toJobPay({ payMin: 19, payMax: null, payUnit: "hour" }).salary,
    ).toEqual({ min: 19, max: null, unit: "hour" });
    expect(toJobPay({ payMax: 2500, payUnit: "month" }).salary).toEqual({
      min: null,
      max: 2500,
      unit: "month",
    });
  });

  it("has no figures without a limit or without a unit", () => {
    expect(toJobPay({ payUnit: "hour" }).salary).toBeNull();
    expect(toJobPay({ payMin: 19, payMax: 23 }).salary).toBeNull();
    expect(
      toJobPay({ payMin: 19, payMax: 23, payUnit: null }).salary,
    ).toBeNull();
  });

  it("trims the text and drops an empty one", () => {
    expect(toJobPay({ payText: "  1. Jahr 900 €  " }).text).toBe(
      "1. Jahr 900 €",
    );
    expect(toJobPay({ payText: "   " }).text).toBeNull();
    expect(toJobPay({ payText: null }).text).toBeNull();
    expect(toJobPay({}).text).toBeNull();
  });

  it("keeps both, the text and the figures", () => {
    expect(
      toJobPay({
        payMin: 900,
        payMax: 1100,
        payUnit: "month",
        payText: "1. Jahr 900 €, 3. Jahr 1.100 €",
      }),
    ).toEqual({
      text: "1. Jahr 900 €, 3. Jahr 1.100 €",
      salary: { min: 900, max: 1100, unit: "month" },
    });
  });
});

describe("payShape", () => {
  const salary = (min: number | null, max: number | null) => ({
    text: null,
    salary: { min, max, unit: "hour" as const },
  });

  it("is a range for two different limits", () => {
    expect(payShape(salary(19, 23))).toEqual({
      kind: "range",
      min: 19,
      max: 23,
      unit: "hour",
    });
  });

  it("is one amount for equal limits", () => {
    expect(payShape(salary(20, 20))).toEqual({
      kind: "fixed",
      amount: 20,
      unit: "hour",
    });
  });

  it("reads one limit alone as 'from' or 'up to'", () => {
    expect(payShape(salary(19, null))).toEqual({
      kind: "from",
      min: 19,
      unit: "hour",
    });
    expect(payShape(salary(null, 23))).toEqual({
      kind: "upTo",
      max: 23,
      unit: "hour",
    });
  });

  it("prefers the text over the figures", () => {
    expect(
      payShape({ text: "nach Vereinbarung", salary: salary(19, 23).salary }),
    ).toEqual({ kind: "text", text: "nach Vereinbarung" });
  });

  it("is nothing without text and figures", () => {
    expect(payShape({ text: null, salary: null })).toBeNull();
    expect(payShape(salary(null, null))).toBeNull();
  });
});
