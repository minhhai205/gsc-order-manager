package com.httt.gsc_order_manager.entity;

import lombok.Getter;
import lombok.Setter;

import com.httt.gsc_order_manager.entity.enums.RejectionLetterStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "rejection_letters")
public class RejectionLetter extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String letterNumber;

    @OneToOne(optional = false)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @ManyToOne(optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private FederalAgency agency;

    @Column(nullable = false, columnDefinition = "text")
    private String reason;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RejectionLetterStatus status = RejectionLetterStatus.DRAFT;

    private Instant issuedAt;

    @Column(length = 150)
    private String issuedBy;
}
