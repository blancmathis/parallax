import data from "./identity.json";

export interface Identity {
  editor: string;
  publicationDirector: string;
  /**
   * "non-professional": LCEN art. 1-1, II lets the publisher withhold their
   * address and phone from the public, if the host holds them.
   */
  publisherStatus: "non-professional" | "professional";
  postalAddress?: string;
  phone?: string;
  contactEmail: string;
  host: { name: string; address: string; phone: string; privacyUrl: string };
}

const identity = data as Identity;

export function isPlaceholder(value: string): boolean {
  return (
    !value.trim() ||
    /TODO|PLACEHOLDER|example\.(?:com|org)|\.invalid/i.test(value)
  );
}

export const CONTACT_MAILTO = isPlaceholder(identity.contactEmail)
  ? null
  : `mailto:${identity.contactEmail}`;

export const SOURCE_ERROR_URL =
  "https://github.com/blancmathis/parallax/issues/new?template=source-alignment.yml";

export default identity;
