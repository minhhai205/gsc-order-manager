package com.httt.gsc_order_manager.mapper;

import com.httt.gsc_order_manager.dto.rejectionletter.RejectionLetterResponse;
import com.httt.gsc_order_manager.entity.RejectionLetter;

public final class RejectionLetterMapper {

    private RejectionLetterMapper() {
    }

    public static RejectionLetterResponse toResponse(RejectionLetter rejectionLetter) {
        return RejectionLetterResponse.builder()
            .id(rejectionLetter.getId())
            .letterNumber(rejectionLetter.getLetterNumber())
            .purchaseOrderId(rejectionLetter.getPurchaseOrder().getId())
            .poNumber(rejectionLetter.getPurchaseOrder().getPoNumber())
            .agency(AgencyMapper.toResponse(rejectionLetter.getAgency()))
            .reason(rejectionLetter.getReason())
            .content(rejectionLetter.getContent())
            .status(rejectionLetter.getStatus())
            .issuedAt(rejectionLetter.getIssuedAt())
            .issuedBy(rejectionLetter.getIssuedBy())
            .createdAt(rejectionLetter.getCreatedAt())
            .updatedAt(rejectionLetter.getUpdatedAt())
            .build();
    }
}
