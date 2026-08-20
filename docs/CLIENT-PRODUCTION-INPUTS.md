# ProductReviews.com.au — client production inputs

Items the client needs to provide or confirm before a public launch.

This list is **not** a technical implementation survey. It does not ask you to choose database engines, analytics vendors’ internals, or hosting platforms unless that choice is needed to complete an account or access request.

Statuses:

- **READY** — already supplied and wired
- **PENDING** — required before a public launch
- **OPTIONAL / DECISION REQUIRED** — not blocking unless you choose to use it, or a related launch decision makes it required

| Item | Status | Notes |
| --- | --- | --- |
| Final Privacy Policy | PENDING | Do not publish internal placeholder copy. Supply the approved text (and last-updated date if you want it shown). |
| Final Terms & Conditions | PENDING | Same as Privacy Policy. |
| Final Disclaimer | PENDING | Same as Privacy Policy. |
| Public contact details | PENDING | At least a contact email. Optional: business name and short instructions. No contact form is planned unless you ask for one later. |
| “Help make Ava smarter” destination | PENDING | The button will stay on the site. Confirm where it should go (page, form, or email). Do not invent a form or mailbox. |
| Conversation retention period | PENDING | How long anonymous Ava questions/answers should be kept for research. No period has been assumed, and automatic deletion is not turned on. |
| Client-owned production AI account and API key | PENDING | Production must use your commercial OpenAI account. The key is stored only on the server, never in the website or in git. |
| Any final Ava instruction adjustments | OPTIONAL / DECISION REQUIRED | Current ProductReviews independence and Australian-market instructions are already in place. Supply changes only if you want Ava’s behaviour adjusted. |
| Analytics (GA4 or Google Tag Manager) | OPTIONAL / DECISION REQUIRED | The site works fully with analytics off. If you want measurement, supply the GA4 Measurement ID (`G-…`) or GTM ID (`GTM-…`) and confirm that the Privacy Policy / notice (and any consent required for your launch context) is approved. |
| Cookie / consent mechanism | OPTIONAL / DECISION REQUIRED | No consent banner is built. Required only if analytics (or other non-essential tracking) is enabled for launch. |
| Production database account / environment | PENDING | Needed so anonymous conversation logging can run in production. Provide access to the production database environment when hosting is chosen. |
| Domain / DNS access | PENDING | `productreviews.com.au` and `www.productreviews.com.au`. |
| Hosting / deployment decision | PENDING | Where the website and API will run. The API address cannot be finalised until this is chosen. |
| Hero image | READY | Existing ProductReviews hero artwork is in use. Do not replace it unless you supply a new approved image. |
| Logo treatment | READY | Text logo (ProductReviews.com.au) is in use. |
| Favicon | OPTIONAL / DECISION REQUIRED | Not supplied. The site can launch with the default browser icon, or you can provide a final favicon. |
| Share / social (OG) image | OPTIONAL / DECISION REQUIRED | Not supplied. Provide one if you want a specific image when the site is shared. |
| Additional Ava portrait (`ava.jpg`) | OPTIONAL / DECISION REQUIRED | Referenced as a fallback only. The live hero image is already set. Do not invent a substitute. |

## Related launch rules (for awareness)

- Analytics stays **off** until you confirm both the property/ID and the privacy/notice position.
- Placeholder legal pages are for internal review only. They must not go live as public policy.
- No affiliate programme, product catalogue, or CMS is part of this launch checklist.
