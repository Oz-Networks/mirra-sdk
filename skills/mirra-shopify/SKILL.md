---
name: mirra-shopify
description: "Use Mirra to shopify store management — products, orders, customers, inventory, collections, pages, blogs, articles, themes, menus, redirects, and discount codes. Covers all Shopify SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Shopify

Shopify store management — products, orders, customers, inventory, collections, pages, blogs, articles, themes, menus, redirects, and discount codes

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

> **Note:** Shopify requires OAuth authentication. The user must have connected their Shopify account in the Mirra app before these operations will work.

## API Call Pattern

All operations use a single POST endpoint with the resource ID and method in the body:

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "resourceId": "shopify",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/shopify/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `updateVariant` | Update a single product variant — price, compare-at price, SKU, barcode, taxability, inventory po... |
| `refundOrder` | Refund an order — either specific line items (partial refund) or all refundable items. Money is a... |
| `fulfillOrder` | Fulfill an order (mark items as shipped) and optionally attach tracking. Fulfills either specific... |
| `updateFulfillmentTracking` | Update the tracking information on an existing fulfillment (for example to add a tracking number ... |
| `createCollection` | Create a manual (custom) collection — a hand-picked grouping of products. Supports a theme templa... |
| `updateCollection` | Update a manual (custom) collection — title, description, theme template suffix, sort order, imag... |
| `deleteCollection` | Delete a collection. This removes the collection grouping only — the products that belonged to it... |
| `addProductsToCollection` | Add one or more products to a manual (custom) collection. This is additive — a product keeps its ... |
| `removeProductsFromCollection` | Remove one or more products from a manual (custom) collection. The products themselves are not de... |
| `publishCollection` | Publish or unpublish an existing collection on the Online Store sales channel, making it visible ... |
| `listProducts` | List products in the Shopify store with optional filtering and pagination. Returns up to 50 produ... |
| `getProduct` | Get a single product by its Shopify product ID. Returns full product details including all varian... |
| `createProduct` | Create a new product in the Shopify store. At minimum, a title is required. Set status to "draft"... |
| `updateProduct` | Update an existing product. Only the fields you provide will be updated; omitted fields remain un... |
| `deleteProduct` | Permanently delete a product from the Shopify store. This action cannot be undone. |
| `listOrders` | List orders from the Shopify store with optional filtering. Returns up to 50 orders per page sort... |
| `getOrder` | Get a single order by its Shopify order ID. Returns full order details including line items and c... |
| `getPaymentsBalance` | Get the store's Shopify Payments balance and recent payouts (bank deposits). Useful for profit/ca... |
| `createOrder` | Create a new order in the Shopify store. Requires at least one line item. Can optionally include ... |
| `cancelOrder` | Cancel an existing order. The order must be open. Optionally specify a reason for cancellation. |
| `closeOrder` | Close an open order. A closed order is one that has no more work to be done (e.g., fully fulfille... |
| `listCustomers` | List customers from the Shopify store with optional pagination. Returns up to 50 customers per page. |
| `getCustomer` | Get a single customer by their Shopify customer ID. Returns full customer details including addre... |
| `createCustomer` | Create a new customer in the Shopify store. At minimum, either an email or a phone number is requ... |
| `updateCustomer` | Update an existing customer. Only the fields you provide will be updated. |
| `searchCustomers` | Search customers by a query string. Searches across email, name, and other fields. Returns up to ... |
| `getInventoryLevels` | Get inventory levels. With no arguments, returns levels for all inventory items (up to limit). Op... |
| `adjustInventory` | Adjust the available inventory quantity for an item at a specific location. The adjustment is rel... |
| `listCollections` | List collections in the Shopify store. Returns both custom collections and smart collections comb... |
| `listPages` | List pages in the Shopify store with optional pagination. |
| `getPage` | Get a single page by ID. |
| `createPage` | Create a new page in the Shopify store. |
| `updatePage` | Update a page. |
| `deletePage` | Permanently delete a page. |
| `listBlogs` | List blogs in the Shopify store. |
| `getBlog` | Get a blog by ID. |
| `createBlog` | Create a blog. |
| `updateBlog` | Update a blog. |
| `deleteBlog` | Delete a blog. |
| `listArticles` | List articles in a blog. |
| `getArticle` | Get an article by ID. |
| `createArticle` | Create an article in a blog. |
| `updateArticle` | Update an article. |
| `deleteArticle` | Delete an article. |
| `listThemes` | List all themes in the Shopify store. |
| `getTheme` | Get a theme by ID. |
| `publishTheme` | Publish (activate) a theme as the main theme. |
| `listThemeFiles` | List files in a theme. |
| `getThemeFile` | Get a single theme file with its content. |
| `upsertThemeFiles` | Create or update theme files. |
| `deleteThemeFiles` | Delete theme files. |
| `listMenus` | List navigation menus. |
| `getMenu` | Get a menu by ID. |
| `createMenu` | Create a navigation menu. |
| `updateMenu` | Update a menu. |
| `deleteMenu` | Delete a menu. |
| `listRedirects` | List URL redirects. |
| `createRedirect` | Create a URL redirect. |
| `updateRedirect` | Update a redirect. |
| `deleteRedirect` | Delete a redirect. |
| `createCoupon` | Create a discount code (coupon) that customers can enter at checkout for a percentage or fixed-am... |

## Operation Details

### `updateVariant`

Update a single product variant — price, compare-at price, SKU, barcode, taxability, inventory policy, and variant option values. Variant edits are product-scoped in the Shopify Admin API, so both productId and variantId are required. Use inventoryPolicy "continue" to keep selling a variant when it is out of stock, or "deny" to stop selling it when inventory reaches zero.

**Arguments:**

- `productId` (string, **required**): The ID of the product the variant belongs to.
- `variantId` (string, **required**): The ID of the variant to update.
- `price` (string, *optional*): New price as a decimal string (e.g. "19.99").
- `compareAtPrice` (string, *optional*): New compare-at ("was") price as a decimal string. Pass an empty string to clear it.
- `sku` (string, *optional*): New SKU (stock keeping unit) for the variant.
- `barcode` (string, *optional*): New barcode (ISBN, UPC, GTIN, etc.) for the variant.
- `taxable` (boolean, *optional*): Whether the variant is subject to tax.
- `inventoryPolicy` (string, *optional*): Inventory policy: "continue" to keep selling when out of stock, or "deny" to stop selling when out of stock.
- `options` (array, *optional*): New variant option values in order (e.g. ["Large", "Red"]) to replace the variant's current option values. Must match the number of product options.

**Returns:**

`ShopifyVariant`: Returns the updated variant with id, title, price, compareAtPrice, sku, inventoryQuantity, inventoryPolicy, option values, barcode, and taxable.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"updateVariant","params":{"productId":"1234567890","variantId":"9876543210","price":"24.99","inventoryPolicy":"continue"}}' | jq .
```

### `refundOrder`

Refund an order — either specific line items (partial refund) or all refundable items. Money is actually returned to the customer: the operation computes the suggested refund (transactions, taxes, and amounts) for the requested items, then creates the refund against the original payment. Optionally restock the refunded items and refund shipping.

**Arguments:**

- `orderId` (string, **required**): The ID of the order to refund.
- `lineItems` (array, *optional*): Line items to refund, each an object { lineItemId: string, quantity: number }. Omit to refund all remaining refundable items on the order.
- `refundShipping` (boolean, *optional*): Whether to also refund the full remaining shipping amount. Defaults to false.
- `note` (string, *optional*): An optional note describing the reason for the refund (shown in the Shopify admin).
- `notify` (boolean, *optional*): Whether to send the customer a refund notification email. Defaults to false.
- `restock` (boolean, *optional*): Whether to restock the refunded items back into inventory. Defaults to true.

**Returns:**

`ShopifyRefund`: Returns the created refund: { id, orderId, note, totalRefunded, currency, createdAt }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"refundOrder","params":{"orderId":"450789469","lineItems":[{"lineItemId":"518995019","quantity":2}],"restock":true,"notify":true}}' | jq .
```

### `fulfillOrder`

Fulfill an order (mark items as shipped) and optionally attach tracking. Fulfills either specific line items (split/partial fulfillment) or all remaining unfulfilled items. Resolves the order's fulfillment orders automatically. Tracking number, carrier, and URL are optional; set notifyCustomer to email the customer a shipping confirmation.

**Arguments:**

- `orderId` (string, **required**): The ID of the order to fulfill.
- `lineItems` (array, *optional*): Line items to fulfill, each an object { lineItemId: string, quantity: number }. Omit to fulfill all remaining unfulfilled items.
- `trackingNumber` (string, *optional*): Tracking number for the shipment.
- `trackingCompany` (string, *optional*): Shipping carrier name (e.g. "UPS", "USPS", "FedEx").
- `trackingUrl` (string, *optional*): A URL where the customer can track the shipment.
- `notifyCustomer` (boolean, *optional*): Whether to send the customer a shipping notification email. Defaults to false.

**Returns:**

`ShopifyFulfillment`: Returns the created fulfillment: { id, orderId, status, trackingNumber, trackingCompany, trackingUrl, createdAt }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"fulfillOrder","params":{"orderId":"450789469","trackingNumber":"1Z999AA10123456784","trackingCompany":"UPS","notifyCustomer":true}}' | jq .
```

### `updateFulfillmentTracking`

Update the tracking information on an existing fulfillment (for example to add a tracking number after the fact, correct the carrier, or replace the tracking URL). Optionally notify the customer of the updated tracking.

**Arguments:**

- `fulfillmentId` (string, **required**): The ID of the fulfillment to update.
- `trackingNumber` (string, *optional*): The tracking number to set on the fulfillment.
- `trackingCompany` (string, *optional*): Shipping carrier name (e.g. "UPS", "USPS", "FedEx").
- `trackingUrl` (string, *optional*): A URL where the customer can track the shipment.
- `notifyCustomer` (boolean, *optional*): Whether to send the customer an updated-tracking notification email. Defaults to false.

**Returns:**

`ShopifyFulfillment`: Returns the updated fulfillment: { id, orderId, status, trackingNumber, trackingCompany, trackingUrl, createdAt }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"updateFulfillmentTracking","params":{"fulfillmentId":"255858046","trackingNumber":"1Z999AA10123456784","trackingCompany":"UPS","notifyCustomer":true}}' | jq .
```

### `createCollection`

Create a manual (custom) collection — a hand-picked grouping of products. Supports a theme template suffix (e.g. "preview" or "landing") so the collection can render with a custom theme template, and a visibility flag that publishes (or hides) the collection on the Online Store sales channel. Products are added separately via addProductsToCollection; a product can belong to multiple collections at once.

**Arguments:**

- `title` (string, **required**): The collection title.
- `descriptionHtml` (string, *optional*): The collection description as HTML.
- `templateSuffix` (string, *optional*): Theme template suffix to render the collection with a custom template, e.g. "preview" renders templates/collection.preview.liquid. Omit for the default template.
- `published` (boolean, *optional*): Whether the collection is visible on the Online Store sales channel. true publishes it, false hides it. Defaults to false.
- `sortOrder` (string, *optional*): How products are ordered within the collection (e.g. "MANUAL", "BEST_SELLING", "ALPHA_ASC", "PRICE_DESC", "CREATED").
- `imageUrl` (string, *optional*): URL of an image to use as the collection image.
- `imageAlt` (string, *optional*): Alt text for the collection image.

**Returns:**

`ShopifyCollection`: Returns the created collection with id, title, bodyHtml, handle, sortOrder, collectionType ("custom"), imageUrl, and productsCount.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"createCollection","params":{"title":"Summer Launch","descriptionHtml":"<p>Our summer collection</p>","templateSuffix":"landing","published":false}}' | jq .
```

### `updateCollection`

Update a manual (custom) collection — title, description, theme template suffix, sort order, image, and visibility on the Online Store sales channel. Only the provided fields are changed.

**Arguments:**

- `collectionId` (string, **required**): The ID of the collection to update.
- `title` (string, *optional*): New collection title.
- `descriptionHtml` (string, *optional*): New collection description as HTML.
- `templateSuffix` (string, *optional*): New theme template suffix (e.g. "preview" / "landing"). Pass an empty string to reset to the default template.
- `published` (boolean, *optional*): Whether the collection is visible on the Online Store sales channel. true publishes it, false hides it.
- `sortOrder` (string, *optional*): How products are ordered within the collection (e.g. "MANUAL", "BEST_SELLING", "ALPHA_ASC", "PRICE_DESC", "CREATED").
- `imageUrl` (string, *optional*): New collection image URL.
- `imageAlt` (string, *optional*): New alt text for the collection image.

**Returns:**

`ShopifyCollection`: Returns the updated collection with id, title, bodyHtml, handle, sortOrder, collectionType, imageUrl, and productsCount.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"updateCollection","params":{"collectionId":"841564295","published":true,"templateSuffix":"preview"}}' | jq .
```

### `deleteCollection`

Delete a collection. This removes the collection grouping only — the products that belonged to it are not deleted.

**Arguments:**

- `collectionId` (string, **required**): The ID of the collection to delete.

**Returns:**

`object`: Returns { deleted: true, collectionId }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"deleteCollection","params":{"collectionId":"841564295"}}' | jq .
```

### `addProductsToCollection`

Add one or more products to a manual (custom) collection. This is additive — a product keeps its membership in any other collections (e.g. its category collection) and also joins this one, so the same product can appear in multiple collections at once.

**Arguments:**

- `collectionId` (string, **required**): The ID of the collection to add products to.
- `productIds` (array, **required**): Array of product IDs to add to the collection.

**Returns:**

`object`: Returns { collectionId, productIds, added: true }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"addProductsToCollection","params":{"collectionId":"841564295","productIds":["1234567890","1234567891"]}}' | jq .
```

### `removeProductsFromCollection`

Remove one or more products from a manual (custom) collection. The products themselves are not deleted and remain in any other collections they belong to.

**Arguments:**

- `collectionId` (string, **required**): The ID of the collection to remove products from.
- `productIds` (array, **required**): Array of product IDs to remove from the collection.

**Returns:**

`object`: Returns { collectionId, productIds, removed: true }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"removeProductsFromCollection","params":{"collectionId":"841564295","productIds":["1234567890"]}}' | jq .
```

### `publishCollection`

Publish or unpublish an existing collection on the Online Store sales channel, making it visible (or hidden) on the storefront. Use this to make a collection live after creating it, or to retry publishing a collection that was created but not yet published (e.g. when createCollection succeeded but its publish step was skipped). Requires the read_publications and write_publications scopes — if the store has not granted them, the merchant must reconnect Shopify and approve the expanded permissions before publishing will work.

**Arguments:**

- `collectionId` (string, **required**): The ID of the collection to publish or unpublish.
- `published` (boolean, *optional*): true (the default) publishes the collection on the Online Store sales channel; false unpublishes (hides) it from the storefront.

**Returns:**

`object`: Returns { collectionId, published }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"publishCollection","params":{"collectionId":"841564295","published":true}}' | jq .
```

### `listProducts`

List products in the Shopify store with optional filtering and pagination. Returns up to 50 products per page. Use the nextPageInfo cursor from the response to fetch subsequent pages.

**Arguments:**

- `limit` (number, *optional*): Number of products to return per page (1-250). Defaults to 50.
- `pageInfo` (string, *optional*): Cursor for pagination. Use the nextPageInfo value from a previous response to get the next page.
- `status` (string, *optional*): Filter by product status: "active", "archived", or "draft".
- `vendor` (string, *optional*): Filter by product vendor name.
- `productType` (string, *optional*): Filter by product type.
- `collectionId` (string, *optional*): Filter by collection ID to list products in a specific collection.

**Returns:**

`AdapterOperationResult`: Returns { products: NormalizedShopifyProduct[], nextPageInfo, previousPageInfo, totalRetrieved }. Each product includes id, title, bodyHtml, vendor, productType, status, handle, tags, variants, images, options.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"listProducts","params":{}}' | jq .
```

### `getProduct`

Get a single product by its Shopify product ID. Returns full product details including all variants, images, and options.

**Arguments:**

- `productId` (string, **required**): The Shopify product ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyProduct with id, title, bodyHtml, vendor, productType, status, handle, tags, variants (with price, sku, inventory), images, and options.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"getProduct","params":{"productId":"<ID>"}}' | jq .
```

### `createProduct`

Create a new product in the Shopify store. At minimum, a title is required. Set status to "draft" to create without publishing.

**Arguments:**

- `title` (string, **required**): The product title.
- `bodyHtml` (string, *optional*): HTML description of the product.
- `vendor` (string, *optional*): The product vendor.
- `productType` (string, *optional*): The product type for categorization.
- `tags` (string, *optional*): Comma-separated list of tags.
- `status` (string, *optional*): Product status: "active", "archived", or "draft". Defaults to "active".

**Returns:**

`AdapterOperationResult`: Returns the created NormalizedShopifyProduct.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"createProduct","params":{"title":"<value>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `updateProduct`

Update an existing product. Only the fields you provide will be updated; omitted fields remain unchanged.

**Arguments:**

- `productId` (string, **required**): The Shopify product ID to update.
- `title` (string, *optional*): New product title.
- `bodyHtml` (string, *optional*): New HTML description.
- `vendor` (string, *optional*): New vendor name.
- `productType` (string, *optional*): New product type.
- `tags` (string, *optional*): New comma-separated tags (replaces existing tags).
- `status` (string, *optional*): New status: "active", "archived", or "draft".

**Returns:**

`AdapterOperationResult`: Returns the updated NormalizedShopifyProduct.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"updateProduct","params":{"productId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `deleteProduct`

Permanently delete a product from the Shopify store. This action cannot be undone.

**Arguments:**

- `productId` (string, **required**): The Shopify product ID to delete.

**Returns:**

`AdapterOperationResult`: Returns { deleted: true, productId } on success.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"deleteProduct","params":{"productId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `listOrders`

List orders from the Shopify store with optional filtering. Returns up to 50 orders per page sorted by creation date descending. By default returns open orders.

**Arguments:**

- `limit` (number, *optional*): Number of orders to return per page (1-250). Defaults to 50.
- `pageInfo` (string, *optional*): Cursor for pagination from a previous response.
- `status` (string, *optional*): Filter by order status: "open", "closed", "cancelled", or "any". Defaults to "any".
- `financialStatus` (string, *optional*): Filter by financial status: "authorized", "pending", "paid", "partially_paid", "refunded", "voided", "partially_refunded", "any", "unpaid".
- `fulfillmentStatus` (string, *optional*): Filter by fulfillment status: "shipped", "partial", "unshipped", "any", "unfulfilled".
- `sinceId` (string, *optional*): Return orders after this order ID.
- `createdAtMin` (string, *optional*): Return orders created after this date (ISO 8601 format).
- `createdAtMax` (string, *optional*): Return orders created before this date (ISO 8601 format).

**Returns:**

`AdapterOperationResult`: Returns { orders: NormalizedShopifyOrder[], nextPageInfo, previousPageInfo, totalRetrieved }. Each order includes id, orderNumber, email, totalPrice, currency, financialStatus, fulfillmentStatus, lineItems, customer info.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"listOrders","params":{}}' | jq .
```

### `getOrder`

Get a single order by its Shopify order ID. Returns full order details including line items and customer information.

**Arguments:**

- `orderId` (string, **required**): The Shopify order ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyOrder with full details.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"getOrder","params":{"orderId":"<ID>"}}' | jq .
```

### `getPaymentsBalance`

Get the store's Shopify Payments balance and recent payouts (bank deposits). Useful for profit/cashflow tracking: the balance is funds not yet paid out, and each payout breaks down gross charges vs. processing fees. Requires the read_shopify_payments_payouts scope — if the store has not granted it, the merchant must reconnect Shopify and approve the expanded permissions. NOTE: this only works for stores that use Shopify Payments; stores on an external gateway (PayPal, Stripe, etc.) have no Shopify Payments account and the operation returns empty balance/payouts with an explanatory note.

**Arguments:**

- `limit` (number, *optional*): Number of recent payouts to return, most recent first (1-50). Defaults to 10.

**Returns:**

`AdapterOperationResult`: Returns { balance: { amount, currency }[], payouts: NormalizedShopifyPayout[], totalRetrieved, note? }. balance may list multiple currencies. Each payout includes amount (net deposited), status, issuedAt, and gross/fee breakdown fields.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"getPaymentsBalance","params":{}}' | jq .
```

### `createOrder`

Create a new order in the Shopify store. Requires at least one line item. Can optionally include customer, shipping address, and financial details.

**Arguments:**

- `lineItems` (array, **required**): Array of line items. Each item needs either variant_id or title+price+quantity. Example: [{ variant_id: "123", quantity: 2 }] or [{ title: "Custom Item", price: "10.00", quantity: 1 }].
- `email` (string, *optional*): Customer email address for the order.
- `note` (string, *optional*): An optional note attached to the order.
- `tags` (string, *optional*): Comma-separated tags for the order.
- `financialStatus` (string, *optional*): Financial status: "pending", "authorized", "partially_paid", "paid", "partially_refunded", "refunded", "voided". Defaults to "pending".
- `shippingAddress` (object, *optional*): Shipping address object with first_name, last_name, address1, address2, city, province, country, zip, phone.
- `customerId` (string, *optional*): Associate the order with an existing customer by their Shopify customer ID.

**Returns:**

`AdapterOperationResult`: Returns the created NormalizedShopifyOrder.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"createOrder","params":{"lineItems":[]}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `cancelOrder`

Cancel an existing order. The order must be open. Optionally specify a reason for cancellation.

**Arguments:**

- `orderId` (string, **required**): The Shopify order ID to cancel.
- `reason` (string, *optional*): Cancellation reason: "customer", "fraud", "inventory", "declined", or "other".
- `email` (boolean, *optional*): Whether to send a cancellation email to the customer. Defaults to true.

**Returns:**

`AdapterOperationResult`: Returns the cancelled NormalizedShopifyOrder with updated cancelledAt and cancelReason fields.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"cancelOrder","params":{"orderId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `closeOrder`

Close an open order. A closed order is one that has no more work to be done (e.g., fully fulfilled and paid).

**Arguments:**

- `orderId` (string, **required**): The Shopify order ID to close.

**Returns:**

`AdapterOperationResult`: Returns the closed NormalizedShopifyOrder with updated closedAt field.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"closeOrder","params":{"orderId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `listCustomers`

List customers from the Shopify store with optional pagination. Returns up to 50 customers per page.

**Arguments:**

- `limit` (number, *optional*): Number of customers to return per page (1-250). Defaults to 50.
- `pageInfo` (string, *optional*): Cursor for pagination from a previous response.
- `sinceId` (string, *optional*): Return customers after this customer ID.
- `createdAtMin` (string, *optional*): Return customers created after this date (ISO 8601 format).
- `createdAtMax` (string, *optional*): Return customers created before this date (ISO 8601 format).

**Returns:**

`AdapterOperationResult`: Returns { customers: NormalizedShopifyCustomer[], nextPageInfo, previousPageInfo, totalRetrieved }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"listCustomers","params":{}}' | jq .
```

### `getCustomer`

Get a single customer by their Shopify customer ID. Returns full customer details including addresses.

**Arguments:**

- `customerId` (string, **required**): The Shopify customer ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyCustomer with full details including addresses.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"getCustomer","params":{"customerId":"<ID>"}}' | jq .
```

### `createCustomer`

Create a new customer in the Shopify store. At minimum, either an email or a phone number is required.

**Arguments:**

- `firstName` (string, *optional*): Customer first name.
- `lastName` (string, *optional*): Customer last name.
- `email` (string, *optional*): Customer email address. Required if phone is not provided.
- `phone` (string, *optional*): Customer phone number in E.164 format. Required if email is not provided.
- `tags` (string, *optional*): Comma-separated tags for the customer.
- `note` (string, *optional*): A note about the customer.
- `addresses` (array, *optional*): Array of address objects with address1, city, province, country, zip, phone.

**Returns:**

`AdapterOperationResult`: Returns the created NormalizedShopifyCustomer.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"createCustomer","params":{}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `updateCustomer`

Update an existing customer. Only the fields you provide will be updated.

**Arguments:**

- `customerId` (string, **required**): The Shopify customer ID to update.
- `firstName` (string, *optional*): New first name.
- `lastName` (string, *optional*): New last name.
- `email` (string, *optional*): New email address.
- `phone` (string, *optional*): New phone number in E.164 format.
- `tags` (string, *optional*): New comma-separated tags (replaces existing).
- `note` (string, *optional*): New note about the customer.

**Returns:**

`AdapterOperationResult`: Returns the updated NormalizedShopifyCustomer.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"updateCustomer","params":{"customerId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `searchCustomers`

Search customers by a query string. Searches across email, name, and other fields. Returns up to 50 results.

**Arguments:**

- `query` (string, **required**): Search query string. Examples: "email:john@example.com", "first_name:John", or freeform text like "john doe".
- `limit` (number, *optional*): Number of results to return (1-250). Defaults to 50.

**Returns:**

`AdapterOperationResult`: Returns { customers: NormalizedShopifyCustomer[], totalRetrieved }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"searchCustomers","params":{"query":"search term"}}' | jq .
```

### `getInventoryLevels`

Get inventory levels. With no arguments, returns levels for all inventory items (up to limit). Optionally narrow by inventoryItemIds and/or filter by locationIds. Each returned level includes the locationId needed for adjustInventory.

**Arguments:**

- `inventoryItemIds` (string, *optional*): Comma-separated list of inventory item IDs to query. Omit to return levels for all items.
- `locationIds` (string, *optional*): Comma-separated list of location IDs to filter results to. Omit to return levels at all locations.
- `limit` (number, *optional*): Number of results to return (1-250). Defaults to 50.

**Returns:**

`AdapterOperationResult`: Returns { inventoryLevels: NormalizedShopifyInventoryLevel[], totalRetrieved }. Each level includes inventoryItemId, locationId, available quantity, and updatedAt.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"getInventoryLevels","params":{}}' | jq .
```

### `adjustInventory`

Adjust the available inventory quantity for an item at a specific location. The adjustment is relative (e.g., +5 adds 5 units, -3 removes 3 units).

**Arguments:**

- `inventoryItemId` (string, **required**): The inventory item ID to adjust.
- `locationId` (string, **required**): The location ID where the inventory is stored.
- `adjustment` (number, **required**): The quantity adjustment. Positive to add stock, negative to remove.

**Returns:**

`AdapterOperationResult`: Returns the updated NormalizedShopifyInventoryLevel with the new available quantity.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"adjustInventory","params":{"inventoryItemId":"<ID>","locationId":"<ID>","adjustment":10}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `listCollections`

List collections in the Shopify store. Returns both custom collections and smart collections combined, sorted by title.

**Arguments:**

- `limit` (number, *optional*): Maximum number of collections to return per type (1-250). Defaults to 50. Note: up to this many custom collections AND this many smart collections may be returned.
- `pageInfo` (string, *optional*): Cursor for pagination from a previous response.

**Returns:**

`AdapterOperationResult`: Returns { collections: NormalizedShopifyCollection[], totalRetrieved }. Each collection includes id, title, bodyHtml, handle, sortOrder, collectionType ("custom" or "smart"), imageUrl.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"listCollections","params":{}}' | jq .
```

### `listPages`

List pages in the Shopify store with optional pagination.

**Arguments:**

- `limit` (number, *optional*): Number of pages per page, 1-250, default 50
- `pageInfo` (string, *optional*): Cursor for pagination

**Returns:**

`AdapterOperationResult`: Returns { pages: NormalizedShopifyPage[], nextPageInfo, previousPageInfo, totalRetrieved }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"listPages","params":{}}' | jq .
```

### `getPage`

Get a single page by ID.

**Arguments:**

- `pageId` (string, **required**): The Shopify page ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyPage with full details.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"getPage","params":{"pageId":"<ID>"}}' | jq .
```

### `createPage`

Create a new page in the Shopify store.

**Arguments:**

- `title` (string, **required**): The page title.
- `bodyHtml` (string, *optional*): HTML body content of the page.
- `author` (string, *optional*): The author of the page.
- `templateSuffix` (string, *optional*): The template suffix for the page.
- `published` (boolean, *optional*): Whether the page is published. Defaults to true.

**Returns:**

`AdapterOperationResult`: Returns the created NormalizedShopifyPage.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"createPage","params":{"title":"<value>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `updatePage`

Update a page.

**Arguments:**

- `pageId` (string, **required**): The Shopify page ID to update.
- `title` (string, *optional*): New page title.
- `bodyHtml` (string, *optional*): New HTML body content.
- `author` (string, *optional*): New author name.
- `templateSuffix` (string, *optional*): New template suffix.
- `published` (boolean, *optional*): Whether the page is published.

**Returns:**

`AdapterOperationResult`: Returns the updated NormalizedShopifyPage.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"updatePage","params":{"pageId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `deletePage`

Permanently delete a page.

**Arguments:**

- `pageId` (string, **required**): The Shopify page ID to delete.

**Returns:**

`AdapterOperationResult`: Returns { deleted: true, pageId }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"deletePage","params":{"pageId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `listBlogs`

List blogs in the Shopify store.

**Arguments:**

- `limit` (number, *optional*): Number of blogs per page, 1-250, default 50
- `pageInfo` (string, *optional*): Cursor for pagination

**Returns:**

`AdapterOperationResult`: Returns { blogs: NormalizedShopifyBlog[], nextPageInfo, previousPageInfo, totalRetrieved }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"listBlogs","params":{}}' | jq .
```

### `getBlog`

Get a blog by ID.

**Arguments:**

- `blogId` (string, **required**): The Shopify blog ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyBlog with full details.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"getBlog","params":{"blogId":"<ID>"}}' | jq .
```

### `createBlog`

Create a blog.

**Arguments:**

- `title` (string, **required**): The blog title.
- `commentable` (string, *optional*): Comment policy: no, moderate, yes

**Returns:**

`AdapterOperationResult`: Returns the created NormalizedShopifyBlog.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"createBlog","params":{"title":"<value>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `updateBlog`

Update a blog.

**Arguments:**

- `blogId` (string, **required**): The Shopify blog ID to update.
- `title` (string, *optional*): New blog title.
- `commentable` (string, *optional*): New comment policy: no, moderate, yes

**Returns:**

`AdapterOperationResult`: Returns the updated NormalizedShopifyBlog.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"updateBlog","params":{"blogId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `deleteBlog`

Delete a blog.

**Arguments:**

- `blogId` (string, **required**): The Shopify blog ID to delete.

**Returns:**

`AdapterOperationResult`: Returns { deleted: true, blogId }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"deleteBlog","params":{"blogId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `listArticles`

List articles in a blog.

**Arguments:**

- `blogId` (string, **required**): The blog ID to list articles from.
- `limit` (number, *optional*): Number of articles per page, 1-250, default 50
- `pageInfo` (string, *optional*): Cursor for pagination

**Returns:**

`AdapterOperationResult`: Returns { articles: NormalizedShopifyArticle[], nextPageInfo, previousPageInfo, totalRetrieved }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"listArticles","params":{"blogId":"<ID>"}}' | jq .
```

### `getArticle`

Get an article by ID.

**Arguments:**

- `articleId` (string, **required**): The Shopify article ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyArticle with full details.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"getArticle","params":{"articleId":"<ID>"}}' | jq .
```

### `createArticle`

Create an article in a blog.

**Arguments:**

- `blogId` (string, **required**): The blog ID to create the article in.
- `title` (string, **required**): The article title.
- `author` (string, *optional*): The article author.
- `bodyHtml` (string, *optional*): HTML body content of the article.
- `summary` (string, *optional*): Summary or excerpt of the article.
- `tags` (string, *optional*): Comma-separated list of tags.
- `published` (boolean, *optional*): Whether the article is published.
- `imageUrl` (string, *optional*): URL of the article featured image.
- `imageAlt` (string, *optional*): Alt text for the article featured image.

**Returns:**

`AdapterOperationResult`: Returns the created NormalizedShopifyArticle.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"createArticle","params":{"blogId":"<ID>","title":"<value>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `updateArticle`

Update an article.

**Arguments:**

- `articleId` (string, **required**): The Shopify article ID to update.
- `title` (string, *optional*): New article title.
- `author` (string, *optional*): New author name.
- `bodyHtml` (string, *optional*): New HTML body content.
- `summary` (string, *optional*): New summary or excerpt.
- `tags` (string, *optional*): New comma-separated tags.
- `published` (boolean, *optional*): Whether the article is published.

**Returns:**

`AdapterOperationResult`: Returns the updated NormalizedShopifyArticle.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"updateArticle","params":{"articleId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `deleteArticle`

Delete an article.

**Arguments:**

- `articleId` (string, **required**): The Shopify article ID to delete.

**Returns:**

`AdapterOperationResult`: Returns { deleted: true, articleId }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"deleteArticle","params":{"articleId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `listThemes`

List all themes in the Shopify store.

**Returns:**

`AdapterOperationResult`: Returns { themes: NormalizedShopifyTheme[], totalRetrieved }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"listThemes","params":{}}' | jq .
```

### `getTheme`

Get a theme by ID.

**Arguments:**

- `themeId` (string, **required**): The Shopify theme ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyTheme with full details.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"getTheme","params":{"themeId":"<ID>"}}' | jq .
```

### `publishTheme`

Publish (activate) a theme as the main theme.

**Arguments:**

- `themeId` (string, **required**): The Shopify theme ID to publish.

**Returns:**

`AdapterOperationResult`: Returns the updated NormalizedShopifyTheme with role set to main.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"publishTheme","params":{"themeId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `listThemeFiles`

List files in a theme.

**Arguments:**

- `themeId` (string, **required**): The Shopify theme ID.
- `filenames` (string, *optional*): Comma-separated glob patterns like templates/*.json

**Returns:**

`AdapterOperationResult`: Returns { files: NormalizedShopifyThemeFile[], totalRetrieved }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"listThemeFiles","params":{"themeId":"<ID>"}}' | jq .
```

### `getThemeFile`

Get a single theme file with its content.

**Arguments:**

- `themeId` (string, **required**): The Shopify theme ID.
- `filename` (string, **required**): The filename/path of the theme file (e.g., "templates/index.json").

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyThemeFile with filename, body content, and metadata.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"getThemeFile","params":{"themeId":"<ID>","filename":"<value>"}}' | jq .
```

### `upsertThemeFiles`

Create or update theme files.

**Arguments:**

- `themeId` (string, **required**): The Shopify theme ID.
- `files` (array, **required**): Array of {filename, body} objects

**Returns:**

`AdapterOperationResult`: Returns { files: NormalizedShopifyThemeFile[], totalRetrieved } with the created or updated files.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"upsertThemeFiles","params":{"themeId":"<ID>","files":[]}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `deleteThemeFiles`

Delete theme files.

**Arguments:**

- `themeId` (string, **required**): The Shopify theme ID.
- `filenames` (array, **required**): Array of filenames to delete

**Returns:**

`AdapterOperationResult`: Returns { deleted: true, filenames } with the list of deleted files.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"deleteThemeFiles","params":{"themeId":"<ID>","filenames":[]}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `listMenus`

List navigation menus.

**Arguments:**

- `limit` (number, *optional*): Number of menus per page, 1-250, default 50
- `pageInfo` (string, *optional*): Cursor for pagination

**Returns:**

`AdapterOperationResult`: Returns { menus: NormalizedShopifyMenu[], nextPageInfo, previousPageInfo, totalRetrieved }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"listMenus","params":{}}' | jq .
```

### `getMenu`

Get a menu by ID.

**Arguments:**

- `menuId` (string, **required**): The Shopify menu ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyMenu with full details.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"getMenu","params":{"menuId":"<ID>"}}' | jq .
```

### `createMenu`

Create a navigation menu.

**Arguments:**

- `title` (string, **required**): The menu title.
- `handle` (string, *optional*): The menu handle (URL-friendly identifier).
- `items` (array, *optional*): Array of menu item objects with title, url, type, resourceId

**Returns:**

`AdapterOperationResult`: Returns the created NormalizedShopifyMenu.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"createMenu","params":{"title":"<value>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `updateMenu`

Update a menu.

**Arguments:**

- `menuId` (string, **required**): The Shopify menu ID to update.
- `title` (string, *optional*): New menu title.
- `handle` (string, *optional*): New menu handle.
- `items` (array, *optional*): New array of menu item objects with title, url, type, resourceId

**Returns:**

`AdapterOperationResult`: Returns the updated NormalizedShopifyMenu.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"updateMenu","params":{"menuId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `deleteMenu`

Delete a menu.

**Arguments:**

- `menuId` (string, **required**): The Shopify menu ID to delete.

**Returns:**

`AdapterOperationResult`: Returns { deleted: true, menuId }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"deleteMenu","params":{"menuId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `listRedirects`

List URL redirects.

**Arguments:**

- `limit` (number, *optional*): Number of redirects per page, 1-250, default 50
- `pageInfo` (string, *optional*): Cursor for pagination

**Returns:**

`AdapterOperationResult`: Returns { redirects: NormalizedShopifyRedirect[], nextPageInfo, previousPageInfo, totalRetrieved }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"listRedirects","params":{}}' | jq .
```

### `createRedirect`

Create a URL redirect.

**Arguments:**

- `path` (string, **required**): The old path to redirect from
- `target` (string, **required**): The new URL to redirect to

**Returns:**

`AdapterOperationResult`: Returns the created NormalizedShopifyRedirect.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"createRedirect","params":{"path":"<value>","target":"<value>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `updateRedirect`

Update a redirect.

**Arguments:**

- `redirectId` (string, **required**): The Shopify redirect ID to update.
- `path` (string, *optional*): New path to redirect from.
- `target` (string, *optional*): New URL to redirect to.

**Returns:**

`AdapterOperationResult`: Returns the updated NormalizedShopifyRedirect.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"updateRedirect","params":{"redirectId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `deleteRedirect`

Delete a redirect.

**Arguments:**

- `redirectId` (string, **required**): The Shopify redirect ID to delete.

**Returns:**

`AdapterOperationResult`: Returns { deleted: true, redirectId }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"deleteRedirect","params":{"redirectId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `createCoupon`

Create a discount code (coupon) that customers can enter at checkout for a percentage or fixed-amount discount off their entire order. The coupon is active immediately unless startsAt is provided.

**Arguments:**

- `code` (string, **required**): The coupon code customers type at checkout, e.g. "SUMMER20". Case-insensitive at checkout.
- `valueType` (string, **required**): The discount type: "percentage" for a percent off, or "fixed_amount" for a flat currency amount off.
- `value` (number, **required**): The discount amount. For valueType "percentage", a percent from 1-100 (e.g. 20 = 20% off). For valueType "fixed_amount", the currency amount off the order (e.g. 10 = $10 off in the store currency).
- `title` (string, *optional*): Admin-facing title for the discount shown in the Shopify dashboard. Defaults to the code if omitted.
- `startsAt` (string, *optional*): When the coupon becomes active (ISO 8601). Defaults to now.
- `endsAt` (string, *optional*): When the coupon expires (ISO 8601). Omit for no expiry. Must be after startsAt.
- `usageLimit` (number, *optional*): Maximum total number of times this coupon can be used across all customers. Omit for unlimited.
- `appliesOncePerCustomer` (boolean, *optional*): If true, each customer can use the coupon only once. Defaults to false.
- `minimumSubtotal` (number, *optional*): Minimum order subtotal (in the store currency) required to use the coupon. Omit for no minimum.

**Returns:**

`AdapterOperationResult`: Returns the created discount code: { id, code, title, status, valueType, value, startsAt, endsAt, usageLimit, appliesOncePerCustomer, minimumSubtotal }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"shopify","method":"createCoupon","params":{"code":"<value>","valueType":"<value>","value":10}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

## Response Format

All SDK responses return the operation payload wrapped in a standard envelope:

```json
{
  "success": true,
  "data": { ... }
}
```

The `data` field contains the operation result. Error responses include:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Tips

- Use `jq .` to pretty-print responses, `jq .data` to extract just the payload
- For list operations, results are in `data.results` or directly in `data` (check examples)
- Pass `--fail-with-body` to curl to see error details on HTTP failures
- Store the API key in a variable: `export API_KEY="your-key"`
