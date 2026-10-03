import identity from "./identity.json";

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
