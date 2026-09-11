import { describe, it, expect } from "vitest";
import {
  dateSchema,
  timeSchema,
  teacherSchema,
  classSchema,
  subjectSchema,
  userSchema,
  parseTimeToDate,
  formatTime,
  formatDate,
} from "./validation";

describe("dateSchema", () => {
  it("accepts valid YYYY-MM-DD", () => {
    expect(dateSchema.safeParse("2026-09-11").success).toBe(true);
  });

  it("rejects missing leading zero", () => {
    expect(dateSchema.safeParse("2026-9-11").success).toBe(false);
  });

  it("rejects non-date strings", () => {
    expect(dateSchema.safeParse("not-a-date").success).toBe(false);
    expect(dateSchema.safeParse("").success).toBe(false);
  });
});

describe("timeSchema", () => {
  it("accepts HH:MM", () => {
    expect(timeSchema.safeParse("08:30").success).toBe(true);
  });

  it("accepts HH:MM:SS", () => {
    expect(timeSchema.safeParse("13:45:00").success).toBe(true);
  });

  it("rejects invalid hours", () => {
    expect(timeSchema.safeParse("25:00").success).toBe(false);
    expect(timeSchema.safeParse("24:01").success).toBe(false);
  });

  it("rejects invalid minutes", () => {
    expect(timeSchema.safeParse("08:60").success).toBe(false);
  });
});

describe("parseTimeToDate", () => {
  it("parses HH:MM into a UTC Date", () => {
    const d = parseTimeToDate("13:45");
    expect(d.getUTCHours()).toBe(13);
    expect(d.getUTCMinutes()).toBe(45);
    expect(d.getUTCSeconds()).toBe(0);
  });

  it("parses HH:MM:SS", () => {
    const d = parseTimeToDate("08:30:15");
    expect(d.getUTCHours()).toBe(8);
    expect(d.getUTCMinutes()).toBe(30);
    expect(d.getUTCSeconds()).toBe(15);
  });
});

describe("formatTime", () => {
  it("formats a Date to HH:MM", () => {
    const d = new Date("1970-01-01T14:30:00Z");
    expect(formatTime(d)).toBe("14:30");
  });

  it("truncates a string to HH:MM", () => {
    expect(formatTime("08:30:00")).toBe("08:30");
  });
});

describe("formatDate", () => {
  it("formats a Date to YYYY-MM-DD", () => {
    const d = new Date("2026-09-11T00:00:00Z");
    expect(formatDate(d)).toBe("2026-09-11");
  });

  it("truncates a datetime string to YYYY-MM-DD", () => {
    expect(formatDate("2026-09-11T10:30:00Z")).toBe("2026-09-11");
  });
});

describe("teacherSchema", () => {
  it("accepts valid teacher data", () => {
    const result = teacherSchema.safeParse({
      name: "Ms. Arshia",
      employee_code: "T001",
      email: "test@example.com",
      status: "active",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = teacherSchema.safeParse({
      name: "",
      employee_code: "T001",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = teacherSchema.safeParse({
      name: "Ms. Arshia",
      employee_code: "T001",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null email", () => {
    const result = teacherSchema.safeParse({
      name: "Ms. Arshia",
      employee_code: "T001",
      email: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("classSchema", () => {
  it("accepts valid class data", () => {
    const result = classSchema.safeParse({
      name: "B1",
      section: "B",
      program: "Engg+Med",
      class_code: "B1",
      status: "active",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing class_code", () => {
    const result = classSchema.safeParse({
      name: "B1",
      class_code: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("subjectSchema", () => {
  it("accepts valid subject", () => {
    const result = subjectSchema.safeParse({ name: "Physics" });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = subjectSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("userSchema", () => {
  it("accepts valid user", () => {
    const result = userSchema.safeParse({
      name: "Admin User",
      username: "admin",
      password: "secret123",
      role: "admin",
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects short username", () => {
    const result = userSchema.safeParse({
      name: "Admin",
      username: "ab",
      role: "admin",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = userSchema.safeParse({
      name: "Admin",
      username: "admin",
      password: "12345",
      role: "admin",
    });
    expect(result.success).toBe(false);
  });

  it("allows missing password (optional for update)", () => {
    const result = userSchema.safeParse({
      name: "Admin",
      username: "admin",
      role: "admin",
    });
    expect(result.success).toBe(true);
  });
});
