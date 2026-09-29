import { SplitInvite } from "@/components/split-invite";
import { verifySplitToken } from "@/lib/payments/split-token";

/**
 * Public guest invite page.
 *
 * A server component so the signing secret stays on the server. Verification
 * happens here and the decoded payload is handed to a client component for
 * rendering — the guest never needs an account, and no database row is read,
 * because the share's display data is carried inside the signed token.
 */
export default async function SplitInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const secret = process.env.SPLIT_TOKEN_SECRET;
  const decoded = decodeURIComponent(token);

  // An invalid or expired token is rendered as a normal state, not a crash:
  // invite links get forwarded, screenshotted and left in old chats.
  const payload = secret ? await verifySplitToken(decoded, secret) : null;

  return <SplitInvite token={decoded} payload={payload} />;
}
