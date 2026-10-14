// Retry only session refreshes, never payments, spins, or form submissions.
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  const refresh = url.pathname.endsWith("/auth/v1/token") && url.searchParams.get("grant_type") === "refresh_token";
  try {
    return await fetch(input, init);
  } catch (error) {
    if (!refresh || !(error instanceof TypeError) || init?.signal?.aborted) throw error;
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Preserve the error if the connection is still unavailable.
    return fetch(input, init);
  }
}
