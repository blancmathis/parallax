import identity, {
  CONTACT_MAILTO,
  SOURCE_ERROR_URL,
  isPlaceholder,
} from "../config/identity";
import { useI18n } from "../i18n";
import { usePageTitle } from "../lib/ui";

export default function LegalPage({
  kind,
}: {
  kind: "legal" | "privacy" | "contact";
}) {
  const { t } = useI18n();
  const copy = t.legal;
  usePageTitle(`${copy[kind].title} — Parallax`);

  return (
    <main className="page method legalpage">
      <header className="method__head">
        <h1 className="section__title section__title--big">
          {copy[kind].title}
        </h1>
        <p className="section__lede">{copy[kind].lede}</p>
      </header>

      {kind === "legal" && (
        <>
          <section className="method__section">
            <h2>{copy.editorTitle}</h2>
            <p>
              {copy.editor} : {identity.editor}
            </p>
            <p>
              {copy.director} : {identity.publicationDirector}
            </p>
            <p>
              {isPlaceholder(identity.postalAddress) ? (
                copy.addressPending
              ) : (
                <>
                  {copy.address} : {identity.postalAddress}
                </>
              )}
            </p>
            <p>
              {CONTACT_MAILTO ? (
                <>
                  {copy.email} :{" "}
                  <a className="link" href={CONTACT_MAILTO}>
                    {identity.contactEmail}
                  </a>
                </>
              ) : (
                copy.emailPending
              )}
            </p>
          </section>
          <section className="method__section">
            <h2>{copy.hostTitle}</h2>
            <p>{identity.host.name}</p>
            <p className="legal-host__address">{identity.host.address}</p>
            <p className="legal-host__phone">{identity.host.phone}</p>
            <p>
              <a className="link" href={identity.host.privacyUrl}>
                {copy.hostPolicy}
              </a>
            </p>
          </section>
          <section className="method__section">
            <h2>{copy.sourceTitle}</h2>
            <p>{copy.sourceBody}</p>
          </section>
        </>
      )}

      {kind === "privacy" && (
        <>
          {copy.privacySections.map((section) => (
            <section key={section.title} className="method__section">
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <section className="method__section">
            <h2>{copy.contact.title}</h2>
            <p>
              {CONTACT_MAILTO ? (
                <a className="link" href={CONTACT_MAILTO}>
                  {identity.contactEmail}
                </a>
              ) : (
                copy.emailPending
              )}
            </p>
            <p>
              <a className="link" href={identity.host.privacyUrl}>
                {copy.hostPolicy}
              </a>
            </p>
            <p>
              <a
                className="link"
                href="https://www.cnil.fr/fr/contacter-la-cnil"
              >
                {copy.rightsLink}
              </a>
            </p>
          </section>
        </>
      )}

      {kind === "contact" && (
        <>
          <section className="method__section">
            <h2>{copy.reportError}</h2>
            <p>{copy.reportBody}</p>
            <p>
              <a className="link" href={SOURCE_ERROR_URL}>
                {copy.reportError}
              </a>
            </p>
          </section>
          <section className="method__section">
            <h2>{copy.privateTitle}</h2>
            <p>{copy.privateBody}</p>
            <p>
              {CONTACT_MAILTO ? (
                <a className="link" href={CONTACT_MAILTO}>
                  {identity.contactEmail}
                </a>
              ) : (
                copy.emailPending
              )}
            </p>
            <p>
              <a
                className="link"
                href="https://github.com/blancmathis/parallax/security/advisories/new"
              >
                {copy.securityLink}
              </a>
            </p>
          </section>
        </>
      )}
    </main>
  );
}
