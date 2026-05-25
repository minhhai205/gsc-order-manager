package com.httt.gsc_order_manager.entity;

import lombok.Getter;
import lombok.Setter;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Đại diện cho một dòng thiết bị bị thiếu trong báo cáo ngoại lệ.
 * Entity này lưu số lượng yêu cầu, số lượng kho đáp ứng được và số lượng còn thiếu.
 */
@Getter
@Setter
@Entity
@Table(name = "exception_report_items")
public class ExceptionReportItem extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "exception_report_id", nullable = false)
    private ExceptionReport exceptionReport;

    @ManyToOne(optional = false)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @Column(nullable = false)
    private int requestedQuantity;

    @Column(nullable = false)
    private int availableQuantity;

    @Column(nullable = false)
    private int shortageQuantity;
}
