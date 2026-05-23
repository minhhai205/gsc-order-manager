package com.httt.gsc_order_manager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.httt.gsc_order_manager.dto.contract.CreateStandingContractRequest;
import com.httt.gsc_order_manager.dto.contract.ExtendStandingContractRequest;
import com.httt.gsc_order_manager.dto.contract.StandingContractResponse;
import com.httt.gsc_order_manager.dto.contract.UpdateAllowedEquipmentRequest;
import com.httt.gsc_order_manager.entity.Equipment;
import com.httt.gsc_order_manager.entity.FederalAgency;
import com.httt.gsc_order_manager.entity.StandingContract;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.ContractStatus;
import com.httt.gsc_order_manager.repository.EquipmentRepository;
import com.httt.gsc_order_manager.repository.FederalAgencyRepository;
import com.httt.gsc_order_manager.repository.StandingContractRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StandingContractServiceTest {

    @Mock
    private StandingContractRepository standingContractRepository;

    @Mock
    private FederalAgencyRepository federalAgencyRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private StandingContractService standingContractService;

    @Test
    void createCreatesStandingContractAndWritesAuditLog() {
        CreateStandingContractRequest request = createRequest();
        when(standingContractRepository.existsByContractNumberIgnoreCase("CON-001")).thenReturn(false);
        when(federalAgencyRepository.findById(10L)).thenReturn(Optional.of(activeAgency()));
        when(equipmentRepository.findAllById(any())).thenReturn(List.of(equipment(20L, "LAP-001")));
        when(standingContractRepository.save(any(StandingContract.class))).thenAnswer(invocation -> {
            StandingContract contract = invocation.getArgument(0);
            contract.setId(30L);
            return contract;
        });

        StandingContractResponse response = standingContractService.create(request);

        assertThat(response.getId()).isEqualTo(30L);
        assertThat(response.getContractNumber()).isEqualTo("CON-001");
        assertThat(response.getAllowedEquipment()).hasSize(1);
        verify(auditLogService).record(
            eq(AuditAction.CREATE),
            eq(StandingContract.class.getSimpleName()),
            eq(30L),
            eq("Created standing contract CON-001")
        );
    }

    @Test
    void createRejectsDuplicateContractNumber() {
        CreateStandingContractRequest request = createRequest();
        when(standingContractRepository.existsByContractNumberIgnoreCase("CON-001")).thenReturn(true);

        assertThatThrownBy(() -> standingContractService.create(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Contract number already exists");
    }

    @Test
    void createRejectsDisabledAgency() {
        CreateStandingContractRequest request = createRequest();
        FederalAgency agency = activeAgency();
        agency.setActive(false);
        when(standingContractRepository.existsByContractNumberIgnoreCase("CON-001")).thenReturn(false);
        when(federalAgencyRepository.findById(10L)).thenReturn(Optional.of(agency));

        assertThatThrownBy(() -> standingContractService.create(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Agency is disabled");
    }

    @Test
    void extendUpdatesEndDateAndCostLimit() {
        StandingContract contract = contract();
        ExtendStandingContractRequest request = new ExtendStandingContractRequest();
        request.setNewEndDate(LocalDate.now().plusDays(120));
        request.setAdditionalCostLimit(BigDecimal.valueOf(5000));
        when(standingContractRepository.findById(30L)).thenReturn(Optional.of(contract));

        StandingContractResponse response = standingContractService.extend(30L, request);

        assertThat(response.getEndDate()).isEqualTo(request.getNewEndDate());
        assertThat(response.getCostLimit()).isEqualByComparingTo("15000");
        assertThat(response.getStatus()).isEqualTo(ContractStatus.VALID);
        verify(auditLogService).record(
            eq(AuditAction.UPDATE),
            eq(StandingContract.class.getSimpleName()),
            eq(30L),
            eq("Extended standing contract CON-001")
        );
    }

    @Test
    void updateAllowedEquipmentReplacesWhitelist() {
        StandingContract contract = contract();
        UpdateAllowedEquipmentRequest request = new UpdateAllowedEquipmentRequest();
        request.setAllowedEquipmentIds(List.of(21L));
        when(standingContractRepository.findById(30L)).thenReturn(Optional.of(contract));
        when(equipmentRepository.findAllById(any())).thenReturn(List.of(equipment(21L, "MON-001")));

        StandingContractResponse response = standingContractService.updateAllowedEquipment(30L, request);

        assertThat(response.getAllowedEquipment()).extracting("sku").containsExactly("MON-001");
        verify(auditLogService).record(
            eq(AuditAction.UPDATE),
            eq(StandingContract.class.getSimpleName()),
            eq(30L),
            eq("Updated allowed equipment for standing contract CON-001")
        );
    }

    private CreateStandingContractRequest createRequest() {
        CreateStandingContractRequest request = new CreateStandingContractRequest();
        request.setContractNumber("CON-001");
        request.setAgencyId(10L);
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusDays(60));
        request.setCostLimit(BigDecimal.valueOf(10000));
        request.setAllowedEquipmentIds(List.of(20L));
        return request;
    }

    private StandingContract contract() {
        StandingContract contract = new StandingContract();
        contract.setId(30L);
        contract.setContractNumber("CON-001");
        contract.setAgency(activeAgency());
        contract.setStartDate(LocalDate.now());
        contract.setEndDate(LocalDate.now().plusDays(60));
        contract.setCostLimit(BigDecimal.valueOf(10000));
        contract.setStatus(ContractStatus.VALID);
        contract.setAllowedEquipment(new java.util.LinkedHashSet<>(List.of(equipment(20L, "LAP-001"))));
        return contract;
    }

    private FederalAgency activeAgency() {
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

    private Equipment equipment(Long id, String sku) {
        Equipment equipment = new Equipment();
        equipment.setId(id);
        equipment.setSku(sku);
        equipment.setName("Equipment " + sku);
        equipment.setManufacturer("Dell");
        equipment.setUnitPrice(BigDecimal.valueOf(1200));
        equipment.setAvailableStock(10);
        equipment.setMinimumStockLevel(3);
        equipment.setActive(true);
        return equipment;
    }
}
