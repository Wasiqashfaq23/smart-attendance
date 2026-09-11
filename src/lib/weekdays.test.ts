import { describe, it, expect } from "vitest";
import { DAY_LABELS, dayTypeFor, isWorkingDay, activeDays } from "./weekdays";

describe("DAY_LABELS", () => {
  it("maps all 6 days to display labels", () => {
    expect(DAY_LABELS.monday).toBe("Monday");
    expect(DAY_LABELS.tuesday).toBe("Tuesday");
    expect(DAY_LABELS.wednesday).toBe("Wednesday");
    expect(DAY_LABELS.thursday).toBe("Thursday");
    expect(DAY_LABELS.friday).toBe("Friday");
    expect(DAY_LABELS.saturday).toBe("Saturday");
  });
});

describe("dayTypeFor", () => {
  it("returns 'friday' for friday", () => {
    expect(dayTypeFor("friday")).toBe("friday");
  });

  it("returns 'saturday' for saturday", () => {
    expect(dayTypeFor("saturday")).toBe("saturday");
  });

  it("returns 'mon_thu' for monday", () => {
    expect(dayTypeFor("monday")).toBe("mon_thu");
  });

  it("returns 'mon_thu' for tuesday", () => {
    expect(dayTypeFor("tuesday")).toBe("mon_thu");
  });

  it("returns 'mon_thu' for wednesday", () => {
    expect(dayTypeFor("wednesday")).toBe("mon_thu");
  });

  it("returns 'mon_thu' for thursday", () => {
    expect(dayTypeFor("thursday")).toBe("mon_thu");
  });
});

describe("isWorkingDay", () => {
  it("returns true when workingDays is null", () => {
    expect(isWorkingDay("monday", null)).toBe(true);
  });

  it("returns true when workingDays is undefined", () => {
    expect(isWorkingDay("monday")).toBe(true);
  });

  it("returns true for included day", () => {
    expect(isWorkingDay("monday", "monday,tuesday,wednesday")).toBe(true);
  });

  it("returns false for excluded day", () => {
    expect(isWorkingDay("friday", "monday,tuesday,wednesday")).toBe(false);
  });

  it("handles whitespace in the string", () => {
    expect(isWorkingDay("tuesday", "monday , tuesday , wednesday")).toBe(true);
  });

  it("handles empty string (no working days)", () => {
    expect(isWorkingDay("monday", "")).toBe(false);
  });
});

describe("activeDays", () => {
  it("returns all 6 days when workingDays is null", () => {
    expect(activeDays(null)).toHaveLength(6);
  });

  it("filters to only the included days", () => {
    const result = activeDays("monday,wednesday,friday");
    expect(result).toEqual(["monday", "wednesday", "friday"]);
  });

  it("returns empty array when no days match", () => {
    expect(activeDays("sunday")).toEqual([]);
  });
});
