package com.httt.gsc_order_manager.dto.rejectionletter;

import com.httt.gsc_order_manager.dto.agency.AgencyResponse;
import com.httt.gsc_order_manager.entity.enums.RejectionLetterStatus;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RejectionLetterResponse {

    private Long id;
    private String letterNumber;
    private Long purchaseOrderId;
    private String poNumber;
    private AgencyResponse agency;
    private String reason;
    private String content;
    private RejectionLetterStatus status;
    private Instant issuedAt;
    private String issuedBy;
    private Instant createdAt;
    private Instant updatedAt;
}
