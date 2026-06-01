# Back-end Fixed Notes

Tài liệu này ghi lại các logic backend đã kiểm tra/chỉnh sửa trong quá trình rà soát hệ thống GSC Order Manager.

## 1. Permission APIs

### Equipment APIs

- Đã cho phép `CONTRACTING_OFFICER` đọc danh mục thiết bị.
- Lý do: Contracting Officer cần xem thiết bị khi tạo/kiểm tra Standing Contract và Purchase Order.
- Phạm vi: chỉ mở quyền `GET /api/equipment/**`, không mở quyền tạo/sửa/xóa thiết bị.

### Purchase Order APIs

- Đã cho phép `WAREHOUSE_STAFF` đọc Purchase Order.
- Lý do: Warehouse Staff cần xem PO để lập Shipping Bill.
- Phạm vi: chỉ mở quyền `GET /api/purchase-orders/**`, không mở quyền tạo/sửa/validate PO.

## 2. Purchase Order Validation

API:

```http
POST /api/purchase-orders/{id}/validate
```

Logic backend hiện tại:

- Nếu hợp đồng hết hạn hoặc chưa hiệu lực, PO bị đánh dấu `INVALID`.
- Nếu thiết bị trong PO không thuộc danh sách thiết bị được phép của Standing Contract, PO bị đánh dấu `INVALID`.
- Nếu `purchaseOrder.totalAmount > standingContract.costLimit`, PO bị đánh dấu `INVALID`.
- Nếu không có lỗi, PO chuyển sang `OUTSTANDING`.
- Nếu có lỗi, PO chuyển sang `INVALID` và lưu lý do vào `validationReason`.

Đã kiểm tra:

- Backend đang kiểm tra hạn mức đúng theo đề bài: tổng giá trị của PO hiện tại không được vượt hạn mức quy định trong Standing Contract.
- Backend không check tổng ngân sách đã dùng của contract. Đây là đúng với yêu cầu đề bài hiện tại.

Điểm cần lưu ý:

- Controller hiện vẫn trả message chung là `Purchase order validated successfully`, kể cả khi PO bị `INVALID`.
- Dữ liệu response vẫn đúng vì `data.status = INVALID` và có `data.validationReason`.
- Nếu UI hiển thị gây hiểu nhầm, nên sửa message theo status ở controller hoặc xử lý message theo `data.status` ở frontend.

## 3. Fulfillment Inventory Check

API:

```http
POST /api/purchase-orders/{id}/inventory-check
PATCH /api/purchase-orders/{id}/confirm-inventory-check
```

Logic backend hiện tại:

- Chỉ cho inventory check với PO ở trạng thái `OUTSTANDING`, `INVENTORY_CHECKED`, hoặc `READY_TO_SHIP`.
- Backend kiểm tra từng item:
  - `requestedQuantity`
  - `availableQuantity`
  - `shortageQuantity`
  - `sufficient`
- Nếu có thiếu hàng:
  - Tạo hoặc cập nhật Exception Report.
  - Chỉ ghi các item bị thiếu vào report.
  - PO được chuyển sang `READY_TO_SHIP` để warehouse vẫn có thể giao các item còn hàng.
- Nếu đủ hàng:
  - Xóa Exception Report cũ của PO nếu có.
  - Không tạo Exception Report mới.
  - PO chuyển sang `READY_TO_SHIP`.

Đã kiểm tra:

- Backend không giữ Exception Report khi lần check mới đã đủ hàng.
- Backend không tạo Exception Report nếu không có item thiếu.
- Logic này đúng với đề bài: item còn hàng vẫn được giao, item thiếu được ghi vào exception report.

Lỗi có thể do frontend:

- API response dùng wrapper `ApiResponse`, dữ liệu thật nằm trong `response.data`.
- Frontend hiện có chỗ đọc nhầm:

```js
response.items
response.allItemsAvailable
```

- Đúng ra nên đọc:

```js
response.data.items
response.data.allItemsAvailable
```

- Nếu FE đọc sai, màn Fulfillment có thể hiểu nhầm là thiếu hàng hoặc hiển thị modal Exception Report dù backend trả đủ hàng.

## 4. Exception Report APIs

API:

```http
GET  /api/exception-reports
GET  /api/exception-reports/{id}
POST /api/purchase-orders/{id}/exception-report
GET  /api/exception-reports/{id}/export/pdf
```

Logic backend hiện tại:

- Exception Report chỉ được tạo sau khi PO đã qua inventory check.
- Report chỉ chứa các item có `shortage > 0`.
- Nếu PO không có item thiếu hàng, backend ném lỗi:

```text
Purchase order has no shortage items
```

Đã kiểm tra:

- Backend chặn tạo Exception Report khi đủ hàng.
- Nếu UI vẫn hiển thị report khi đủ hàng, cần kiểm tra cách FE cache/load `exceptionReports` hoặc đọc response wrapper.

## 5. Shipping Bill APIs

API:

```http
POST  /api/purchase-orders/{id}/shipping-bill
PATCH /api/shipping-bills/{id}/confirm
PATCH /api/shipping-bills/{id}/status
```

### Create Shipping Bill

```http
POST /api/purchase-orders/{id}/shipping-bill
```

Logic backend:

- Chỉ cho tạo Shipping Bill khi PO đang `READY_TO_SHIP`.
- Không cho tạo nhiều Shipping Bill cho cùng một PO.
- Kiểm tra item trong bill phải thuộc PO.
- Không cho `shippedQuantity` vượt số lượng đặt trong PO.
- Nếu request gửi `shippedQuantity` lớn hơn số lượng có thể giao, backend tự giảm xuống số lượng có thể giao.
- Nếu có Exception Report, số lượng có thể giao bị giới hạn bởi `availableQuantity` trong report.
- Item có số lượng có thể giao bằng `0` sẽ không được đưa vào Shipping Bill.
- Nếu không còn item nào có thể giao, backend mới từ chối tạo Shipping Bill.
- Bill sau khi tạo ở trạng thái `DRAFT`.
- Chưa trừ tồn kho ở bước create.
- Chưa đổi PO sang `SHIPPED`.

### Confirm Shipping Bill

```http
PATCH /api/shipping-bills/{id}/confirm
```

Logic backend:

- Chỉ confirm được bill đang `DRAFT`.
- Kiểm tra tồn kho hiện tại vẫn đủ.
- Trừ `Equipment.availableStock` theo `ShippingBillItem.shippedQuantity`.
- Đổi Shipping Bill sang `IN_TRANSIT`.
- PO vẫn giữ `READY_TO_SHIP`.
- Không đổi PO sang `SHIPPED` ở bước confirm.

Đã kiểm tra bằng unit test:

- Stock ban đầu `5`, shipped quantity `2`, sau confirm còn `3`.
- PO sau confirm vẫn là `READY_TO_SHIP`.

### Update Shipping Status

```http
PATCH /api/shipping-bills/{id}/status
```

Request:

```json
{
  "status": "DELIVERED"
}
```

Logic backend:

- API này được coi như API do bên thứ ba hoặc Postman gọi để cập nhật trạng thái giao hàng.
- Khi Shipping Bill chuyển sang `DELIVERED`, PO mới chuyển sang `SHIPPED`.
- FE không có nút trực tiếp để mark delivered.

## 6. Close Purchase Order APIs

API:

```http
POST /api/purchase-orders/{id}/close
```

Logic backend sau khi chỉnh:

- Không cho close nếu PO chưa có Shipping Bill.
- Không cho close nếu Shipping Bill chưa `DELIVERED`.
- Chỉ khi bill đã `DELIVERED`, Contracting Officer mới đóng PO.
- Khi close:
  - PO chuyển sang `CLOSED`.
  - Set `closedAt`.
  - Set `archiveCode`.
  - Ghi audit log.

Đã kiểm tra bằng unit test:

- Shipping Bill `DELIVERED` thì close thành công.
- Shipping Bill `IN_TRANSIT` thì close bị chặn.

## 7. Audit Log APIs

API còn giữ:

```http
GET /api/audit-logs
```

Logic:

- Chỉ cần `findAll`.
- Response đã sort log mới nhất trước bằng `occurredAt DESC`.
- Các API xem chi tiết/log theo entity đã được bỏ theo yêu cầu.

## 8. Backup and Restore APIs

Đã kiểm tra/cập nhật:

- Backend chạy trong Docker cần dùng path Linux nội bộ, ví dụ `/app/backups`.
- Docker volume map từ máy host vào container.
- `mysqldump` và `mysql` cần có trong container backend.
- Dockerfile backend đã được bổ sung MySQL client.

Lưu ý:

- Nếu chạy backend bằng Docker, không dùng path kiểu Windows trực tiếp trong container như `D:/gsc-order-manager-backups`.
- Host path nên map vào container path:

```yaml
volumes:
  - D:/gsc-order-manager-backups:/app/backups
```

và app dùng:

```yaml
APP_BACKUP_DIRECTORY: /app/backups
```

## 9. Test Đã Chạy

Các test backend liên quan đã chạy pass bằng Maven hệ thống:

```powershell
mvn "-Dtest=ShippingBillServiceTest,ClosePurchaseOrderServiceTest" test
```

Kết quả:

```text
Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Lưu ý:

- `mvnw.cmd` trong repo có hard-code `JAVA_HOME` cũ, nên có thể lỗi nếu chạy wrapper.
- Chạy bằng `mvn` hệ thống hiện đang OK.

## 10. Các Điểm Cần Kiểm Tra Ở Frontend

- Inventory check cần đọc `response.data.items` và `response.data.allItemsAvailable`.
- Validate PO invalid không nên chỉ dựa vào message `"Purchase order validated successfully"`, mà nên đọc `data.status`.
- Exception Report hiển thị sai có thể do FE cache danh sách report cũ hoặc đọc sai response wrapper.
- Shipping delivered không thao tác trực tiếp trên FE; API `/api/shipping-bills/{id}/status` được gọi từ Postman hoặc hệ thống bên thứ ba.
