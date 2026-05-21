package com.httt.gsc_order_manager.entity;

import lombok.Getter;
import lombok.Setter;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Getter
@Setter
@Entity
@Table(name = "shipping_bill_items")
public class ShippingBillItem extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "shipping_bill_id", nullable = false)
    private ShippingBill shippingBill;

    @ManyToOne(optional = false)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @Column(nullable = false)
    private int shippedQuantity;
}
