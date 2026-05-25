package com.httt.gsc_order_manager.entity;

import lombok.Getter;
import lombok.Setter;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Đại diện cho báo cáo ngoại lệ khi một đơn đặt hàng hợp lệ không thể đáp ứng đủ hàng.
 * Báo cáo này gom các dòng thiết bị bị thiếu của một purchase order.
 */
@Getter
@Setter
@Entity
@Table(name = "exception_reports")
public class ExceptionReport extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String reportNumber;

    @OneToOne(optional = false)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @Column(nullable = false)
    private Instant reportedAt;

    @Column(length = 150)
    private String reportedBy;

    @Column(columnDefinition = "text")
    private String note;

    @OneToMany(mappedBy = "exceptionReport", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExceptionReportItem> items = new ArrayList<>();
}
