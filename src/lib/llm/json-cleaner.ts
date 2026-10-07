/**
 * Cleans and safely parses JSON returned from any LLM, handling markdown fences,
 * preamble text, and trailing characters.
 */
export function cleanAndParseJson<T = any>(rawText: string): T {
  let cleaned = rawText.trim();

  // Strip markdown code fences ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
    cleaned = cleaned.trim();
  }

  // Find outermost JSON object
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    // Attempt basic cleanup for trailing commas
    const fixedTrailingCommas = cleaned.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(fixedTrailingCommas);
    } catch {
      throw new Error(`Failed to parse AI response as JSON: ${err.message}. Raw output: ${rawText.slice(0, 150)}...`);
    }
  }
}
