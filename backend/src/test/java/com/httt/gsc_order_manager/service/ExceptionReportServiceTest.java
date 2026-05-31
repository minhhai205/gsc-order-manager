package com.httt.gsc_order_manager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.httt.gsc_order_manager.dto.exceptionreport.ExceptionReportResponse;
import com.httt.gsc_order_manager.entity.Equipment;
import com.httt.gsc_order_manager.entity.ExceptionReport;
import com.httt.gsc_order_manager.entity.FederalAgency;
import com.httt.gsc_order_manager.entity.PurchaseOrder;
import com.httt.gsc_order_manager.entity.PurchaseOrderItem;
import com.httt.gsc_order_manager.entity.StandingContract;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.ContractStatus;
import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import com.httt.gsc_order_manager.repository.ExceptionReportRepository;
import com.httt.gsc_order_manager.repository.PurchaseOrderRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ExceptionReportServiceTest {

    @Mock
    private ExceptionReportRepository exceptionReportRepository;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private SimplePdfService simplePdfService;

    @InjectMocks
    private ExceptionReportService exceptionReportService;

    @Test
    void createForPurchaseOrderCreatesReportForShortageItems() {
        PurchaseOrder purchaseOrder = purchaseOrder(PurchaseOrderStatus.INVENTORY_CHECKED, equipment(20L, "LAP-001", 1), 3);
        when(purchaseOrderRepository.findById(40L)).thenReturn(Optional.of(purchaseOrder));
        when(exceptionReportRepository.findByPurchaseOrderId(40L)).thenReturn(Optional.empty());
        when(exceptionReportRepository.save(any(ExceptionReport.class))).thenAnswer(invocation -> {
            ExceptionReport report = invocation.getArgument(0);
            report.setId(60L);
            return report;
        });

        ExceptionReportResponse response = exceptionReportService.createForPurchaseOrder(40L);

        assertThat(response.getReportNumber()).isEqualTo("ER-PO-001");
        assertThat(response.getItems()).extracting("shortageQuantity").containsExactly(2);
        assertThat(purchaseOrder.getStatus()).isEqualTo(PurchaseOrderStatus.READY_TO_SHIP);
        verify(auditLogService).record(
            eq(AuditAction.CREATE_EXCEPTION_REPORT),
            eq(ExceptionReport.class.getSimpleName()),
            eq(60L),
            eq("Created exception report ER-PO-001")
        );
    }

    @Test
    void createForPurchaseOrderRejectsWhenThereAreNoShortageItems() {
        PurchaseOrder purchaseOrder = purchaseOrder(PurchaseOrderStatus.INVENTORY_CHECKED, equipment(20L, "LAP-001", 10), 3);
        when(purchaseOrderRepository.findById(40L)).thenReturn(Optional.of(purchaseOrder));
        when(exceptionReportRepository.findByPurchaseOrderId(40L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> exceptionReportService.createForPurchaseOrder(40L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Purchase order has no shortage items");
    }

    private PurchaseOrder purchaseOrder(PurchaseOrderStatus status, Equipment equipment, int requestedQuantity) {
        StandingContract contract = contract(equipment);
        PurchaseOrder purchaseOrder = new PurchaseOrder();
        purchaseOrder.setId(40L);
        purchaseOrder.setPoNumber("PO-001");
        purchaseOrder.setContract(contract);
        purchaseOrder.setIssueDate(LocalDate.now());
        purchaseOrder.setStatus(status);
        purchaseOrder.setItems(new java.util.ArrayList<>());
        purchaseOrder.getItems().add(item(purchaseOrder, equipment, requestedQuantity));
        purchaseOrder.setTotalAmount(BigDecimal.valueOf(1200L * requestedQuantity));
        return purchaseOrder;
    }

    private PurchaseOrderItem item(PurchaseOrder purchaseOrder, Equipment equipment, int requestedQuantity) {
        PurchaseOrderItem item = new PurchaseOrderItem();
        item.setPurchaseOrder(purchaseOrder);
        item.setEquipment(equipment);
        item.setQuantity(requestedQuantity);
        item.setUnitPrice(equipment.getUnitPrice());
        item.setLineTotal(equipment.getUnitPrice().multiply(BigDecimal.valueOf(requestedQuantity)));
        return item;
    }

    private StandingContract contract(Equipment equipment) {
        StandingContract contract = new StandingContract();
        contract.setId(30L);
        contract.setContractNumber("CON-001");
        contract.setAgency(agency());
        contract.setStartDate(LocalDate.now().minusDays(1));
        contract.setEndDate(LocalDate.now().plusDays(30));
        contract.setCostLimit(BigDecimal.valueOf(10000));
        contract.setStatus(ContractStatus.VALID);
        contract.setAllowedEquipment(new LinkedHashSet<>(List.of(equipment)));
        return contract;
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

    private Equipment equipment(Long id, String sku, int availableStock) {
        Equipment equipment = new Equipment();
        equipment.setId(id);
        equipment.setSku(sku);
        equipment.setName("Equipment " + sku);
        equipment.setManufacturer("Dell");
        equipment.setUnitPrice(BigDecimal.valueOf(1200));
        equipment.setAvailableStock(availableStock);
        equipment.setMinimumStockLevel(3);
        equipment.setActive(true);
        return equipment;
    }
}
