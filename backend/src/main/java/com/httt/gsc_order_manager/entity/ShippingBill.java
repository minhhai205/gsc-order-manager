package com.httt.gsc_order_manager.entity;

import lombok.Getter;
import lombok.Setter;

import com.httt.gsc_order_manager.entity.enums.ShippingStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Đại diện cho hóa đơn vận chuyển do nhân viên kho lập cho một đơn đặt hàng.
 * Entity này lưu trạng thái vận chuyển, địa chỉ giao hàng, ngày giao và các thiết bị thực xuất.
 */
@Getter
@Setter
@Entity
@Table(name = "shipping_bills")
public class ShippingBill extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String shippingBillNumber;

    @OneToOne(optional = false)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @Column(nullable = false)
    private LocalDate shippingDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ShippingStatus status = ShippingStatus.DRAFT;

    @Column(length = 255)
    private String destinationAddress;

    @Column(length = 150)
    private String createdBy;

    @OneToMany(mappedBy = "shippingBill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ShippingBillItem> items = new ArrayList<>();
}
