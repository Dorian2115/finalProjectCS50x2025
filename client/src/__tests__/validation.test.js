//validation.test.js
// [ ] displayName: pusty, 2 znaki, 3 znaki, 20, 21
// [ ] password: pusty, 7, 8, 100, 101 znaków
// [ ] confirmPassword: pusty, różny, zgodny
// [ ] email: pusty, poprawny, bez @, bez domeny
// [ ] email: jan.kowalski@gmail.com, a@sub.domain.pl — sprawdź, co wyjdzie (patrz HINTS)
// Użyj test.each / it.each zamiast kopiowania testów.
import { validateField } from "../utils/validation.js";
import * as crypto from "node:crypto";
import { expect, test } from "vitest";

test("displayName nie może być pusty", () => {
  expect(validateField("displayName", "")).toBe("Imię jest wymagane");
});
test("displayName jest nieprawidłowy przy 2 znakach", () => {
  const name = "a".repeat(2);
  expect(validateField("displayName", name)).toBe(
    "Imię musi mieć od 3 do 20 znaków",
  );
});
test("displayName jest prawidłowy przy 3 znakach", () => {
  const name = "a".repeat(3);
  expect(validateField("displayName", name)).toBe("");
});
test("displayName jest prawidłowy przy 20 znakach", () => {
  const name = "a".repeat(20);
  expect(validateField("displayName", name)).toBe("");
});
test("displayName jest nieprawidłowy przy 21 znakach", () => {
  const name = "a".repeat(21);
  expect(validateField("displayName", name)).toBe(
    "Imię musi mieć od 3 do 20 znaków",
  );
});

/*============================================================*/

test("password nie może byc pusty", () => {
  expect(validateField("password", "")).toBe("Hasło jest wymagane");
});

test("password jest nieprawidłowe przy 7 znakach", () => {
  const password = "a".repeat(7);
  expect(validateField("password", password)).toBe(
    "Hasło musi mieć od 8 do 100 znaków",
  );
});

test("password jest prawidłowe przy 8 znakach", () => {
  const password = "a".repeat(8);
  expect(validateField("password", password)).toBe("");
});

test("password jest prawidłowe przy 100 znakach", () => {
  const password = "a".repeat(100);
  expect(validateField("password", password)).toBe("");
});

test("password jest nieprawidłowe przy 101 znakach", () => {
  const password = "a".repeat(101);
  expect(validateField("password", password)).toBe(
    "Hasło musi mieć od 8 do 100 znaków",
  );
});

/*============================================================*/
/*
[ ] confirmPassword: pusty, różny, zgodny
*/
test("confrimPassword nie moze być pusty", () => {
  expect(validateField("confirmPassword", "")).toBe(
    "Potwierdzenie hasła jest wymagane",
  );
});

test("confrimPassword nie moze być różny", () => {
  expect(validateField("confirmPassword", "password", "testPassword")).toBe(
    "Hasła nie są zgodne",
  );
});

test("confrimPassword nie moze być różny", () => {
  expect(validateField("confirmPassword", "testPassword", "testPassword")).toBe(
    "",
  );
});

/*============================================================*/
/*
[ ] email: pusty, poprawny, bez @, bez domeny
*/

test("email nie moze być pusty", () => {
  expect(validateField("email", "")).toBe("Email jest wymagany");
});

test("email poprawny", () => {
  const email = "test@test.com";
  expect(validateField("email", "test@test.com", email)).toBe("");
});

test("email bez @", () => {
  const email = "test@test.com";
  expect(validateField("email", "test", email)).toBe(
    "Email jest nieprawidłowy",
  );
});

test("email bez domeny", () => {
  const email = "test@test.com";
  expect(validateField("email", "test@test", email)).toBe(
    "Email jest nieprawidłowy",
  );
});

test("Przypadek graniczny: jan.kowalski@gmail.com", () => {
  const email = "jan.kowalski@gmail.com";
  expect(validateField("email", email)).toBe("");
});

test("Przypadek graniczny: a@sub.domain.pl", () => {
  const email = "a@sub.domain.pl";
  expect(validateField("email", email)).toBe("");
});
