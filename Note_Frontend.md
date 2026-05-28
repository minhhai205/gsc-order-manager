Created: Hoàng Lê Minh

Last Updated: 13:40 28/05/2026

Note Frontend:

Chung:

- Cần thống nhất: Tài liệu thiết kế ghi tiếng Việt, còn giao diện thì ghi tiếng Anh
- Audit Log hiện chưa được lưu database, chỉ ghi nhận log trên máy hiện tại, xem ở máy khác thì không thấy log mới -> Cần sửa
- Nút tạo mới, lưu thay đổi chỉnh sửa của nhiều giao diện có màu text trắng trùng background -> Đổi màu text
- Các Form Tạo, Chỉnh sửa thông tin, Xem thông tin, Xóa xuất hiện ở phía dưới giao diện khi bấm vào các nút tương ứng -> nên làm thành 1 dạng pop-up giữa màn hình và ngăn không cho bấm các nút khác khi chưa hoàn thiện hoặc thoát pop-up
- Darkmode lỗi khi profile người dùng sử dụng màu sắc không phải mặc định -> Có thể sửa hoặc bỏ darkmode

---

UC1: Quản lý hồ sơ Cơ quan Liên bang

Actor: Contracting Officer


- Trường "Chức vụ" (Của người đại diện): Không có -> Nên thêm vào cho giống tài liệu thiết kế
- Khi tạo/sửa thành công: Hiện tại không có thông báo gì -> Nên có thông báo thành công từ hệ thống
- Các trường bắt buộc cần có: Hiện tại chỉ có Code và Agency Corporate Name là bắt buộc -> Nên yêu cầu tất cả các trường Physical HQ Address, Corporate Contact Person Name, Phone Number, Secure Corporate Email đều là bắt buộc

---

UC2: Quản lý Hợp đồng khung

Actor: Contracting Officer

- Nút truy cập giao diện quản lý hợp đồng không có trong list bên trái -> Nên thêm vào (Hiện tại có nút Agencies & Contracts nhưng chỉ chứa Agencies, nên tách ra thành 2 nút chức năng)
- Contract Code hiện có thể được chỉnh sửa -> Nên khóa không cho sửa code
- Budget: chưa check hợp lệ, vẫn cho phép lưu nếu là số âm -> Cần check điều kiện trước khi lưu
- (Optional): Thêm nút disable hợp đồng cho API PATCH /api/contracts/{id}/disable

---

UC3: Quản lý Danh mục thiết bị

Actor: Warehouse Management

- Thông tin Equipment: Thiếu Hãng sản xuất, Cấu hình phần cứng cơ bản -> Cần bổ sung
- Item Code: Chưa check đã tồn tại hay chưa, vẫn cho phép add item đã tồn tại -> Cần check tính hợp lệ khi thêm thiết bị
- Unit Price: Chưa check tính hợp lệ, vẫn cho phép lưu số âm -> Cần check tính hợp lệ

---

UC4: Tiếp nhận và Kiểm duyệt Đơn đặt hàng (PO)

Actor: Contracting Officer

- CRITICAL: Khi truy cập giao diện orders (http://localhost:5173/co/orders) thì console báo lỗi: Uncaught ReferenceError: Search is not defined at ManageOrders (ManageOrders.jsx:192:12)
- CRITICAL: Khi bấm vào 1 order ở mục Pending PO Validation Queue trong phần Overview thì console báo lỗi: Uncaught ReferenceError: Clock is not defined at Overview (Overview.jsx:897:22)

---

UC5: Xử lý Thư từ chối

Actor: Contracting Officer

Tạm thời chưa test giao diện vì UC4 đang lỗi

---

UC6: Đối chiếu khả năng đáp ứng (Tồn kho)

Actor: Order Fulfillment Staff

Tạm thời chưa test giao diện vì UC4 đang lỗi

---

UC7: Lập Báo cáo Ngoại lệ (Exception Report)

Actor: Order Fulfillment Staff

Tạm thời chưa test giao diện vì UC4 đang lỗi

---

UC8: Lập Hóa đơn Vận chuyển (Shipping Bill)

Actor: Warehouse Management

Tạm thời chưa test giao diện vì UC4 đang lỗi

---

UC9: Đóng hồ sơ Đơn đặt hàng và Lưu trữ

Actor: Contracting Officer

Tạm thời chưa test giao diện vì UC4 đang lỗi

---

UC10: Quản lý Tài khoản và Phân quyền

Actor: System Administrator

Hiện tại chưa implement giao diện cho UC này

---

UC11: Sao lưu và Phục hồi Dữ liệu

Actor: System Administrator

Hiện tại chỉ có mock ở Frontend, hình như Backend chưa implement