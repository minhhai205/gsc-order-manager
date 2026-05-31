Note - Hoàng Lê Minh

23:33 31/05/2026

---

VỀ PERMISSION

- Contracting Officer không có quyền truy cập /api/equipment/**
	-> Thỉnh thoảng không load được danh sách equipment khi tạo PO 
- Warehouse Staff không có quyền truy cập /api/purchase-orders/
	-> Thỉnh thoảng không load được các PO đã ở trạng thái "READY_TO_SHIP" để tạo Shipping Bills

---

VỀ LUỒNG SHIPPING HIỆN TẠI

- PO đang ở trạng thái "READY_TO_SHIP"
- Warehouse Staff bấm nút "Issue Shipping Bill" -> Hiện bảng Confirm
- Nếu bấm Confirm -> tạo Shipping Bill và ngay lập tức chuyển sang trạng thái "IN_TRANSIT" (Không có trạng thái DRAFT), Stock trong kho cũng được update, PO chuyển sang "SHIPPED" luôn và có thể được Contracting Officer close ngay.

---

VỀ LUỒNG XỬ LÝ KHI STOCK TRONG KHO KHÔNG ĐỦ YÊU CẦU CỦA PO

- Tạo Exception Report
- PO chuyển sang status "INVENTORY_CHECKED"
- Hiện tại hệ thống không có cách xử lý với PO có status "INVENTORY_CHECKED"

---

CÁC LỖI KHÁC

- Frontend thừa mục "Custom Price" khi tạo PO
- chưa tự update ngân sách đã dùng của mỗi contract
- frontend khi hệ thống check PO INVALID và officer bấm Reject thì gặp lỗi
	Uncaught TypeError: Cannot read properties of undefined (reading 'map')
		at ManageOrders (ManageOrders.jsx:769:41)
- frontend khi Fulfillment Staff check PO thì luôn hiển thị thông báo exception report mặc dù tất cả mặt hàng đều có đủ trong kho. PO vẫn được duyệt và chuyển đến Warehouse nhưng không được tự động update ngay trên giao diện Fulfillment Staff (Vẫn hiển thị là chưa check, cần refresh page thì mới mất).
	+ Khi thiếu hàng thì thông báo exception report pop up lên cũng chưa hiển thị được mặt hàng nào còn thiếu (Ít nhất vẫn tạo report được)
- frontend card Nomenclature Guide trong Stock Allocations của Fulfillment Staff hơi lỗi text