import { ErpSalesOrder, SkuMapping } from "../types";

const ERP_BASE_URL = process.env.ERP_API_URL || "https://erp-api.example.com";
const ERP_API_KEY = process.env.ERP_API_KEY || "";

/**
 * Fetches all SKU mappings from the ERP system.
 * The ERP returns mappings in pages of 50.
 */
export async function getSkuMappings(): Promise<SkuMapping[]> {
  const allMappings: SkuMapping[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${ERP_BASE_URL}/item-mappings?page=${page}&per_page=50`, {
      headers: {
        Authorization: `Bearer ${ERP_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`ERP API error: ${response.status} ${response.statusText}`);
    }

   
    const data = (await response.json()) as { mappings: SkuMapping[] };
    allMappings.push(...data.mappings);

    hasMore = data.mappings.length >= 50;
    /**
   * Bug: The pagination loop stopped when a page contained exactly 50 mappings.
   * Since the ERP API returns mappings in pages of 50, the next page was never fetched,
   * causing some SKU mappings to be missed and potentially preventing orders from being
   * mapped correctly in production.
   * I identified this by investigating the failing test for full-page pagination boundaries.
   */

    page++;
  }

  return allMappings;
}

/**
 * Creates a sales order in the ERP system.
 * Returns the ERP sales order ID on success.
 */
export async function createSalesOrder(order: ErpSalesOrder): Promise<string> {
  const response = await fetch(`${ERP_BASE_URL}/sales-orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ERP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create sales order: ${response.status} - ${errorBody}`);
  }

  const result = (await response.json()) as { salesOrderId: string };
  return result.salesOrderId;
}
