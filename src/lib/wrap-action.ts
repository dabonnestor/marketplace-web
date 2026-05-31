type ActionResult<T extends Record<string, unknown>> =
  | (T & { error?: undefined })
  | { success: false; error: string }

export async function wrapAction<T extends Record<string, unknown>>(
  fn: () => Promise<T>,
  fallbackError: string
): Promise<ActionResult<T>> {
  try {
    return await fn()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : fallbackError,
    }
  }
}
