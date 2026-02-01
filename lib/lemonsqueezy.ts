import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

/**
 * Configure Lemon Squeezy with the API key.
 */
export function setupLemonSqueezy() {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "LEMON_SQUEEZY_API_KEY is not set in environment variables",
    );
  }

  lemonSqueezySetup({
    apiKey,
    onError: (error) => {
      console.error("Lemon Squeezy error:", error);
    },
  });
}
