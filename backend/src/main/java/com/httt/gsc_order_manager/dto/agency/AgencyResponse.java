package com.httt.gsc_order_manager.dto.agency;

import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AgencyResponse {

    private Long id;
    private String agencyCode;
    private String name;
    private String address;
    private String contactName;
    private String contactPosition;
    private String contactPhone;
    private String contactEmail;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
}
