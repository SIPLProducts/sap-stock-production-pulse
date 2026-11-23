/**
 * Entry point bundled into `middleware/sync-core.mjs` so the on-prem scheduler
 * uses exactly the same row mapping and payload-salvage logic as the portal.
 * Regenerate with: npm run build:sync-core
 */
export { mapVendorAgeingPayload, isVendorAgeingEndpoint, withVendorAgeingPayload } from "../../src/lib/vendor-ageing-map";
export { mapCurrentStockPayload, isCurrentStockEndpoint } from "../../src/lib/current-stock-map";
export { mapUserDropdownPayload, isUserDropdownEndpoint } from "../../src/lib/user-dropdown-map";
export {
  extractEmbeddedBody,
  salvageTruncatedArray,
  withPostingDates,
  withEndpointDates,
  keyValueObject,
  formatBytes,
} from "../../src/lib/sap-pull-shared";
