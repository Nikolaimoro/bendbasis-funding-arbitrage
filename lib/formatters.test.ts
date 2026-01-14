/**
 * Unit tests for formatters
 * Run with: npm test -- lib/formatters.test.ts
 */

import {
  formatCompactUSD,
  formatUSD,
  formatAPR,
  formatPercent,
  normalizeToken,
  normalizeSymbol,
} from "./formatters";

describe("number formatters", () => {
  describe("formatCompactUSD", () => {
    it("should format large numbers as compact USD", () => {
      expect(formatCompactUSD(1500000)).toBe("$1.5M");
      expect(formatCompactUSD(2300000)).toBe("$2.3M");
      expect(formatCompactUSD(1500)).toBe("$1.5K");
      expect(formatCompactUSD(150)).toBe("$150");
    });

    it("should handle null and NaN", () => {
      expect(formatCompactUSD(null)).toBe("–");
      expect(formatCompactUSD(NaN)).toBe("–");
      expect(formatCompactUSD(undefined as any)).toBe("–");
    });

    it("should handle zero", () => {
      expect(formatCompactUSD(0)).toBe("$0");
    });
  });

  describe("formatUSD", () => {
    it("should format numbers as full USD", () => {
      expect(formatUSD(1234567)).toBe("$1,234,567");
      expect(formatUSD(1000)).toBe("$1,000");
      expect(formatUSD(100)).toBe("$100");
    });

    it("should handle null and NaN", () => {
      expect(formatUSD(null)).toBe("–");
      expect(formatUSD(NaN)).toBe("–");
    });

    it("should truncate decimals", () => {
      expect(formatUSD(1234.567)).toBe("$1,235");
    });
  });

  describe("formatAPR", () => {
    it("should format as percentage with 2 decimals", () => {
      expect(formatAPR(5.2567)).toBe("5.26%");
      expect(formatAPR(10.1)).toBe("10.10%");
      expect(formatAPR(0.05)).toBe("0.05%");
    });

    it("should handle null and NaN", () => {
      expect(formatAPR(null)).toBe("–");
      expect(formatAPR(NaN)).toBe("–");
    });

    it("should handle zero", () => {
      expect(formatAPR(0)).toBe("0.00%");
    });

    it("should handle negative values", () => {
      expect(formatAPR(-5.25)).toBe("-5.25%");
    });
  });

  describe("formatPercent", () => {
    it("should format with default 2 decimals", () => {
      expect(formatPercent(5.2567)).toBe("5.26%");
      expect(formatPercent(100)).toBe("100.00%");
    });

    it("should format with custom decimal places", () => {
      expect(formatPercent(5.2567, 1)).toBe("5.3%");
      expect(formatPercent(5.2567, 3)).toBe("5.257%");
      expect(formatPercent(5.2567, 0)).toBe("5%");
    });

    it("should handle null and NaN", () => {
      expect(formatPercent(null)).toBe("–");
      expect(formatPercent(NaN)).toBe("–");
    });
  });
});

describe("text formatters", () => {
  describe("normalizeToken", () => {
    it("should convert to uppercase", () => {
      expect(normalizeToken("pepe")).toBe("PEPE");
      expect(normalizeToken("eth")).toBe("ETH");
      expect(normalizeToken("BtC")).toBe("BTC");
    });

    it("should handle whitespace", () => {
      expect(normalizeToken(" PEPE ")).toBe("PEPE");
      expect(normalizeToken(" pepe ")).toBe("PEPE");
    });

    it("should handle empty/null", () => {
      expect(normalizeToken("")).toBe("");
      expect(normalizeToken(null as any)).toBe("");
    });

    it("should work with all base_asset values from database", () => {
      // base_asset in DB already has multipliers removed
      expect(normalizeToken("PEPE")).toBe("PEPE");
      expect(normalizeToken("BABYDOGE")).toBe("BABYDOGE");
      expect(normalizeToken("shib")).toBe("SHIB");
    });
  });

  describe("normalizeSymbol", () => {
    it("should be an alias for normalizeToken", () => {
      expect(normalizeSymbol("1000PEPE")).toBe(normalizeToken("1000PEPE"));
      expect(normalizeSymbol("eth10")).toBe(normalizeToken("eth10"));
    });
  });
});
