package com.httt.gsc_order_manager.entity;

import lombok.Getter;
import lombok.Setter;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Getter
@Setter
@Entity
@Table(name = "federal_agencies")
public class FederalAgency extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String agencyCode;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, columnDefinition = "text")
    private String address;

    @Column(nullable = false, length = 150)
    private String contactName;

    @Column(length = 100)
    private String contactPosition;

    @Column(length = 30)
    private String contactPhone;

    @Column(nullable = false, length = 150)
    private String contactEmail;

    @Column(nullable = false)
    private boolean active = true;
}
