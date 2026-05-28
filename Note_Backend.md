Created: Hoàng Lê Minh

Last Updated: 13:40 28/05/2026

Note Backend:

Standing Contract APIs:

- PATCH /api/contracts/{id}/extend: Có thể dùng PUT /api/contracts/{id} để extend nên không cần API riêng
- GET   /api/contracts/expiring-soon: Lấy danh sách contracts hết hạn trong 30 ngày (trừ status DISABLED) - Hiện tại frontend chưa dùng và tài liệu thiết kế cũng không có ca sử dụng cần API này

---

Backup and Restore APIs: Hiện không tìm thấy phần implement ở Backend