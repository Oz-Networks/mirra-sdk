---
name: mirra-shopify
description: "Use Mirra to shopify store management — products, orders, customers, inventory, collections, pages, blogs, articles, themes, menus, and redirects. Covers all Shopify SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Shopify

Shopify store management — products, orders, customers, inventory, collections, pages, blogs, articles, themes, menus, and redirects

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

> **Note:** Shopify requires OAuth authentication. The user must have connected their Shopify account in the Mirra app before these operations will work.

## API Call Pattern

All operations use POST requests to the Mirra SDK API:

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/{operation}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ ...args }' | jq .
```

Replace `{operation}` with the operation name from the table below.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `listProducts` | List products in the Shopify store with optional filtering and pagination. Returns up to 50 produ... |
| `getProduct` | Get a single product by its Shopify product ID. Returns full product details including all varian... |
| `createProduct` | Create a new product in the Shopify store. At minimum, a title is required. Set status to "draft"... |
| `updateProduct` | Update an existing product. Only the fields you provide will be updated; omitted fields remain un... |
| `deleteProduct` | Permanently delete a product from the Shopify store. This action cannot be undone. |
| `listOrders` | List orders from the Shopify store with optional filtering. Returns up to 50 orders per page sort... |
| `getOrder` | Get a single order by its Shopify order ID. Returns full order details including line items and c... |
| `createOrder` | Create a new order in the Shopify store. Requires at least one line item. Can optionally include ... |
| `cancelOrder` | Cancel an existing order. The order must be open. Optionally specify a reason for cancellation. |
| `closeOrder` | Close an open order. A closed order is one that has no more work to be done (e.g., fully fulfille... |
| `listCustomers` | List customers from the Shopify store with optional pagination. Returns up to 50 customers per page. |
| `getCustomer` | Get a single customer by their Shopify customer ID. Returns full customer details including addre... |
| `createCustomer` | Create a new customer in the Shopify store. At minimum, either an email or a phone number is requ... |
| `updateCustomer` | Update an existing customer. Only the fields you provide will be updated. |
| `searchCustomers` | Search customers by a query string. Searches across email, name, and other fields. Returns up to ... |
| `getInventoryLevels` | Get inventory levels for items at specific locations. You must provide either inventoryItemIds or... |
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

## Operation Details

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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/listProducts" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `getProduct`

Get a single product by its Shopify product ID. Returns full product details including all variants, images, and options.

**Arguments:**

- `productId` (string, **required**): The Shopify product ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyProduct with id, title, bodyHtml, vendor, productType, status, handle, tags, variants (with price, sku, inventory), images, and options.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/getProduct" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"productId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/createProduct" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"title":"<value>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/updateProduct" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"productId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/deleteProduct" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"productId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/listOrders" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `getOrder`

Get a single order by its Shopify order ID. Returns full order details including line items and customer information.

**Arguments:**

- `orderId` (string, **required**): The Shopify order ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyOrder with full details.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/getOrder" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"orderId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/createOrder" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"lineItems":[]}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/cancelOrder" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"orderId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/closeOrder" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"orderId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/listCustomers" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `getCustomer`

Get a single customer by their Shopify customer ID. Returns full customer details including addresses.

**Arguments:**

- `customerId` (string, **required**): The Shopify customer ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyCustomer with full details including addresses.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/getCustomer" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"customerId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/createCustomer" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/updateCustomer" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"customerId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/searchCustomers" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"query":"search term"}' | jq .
```

### `getInventoryLevels`

Get inventory levels for items at specific locations. You must provide either inventoryItemIds or locationIds (at least one is required).

**Arguments:**

- `inventoryItemIds` (string, *optional*): Comma-separated list of inventory item IDs to query.
- `locationIds` (string, *optional*): Comma-separated list of location IDs to query.
- `limit` (number, *optional*): Number of results to return (1-250). Defaults to 50.

**Returns:**

`AdapterOperationResult`: Returns { inventoryLevels: NormalizedShopifyInventoryLevel[], totalRetrieved }. Each level includes inventoryItemId, locationId, available quantity, and updatedAt.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/getInventoryLevels" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/adjustInventory" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"inventoryItemId":"<ID>","locationId":"<ID>","adjustment":10}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/listCollections" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/listPages" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `getPage`

Get a single page by ID.

**Arguments:**

- `pageId` (string, **required**): The Shopify page ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyPage with full details.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/getPage" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"pageId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/createPage" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"title":"<value>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/updatePage" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"pageId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/deletePage" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"pageId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/listBlogs" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `getBlog`

Get a blog by ID.

**Arguments:**

- `blogId` (string, **required**): The Shopify blog ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyBlog with full details.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/getBlog" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"blogId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/createBlog" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"title":"<value>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/updateBlog" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"blogId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/deleteBlog" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"blogId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/listArticles" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"blogId":"<ID>"}' | jq .
```

### `getArticle`

Get an article by ID.

**Arguments:**

- `articleId` (string, **required**): The Shopify article ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyArticle with full details.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/getArticle" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"articleId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/createArticle" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"blogId":"<ID>","title":"<value>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/updateArticle" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"articleId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/deleteArticle" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"articleId":"<ID>"}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `listThemes`

List all themes in the Shopify store.

**Returns:**

`AdapterOperationResult`: Returns { themes: NormalizedShopifyTheme[], totalRetrieved }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/listThemes" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `getTheme`

Get a theme by ID.

**Arguments:**

- `themeId` (string, **required**): The Shopify theme ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyTheme with full details.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/getTheme" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"themeId":"<ID>"}' | jq .
```

### `publishTheme`

Publish (activate) a theme as the main theme.

**Arguments:**

- `themeId` (string, **required**): The Shopify theme ID to publish.

**Returns:**

`AdapterOperationResult`: Returns the updated NormalizedShopifyTheme with role set to main.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/publishTheme" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"themeId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/listThemeFiles" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"themeId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/getThemeFile" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"themeId":"<ID>","filename":"<value>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/upsertThemeFiles" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"themeId":"<ID>","files":[]}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/deleteThemeFiles" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"themeId":"<ID>","filenames":[]}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/listMenus" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `getMenu`

Get a menu by ID.

**Arguments:**

- `menuId` (string, **required**): The Shopify menu ID.

**Returns:**

`AdapterOperationResult`: Returns a single NormalizedShopifyMenu with full details.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/getMenu" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"menuId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/createMenu" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"title":"<value>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/updateMenu" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"menuId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/deleteMenu" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"menuId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/listRedirects" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/createRedirect" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"path":"<value>","target":"<value>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/updateRedirect" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"redirectId":"<ID>"}' | jq .
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
curl -s -X POST "${API_URL}/api/sdk/v1/shopify/deleteRedirect" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"redirectId":"<ID>"}' | jq .
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
