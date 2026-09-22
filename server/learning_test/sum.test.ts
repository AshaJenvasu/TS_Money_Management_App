import { expect, test, describe } from "vitest";

interface User {
  name: string;
  age: number;
}

function createUser(name: string, age: number): User {
  return { name, age };
}

describe("Math.sqrt", () => {
  test("returns the square root of perfect squares", () => {
    expect(Math.sqrt(4)).toBe(2);
    expect(Math.sqrt(9)).toBe(3);
  });

  test("returns NaN for negative numbers", () => {
    expect(Math.sqrt(-1)).toBeNaN();
  });

  test("returns 0 for 0", () => {
    expect(Math.sqrt(0)).toBe(0);
  });
});

test("creates a user with the correct fields", () => {
  const user = createUser("Alice", 30);

  expect(user).toEqual({ name: "Alice", age: 30 });
  expect(user.name).toBe("Alice");
});
