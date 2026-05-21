package com.httt.gsc_order_manager.mapper;

import com.httt.gsc_order_manager.dto.agency.AgencyResponse;
import com.httt.gsc_order_manager.dto.agency.CreateAgencyRequest;
import com.httt.gsc_order_manager.entity.FederalAgency;

public final class AgencyMapper {

    private AgencyMapper() {
    }

    public static FederalAgency toEntity(CreateAgencyRequest request) {
        FederalAgency agency = new FederalAgency();
        agency.setAgencyCode(request.getAgencyCode());
        agency.setName(request.getName());
        agency.setAddress(request.getAddress());
        agency.setContactName(request.getContactName());
        agency.setContactPosition(request.getContactPosition());
        agency.setContactPhone(request.getContactPhone());
        agency.setContactEmail(request.getContactEmail());
        agency.setActive(true);
        return agency;
    }

    public static AgencyResponse toResponse(FederalAgency agency) {
        return AgencyResponse.builder()
            .id(agency.getId())
            .agencyCode(agency.getAgencyCode())
            .name(agency.getName())
            .address(agency.getAddress())
            .contactName(agency.getContactName())
            .contactPosition(agency.getContactPosition())
            .contactPhone(agency.getContactPhone())
            .contactEmail(agency.getContactEmail())
            .active(agency.isActive())
            .createdAt(agency.getCreatedAt())
            .updatedAt(agency.getUpdatedAt())
            .build();
    }
}
