import { expect, test } from "vitest";
import { cosineSimilarity } from "../src/resources";

test('Case-1: Empty Vector', () => {
    expect(cosineSimilarity([], [])).toBe(0)
})

test('Case-2: Similar Vectors', () => {
    expect(cosineSimilarity([3, 4], [5, 2])).toBeCloseTo(0.857)
})

test('Case-3: Perpendicular Vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0)
})

test('Case-4: Opposite Vectors', () => {
    expect(cosineSimilarity([2, 3], [-2, -3])).toBeCloseTo(-1)
})