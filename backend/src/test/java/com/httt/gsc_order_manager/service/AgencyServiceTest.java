package com.httt.gsc_order_manager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.httt.gsc_order_manager.dto.agency.AgencyResponse;
import com.httt.gsc_order_manager.dto.agency.CreateAgencyRequest;
import com.httt.gsc_order_manager.entity.FederalAgency;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.repository.FederalAgencyRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AgencyServiceTest {

    @Mock
    private FederalAgencyRepository federalAgencyRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AgencyService agencyService;

    @Test
    void createCreatesActiveAgencyAndWritesAuditLog() {
        CreateAgencyRequest request = createAgencyRequest();
        when(federalAgencyRepository.existsByAgencyCodeIgnoreCase("GSA")).thenReturn(false);
        when(federalAgencyRepository.save(any(FederalAgency.class))).thenAnswer(invocation -> {
            FederalAgency agency = invocation.getArgument(0);
            agency.setId(10L);
            return agency;
        });

        AgencyResponse response = agencyService.create(request);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getAgencyCode()).isEqualTo("GSA");
        assertThat(response.isActive()).isTrue();
        verify(auditLogService).record(
            eq(AuditAction.CREATE),
            eq(FederalAgency.class.getSimpleName()),
            eq(10L),
            eq("Created agency GSA")
        );
    }

    @Test
    void createRejectsDuplicateAgencyCode() {
        CreateAgencyRequest request = createAgencyRequest();
        when(federalAgencyRepository.existsByAgencyCodeIgnoreCase("GSA")).thenReturn(true);

        assertThatThrownBy(() -> agencyService.create(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Agency code already exists");
    }

    @Test
    void disableMarksAgencyInactiveAndWritesAuditLog() {
        FederalAgency agency = agency();
        when(federalAgencyRepository.findById(10L)).thenReturn(Optional.of(agency));

        AgencyResponse response = agencyService.disable(10L);

        assertThat(response.isActive()).isFalse();
        verify(auditLogService).record(
            eq(AuditAction.DISABLE),
            eq(FederalAgency.class.getSimpleName()),
            eq(10L),
            eq("Disabled agency GSA")
        );
    }

    private CreateAgencyRequest createAgencyRequest() {
        CreateAgencyRequest request = new CreateAgencyRequest();
        request.setAgencyCode("GSA");
        request.setName("General Services Administration");
        request.setAddress("1800 F Street NW");
        request.setContactName("Jane Doe");
        request.setContactEmail("jane@gsa.gov");
        return request;
    }

    private FederalAgency agency() {
        FederalAgency agency = new FederalAgency();
        agency.setId(10L);
        agency.setAgencyCode("GSA");
        agency.setName("General Services Administration");
        agency.setAddress("1800 F Street NW");
        agency.setContactName("Jane Doe");
        agency.setContactEmail("jane@gsa.gov");
        agency.setActive(true);
        return agency;
    }
}
