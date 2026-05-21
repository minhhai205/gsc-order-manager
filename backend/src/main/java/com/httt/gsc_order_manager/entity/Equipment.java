package com.httt.gsc_order_manager.entity;

import lombok.Getter;
import lombok.Setter;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "equipment")
public class Equipment extends BaseEntity {

    @Column(nullable = false, unique = true, length = 80)
    private String sku;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 150)
    private String manufacturer;

    @Column(columnDefinition = "text")
    private String hardwareSpecs;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int availableStock;

    @Column(nullable = false)
    private int minimumStockLevel;

    @Column(nullable = false)
    private boolean active = true;
}
