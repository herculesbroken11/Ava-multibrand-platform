import Script from "next/script";
import type { BrandConfig } from "@/brands/types";
import { resolveAnalyticsConfig } from "@/lib/analytics/config";

function inlineInit(measurementId?: string): string {
  const gtagConfig = measurementId
    ? `gtag('config','${measurementId}',{anonymize_ip:true,page_location:pageLocation});`
    : "";

  return `
(function () {
  try {
    var url = new URL(window.location.href);
    if (url.searchParams.has('q')) {
      url.searchParams.delete('q');
      var search = url.searchParams.toString();
      window.history.replaceState(window.history.state, '', search ? url.pathname + '?' + search + url.hash : url.pathname + url.hash);
    }
    var pageLocation = window.location.origin + window.location.pathname + window.location.hash;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('set', { page_location: pageLocation });
    ${gtagConfig}
  } catch (e) {}
})();
`;
}

export function AnalyticsScripts({ brand }: { brand: BrandConfig }) {
  const config = resolveAnalyticsConfig(brand);

  if (!config.enabled) return null;

  if (config.mode === "gtm" && config.gtmId) {
    return (
      <>
        <Script id="analytics-init" strategy="afterInteractive">
          {inlineInit()}
        </Script>
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${config.gtmId}');`}
        </Script>
      </>
    );
  }

  if (config.mode === "gtag" && config.gaMeasurementId) {
    return (
      <>
        <Script id="analytics-init" strategy="afterInteractive">
          {inlineInit(config.gaMeasurementId)}
        </Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${config.gaMeasurementId}`}
          strategy="afterInteractive"
        />
      </>
    );
  }

  return null;
}
