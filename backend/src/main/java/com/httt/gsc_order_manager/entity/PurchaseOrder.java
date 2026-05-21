package com.httt.gsc_order_manager.entity;

import lombok.Getter;
import lombok.Setter;

import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder extends BaseEntity {

    @Column(nullable = false, unique = true, length = 80)
    private String poNumber;

    @ManyToOne(optional = false)
    @JoinColumn(name = "contract_id", nullable = false)
    private StandingContract contract;

    @ManyToOne(optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private FederalAgency agency;

    @Column(nullable = false)
    private LocalDate issueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private PurchaseOrderStatus status = PurchaseOrderStatus.PENDING;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(columnDefinition = "text")
    private String validationReason;

    private Instant validatedAt;
    private Instant closedAt;

    @Column(length = 120)
    private String archiveCode;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseOrderItem> items = new ArrayList<>();
}
