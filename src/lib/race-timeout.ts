/** Reject if `promise` has not settled within `timeoutMs`. */
export async function raceTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = "Timed out",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
