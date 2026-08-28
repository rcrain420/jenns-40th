import { grantEventUnlock } from "./auth";
import { JOIN_SITE_ACCESS } from "./join-site-access";
import { markEmailVerified } from "./users";

export { JOIN_SITE_ACCESS };

export async function grantSiteAccessAfterJoin(userId: string) {
  await grantEventUnlock();
  await markEmailVerified(userId);
}
