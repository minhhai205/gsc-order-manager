# API Design - GSC Order Manager

## Overview

Base path:

```text
/api
```

The backend follows a monolithic Spring Boot structure:

```text
controller -> service -> repository -> entity
dto <-> mapper <-> entity
```

API responses should use DTOs. Controllers should not expose JPA entities directly.

## Standard Conventions

Authentication:

- Use JWT bearer token for protected APIs.
- Public APIs: `/api/auth/login`, `/api/auth/refresh-token`.
- All other APIs require authentication unless explicitly configured otherwise.

Authorization:

- `SYSTEM_ADMIN`: manage users, view audit logs, access all modules.
- `CONTRACTING_OFFICER`: manage agencies, contracts, purchase orders, rejection letters, close PO.
- `ORDER_FULFILLMENT_STAFF`: process outstanding POs, inventory check, exception reports.
- `WAREHOUSE_STAFF`: manage equipment stock and shipping bills.

Pagination query params:

```text
page=0
size=20
sort=createdAt,desc
```

Success response shape:

```json
{
  "success": true,
  "message": "Request processed successfully",
  "data": {}
}
```

Paged response shape:

```json
{
  "success": true,
  "message": "Request processed successfully",
  "data": {
    "content": [],
    "page": 0,
    "size": 20,
    "totalElements": 0,
    "totalPages": 0
  }
}
```

Error response shape:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is invalid"
    }
  ]
}
```

Common HTTP status codes:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

## Use Case Coverage

| Use case | API group |
|---|---|
| UC1 - Manage Federal Agency | Federal Agency APIs |
| UC2 - Manage Standing Contract | Standing Contract APIs |
| UC3 - Manage Equipment Catalog | Equipment APIs |
| UC4 - Receive and Validate PO | Purchase Order APIs |
| UC5 - Process Rejection Letter | Rejection Letter APIs |
| UC6 - Inventory Availability Check | Fulfillment APIs |
| UC7 - Create Exception Report | Exception Report APIs |
| UC8 - Create Shipping Bill | Shipping Bill APIs |
| UC9 - Close and Archive PO | Close Purchase Order APIs |
| UC10 - Manage User and RBAC | Auth APIs, User APIs |
| UC11 - Backup and Restore Data | Backup and Restore APIs |

## Auth APIs

```http
POST /api/auth/login
POST /api/auth/refresh-token
POST /api/auth/logout
GET  /api/auth/me
```

Purpose:

- Authenticate users.
- Issue JWT access tokens.
- Return current user information.

## User APIs

```http
GET   /api/users
POST  /api/users
GET   /api/users/{id}
PUT   /api/users/{id}
PATCH /api/users/{id}/disable
PATCH /api/users/{id}/enable
PATCH /api/users/{id}/role
```

Purpose:

- Manage internal user accounts.
- Support roles: contracting officer, order fulfillment staff, warehouse staff, system admin.

## Federal Agency APIs

```http
GET   /api/agencies
POST  /api/agencies
GET   /api/agencies/{id}
PUT   /api/agencies/{id}
PATCH /api/agencies/{id}/disable
PATCH /api/agencies/{id}/enable
```

Purpose:

- Manage federal agency profiles.
- Store agency code, name, address, contact person, phone, and email.
- Write audit log when an agency is created, updated, disabled, or enabled.

Common query params:

```text
keyword
agencyCode
name
page
size
sort
```

## Equipment APIs

```http
GET   /api/equipment
POST  /api/equipment
GET   /api/equipment/{id}
PUT   /api/equipment/{id}
PATCH /api/equipment/{id}/disable
PATCH /api/equipment/{id}/enable
PATCH /api/equipment/{id}/stock
GET   /api/equipment/low-stock
```

Purpose:

- Manage equipment catalog.
- Track available stock.
- Detect equipment below minimum stock level.
- Write audit log when equipment or stock is changed.

`PATCH /api/equipment/{id}/stock` supports stock adjustments:

```json
{
  "quantity": 10,
  "operation": "INCREASE",
  "note": "Initial stock update"
}
```

## Standing Contract APIs

```http
GET   /api/contracts
POST  /api/contracts
GET   /api/contracts/{id}
PUT   /api/contracts/{id}
PATCH /api/contracts/{id}/disable
PATCH /api/contracts/{id}/extend
GET   /api/contracts/{id}/allowed-equipment
PUT   /api/contracts/{id}/allowed-equipment
GET   /api/contracts/expiring-soon
```

Purpose:

- Manage standing contracts.
- Link contracts to federal agencies.
- Configure allowed equipment whitelist.
- Extend contract end date and cost limit.
- Write audit log when contract data or whitelist is changed.

Common statuses:

```text
VALID
EXPIRING_SOON
EXPIRED
DISABLED
```

## Purchase Order APIs

```http
GET  /api/purchase-orders
POST /api/purchase-orders
GET  /api/purchase-orders/{id}
PUT  /api/purchase-orders/{id}
POST /api/purchase-orders/{id}/validate
GET  /api/purchase-orders/status/{status}
```

Purpose:

- Receive and digitize purchase orders.
- Store line items.
- Validate PO against contract rules.
- Write audit log when PO is created, updated, validated, invalidated, or closed.

Validation checks:

- Contract is currently valid.
- Every equipment item is allowed by the contract whitelist.
- Total PO amount does not exceed contract cost limit.

Common statuses:

```text
PENDING
INVALID
OUTSTANDING
INVENTORY_CHECKED
READY_TO_SHIP
SHIPPED
CLOSED
```

Example create request:

```json
{
  "poNumber": "PO-001",
  "contractId": 1,
  "issueDate": "2026-05-21",
  "items": [
    {
      "equipmentId": 1,
      "quantity": 5
    }
  ]
}
```

## Rejection Letter APIs

```http
GET   /api/rejection-letters
GET   /api/rejection-letters/{id}
POST  /api/purchase-orders/{id}/rejection-letter
PATCH /api/rejection-letters/{id}/issue
PATCH /api/rejection-letters/{id}/mark-send-failed
GET   /api/rejection-letters/{id}/export/pdf
```

Purpose:

- Generate rejection letters for invalid purchase orders.
- Store rejection reason and issued content.
- Export rejection letter as PDF.
- Write audit log when a rejection letter is generated or issued.

Common statuses:

```text
DRAFT
ISSUED
SEND_FAILED
```

## Fulfillment APIs

```http
GET   /api/fulfillment/outstanding-orders
POST  /api/purchase-orders/{id}/inventory-check
PATCH /api/purchase-orders/{id}/confirm-inventory-check
```

Purpose:

- Let order fulfillment staff process outstanding purchase orders.
- Compare requested quantities against available stock.
- Prepare data for exception report when stock is insufficient.
- Write audit log when inventory check is completed or confirmed.

## Exception Report APIs

```http
GET   /api/exception-reports
GET   /api/exception-reports/{id}
POST  /api/purchase-orders/{id}/exception-report
GET   /api/exception-reports/{id}/export/pdf
```

Purpose:

- Create exception reports for missing equipment.
- Attach report to purchase order.
- Export exception report as PDF.
- Write audit log when an exception report is created.

Example report item:

```json
{
  "equipmentId": 1,
  "requestedQuantity": 10,
  "availableQuantity": 6,
  "shortageQuantity": 4
}
```

## Shipping Bill APIs

```http
GET   /api/shipping-bills
GET   /api/shipping-bills/{id}
POST  /api/purchase-orders/{id}/shipping-bill
PATCH /api/shipping-bills/{id}/confirm
PATCH /api/shipping-bills/{id}/status
GET   /api/shipping-bills/{id}/export/pdf
```

Purpose:

- Create shipping bills for purchase orders.
- Record actually shipped quantities.
- Deduct inventory when shipping is confirmed and the shipping bill moves to `IN_TRANSIT`.
- Keep the purchase order as `READY_TO_SHIP` while the shipping bill is `IN_TRANSIT`.
- Mark the purchase order as `SHIPPED` only when the shipping bill status is updated to `DELIVERED`.
- Export shipping bill as PDF.
- Write audit log when a shipping bill is created, confirmed, or status is changed.

Common statuses:

```text
DRAFT
IN_TRANSIT
DELIVERED
CANCELLED
```

Example create request:

```json
{
  "shippingDate": "2026-05-21",
  "destinationAddress": "Agency default address",
  "items": [
    {
      "equipmentId": 1,
      "shippedQuantity": 5
    }
  ]
}
```

## Close Purchase Order APIs

```http
POST /api/purchase-orders/{id}/close
GET  /api/purchase-orders/{id}/archive
```

Purpose:

- Compare requested quantities and shipped quantities.
- Close purchase order.
- Store archive code and final close timestamp.
- Write audit log when PO is closed.

## Audit Log APIs

```http
GET /api/audit-logs
GET /api/audit-logs/{id}
GET /api/audit-logs/entity/{entityName}/{entityId}
```

Purpose:

- Track important business actions.
- Answer who did what, when, and on which business record.

Examples of audited actions:

```text
CREATE
UPDATE
DELETE
DISABLE
VALIDATE_PO
ISSUE_REJECTION_LETTER
CREATE_EXCEPTION_REPORT
ISSUE_SHIPPING_BILL
CLOSE_PURCHASE_ORDER
BACKUP
RESTORE
```

## Backup and Restore APIs

```http
GET  /api/backups
POST /api/backups
GET  /api/backups/{id}
GET  /api/backups/{id}/download
GET  /api/restores
GET  /api/restores/{id}
POST /api/backups/{id}/restore
```

Purpose:

- Create database backup files for important GSC data.
- Store backup metadata in `backup_records`.
- Restore the database from a selected backup file.
- Store restore metadata in `restore_records`.
- Write audit log when backup or restore operations are requested, completed, or failed.

Recommended storage for this project:

```text
D:/gsc-order-manager-backups/
```

Recommended backup file name:

```text
gsc-order-manager_yyyyMMdd_HHmmss.sql
```

Backup status:

```text
PENDING
RUNNING
COMPLETED
FAILED
```

Backup type:

```text
FULL
INCREMENTAL
```

Restore status:

```text
PENDING
RUNNING
COMPLETED
FAILED
```

Example create backup request:

```json
{
  "type": "FULL",
  "note": "Manual backup before release"
}
```

Example restore request:

```json
{
  "note": "Restore selected backup for verification"
}
```

Implementation notes:

- Use `mysqldump` for backup.
- Use `mysql` import command for restore.
- Restrict restore API to `SYSTEM_ADMIN`.
- Require confirmation on restore because it can overwrite current data.
- Compute and store checksum after backup file creation.
- Do not store raw database password in backup metadata.
- Backup files should not be committed to git.

## Core Workflow

The main business flow should be implemented in this order:

```text
1. Create agency
2. Create equipment
3. Create standing contract and allowed equipment whitelist
4. Create purchase order with line items
5. Validate purchase order
6. If invalid, generate and issue rejection letter
7. If valid, mark purchase order as OUTSTANDING
8. Perform inventory check
9. If stock is insufficient, create exception report
10. Create and confirm shipping bill
11. Close and archive purchase order
12. Create backup or restore data when requested by system admin
```

## Implementation Notes

- Every write operation should create an `AuditLog` record.
- API input and output should use DTO classes.
- Use service-level transactions for create, update, validate, confirm, ship, and close operations.
- Do not expose JPA entities directly from controllers.
- Inventory deduction should happen only when a shipping bill is confirmed.
- PO validation should not mutate inventory.
- Closing a PO should only be allowed after shipping bill creation.
- Invalid PO should not proceed to fulfillment or shipping.
