/**
 * SAP data provider (browser-safe).
 *
 * The portal ships as a static SPA, so this module runs in the browser and
 * serves the deterministic sample dataset. Live S/4HANA OData reads are done
 * by the middleware service (never from the browser, so SAP credentials are
 * never exposed) and plug in behind the same function signatures.
 */
import { moduleKpiValues, moduleReport, type ModuleReport } from "./sap-mock-modules";

export type ProviderMode = "mock" | "odata";

export function providerMode(): ProviderMode {
  return "mock";
}

/** Analytical report for one supported SAP module (SD, FI, PP). */
export async function getModuleReportData(key: string): Promise<ModuleReport | null> {
  return moduleReport(key);
}


export async function getKpiValues(): Promise<
  Record<string, { value: number; unit?: string; footer?: string; trend?: number[] }>
> {
  return { ...moduleKpiValues() };
}
