package com.httt.gsc_order_manager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.httt.gsc_order_manager.dto.purchaseorder.CreatePurchaseOrderRequest;
import com.httt.gsc_order_manager.dto.purchaseorder.PurchaseOrderItemRequest;
import com.httt.gsc_order_manager.dto.purchaseorder.PurchaseOrderResponse;
import com.httt.gsc_order_manager.entity.Equipment;
import com.httt.gsc_order_manager.entity.FederalAgency;
import com.httt.gsc_order_manager.entity.PurchaseOrder;
import com.httt.gsc_order_manager.entity.PurchaseOrderItem;
import com.httt.gsc_order_manager.entity.StandingContract;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.ContractStatus;
import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import com.httt.gsc_order_manager.repository.EquipmentRepository;
import com.httt.gsc_order_manager.repository.PurchaseOrderRepository;
import com.httt.gsc_order_manager.repository.StandingContractRepository;
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
class PurchaseOrderServiceTest {

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private StandingContractRepository standingContractRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private PurchaseOrderService purchaseOrderService;

    @Test
    void createCreatesPendingPurchaseOrderAndWritesAuditLog() {
        CreatePurchaseOrderRequest request = createRequest(20L, 2);
        Equipment equipment = equipment(20L, "LAP-001", 1200);
        when(purchaseOrderRepository.existsByPoNumberIgnoreCase("PO-001")).thenReturn(false);
        when(standingContractRepository.findById(30L)).thenReturn(Optional.of(contract(List.of(equipment), 10000)));
        when(equipmentRepository.findAllById(any())).thenReturn(List.of(equipment));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> {
            PurchaseOrder purchaseOrder = invocation.getArgument(0);
            purchaseOrder.setId(40L);
            return purchaseOrder;
        });

        PurchaseOrderResponse response = purchaseOrderService.create(request);

        assertThat(response.getId()).isEqualTo(40L);
        assertThat(response.getPoNumber()).isEqualTo("PO-001");
        assertThat(response.getStatus()).isEqualTo(PurchaseOrderStatus.PENDING);
        assertThat(response.getTotalAmount()).isEqualByComparingTo("2400");
        assertThat(response.getItems()).hasSize(1);
        verify(auditLogService).record(
            eq(AuditAction.CREATE),
            eq(PurchaseOrder.class.getSimpleName()),
            eq(40L),
            eq("Created purchase order PO-001")
        );
    }

    @Test
    void createRejectsDuplicatePoNumber() {
        CreatePurchaseOrderRequest request = createRequest(20L, 2);
        when(purchaseOrderRepository.existsByPoNumberIgnoreCase("PO-001")).thenReturn(true);

        assertThatThrownBy(() -> purchaseOrderService.create(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Purchase order number already exists");
    }

    @Test
    void validateMarksOrderOutstandingWhenContractRulesPass() {
        Equipment equipment = equipment(20L, "LAP-001", 1200);
        PurchaseOrder purchaseOrder = purchaseOrder(contract(List.of(equipment), 10000), List.of(item(equipment, 2)));
        when(purchaseOrderRepository.findById(40L)).thenReturn(Optional.of(purchaseOrder));

        PurchaseOrderResponse response = purchaseOrderService.validate(40L);

        assertThat(response.getStatus()).isEqualTo(PurchaseOrderStatus.OUTSTANDING);
        assertThat(response.getValidationReason()).isNull();
        assertThat(response.getValidatedAt()).isNotNull();
        verify(auditLogService).record(
            eq(AuditAction.VALIDATE_PO),
            eq(PurchaseOrder.class.getSimpleName()),
            eq(40L),
            eq("Validated purchase order PO-001")
        );
    }

    @Test
    void validateMarksOrderInvalidWhenTotalExceedsContractLimit() {
        Equipment equipment = equipment(20L, "LAP-001", 1200);
        PurchaseOrder purchaseOrder = purchaseOrder(contract(List.of(equipment), 1000), List.of(item(equipment, 2)));
        when(purchaseOrderRepository.findById(40L)).thenReturn(Optional.of(purchaseOrder));

        PurchaseOrderResponse response = purchaseOrderService.validate(40L);

        assertThat(response.getStatus()).isEqualTo(PurchaseOrderStatus.INVALID);
        assertThat(response.getValidationReason()).contains("Total amount exceeds contract cost limit");
    }

    @Test
    void validateMarksOrderInvalidWhenEquipmentIsNotAllowed() {
        Equipment allowedEquipment = equipment(20L, "LAP-001", 1200);
        Equipment orderedEquipment = equipment(21L, "MON-001", 300);
        PurchaseOrder purchaseOrder = purchaseOrder(
            contract(List.of(allowedEquipment), 10000),
            List.of(item(orderedEquipment, 2))
        );
        when(purchaseOrderRepository.findById(40L)).thenReturn(Optional.of(purchaseOrder));

        PurchaseOrderResponse response = purchaseOrderService.validate(40L);

        assertThat(response.getStatus()).isEqualTo(PurchaseOrderStatus.INVALID);
        assertThat(response.getValidationReason()).contains("Equipment is not allowed by contract: MON-001");
    }

    private CreatePurchaseOrderRequest createRequest(Long equipmentId, int quantity) {
        PurchaseOrderItemRequest item = new PurchaseOrderItemRequest();
        item.setEquipmentId(equipmentId);
        item.setQuantity(quantity);

        CreatePurchaseOrderRequest request = new CreatePurchaseOrderRequest();
        request.setPoNumber("PO-001");
        request.setContractId(30L);
        request.setIssueDate(LocalDate.now());
        request.setItems(List.of(item));
        return request;
    }

    private PurchaseOrder purchaseOrder(StandingContract contract, List<PurchaseOrderItem> items) {
        PurchaseOrder purchaseOrder = new PurchaseOrder();
        purchaseOrder.setId(40L);
        purchaseOrder.setPoNumber("PO-001");
        purchaseOrder.setContract(contract);
        purchaseOrder.setIssueDate(LocalDate.now());
        purchaseOrder.setStatus(PurchaseOrderStatus.PENDING);
        purchaseOrder.setItems(new java.util.ArrayList<>());
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (PurchaseOrderItem item : items) {
            item.setPurchaseOrder(purchaseOrder);
            purchaseOrder.getItems().add(item);
            totalAmount = totalAmount.add(item.getLineTotal());
        }
        purchaseOrder.setTotalAmount(totalAmount);
        return purchaseOrder;
    }

    private PurchaseOrderItem item(Equipment equipment, int quantity) {
        BigDecimal lineTotal = equipment.getUnitPrice().multiply(BigDecimal.valueOf(quantity));
        PurchaseOrderItem item = new PurchaseOrderItem();
        item.setEquipment(equipment);
        item.setQuantity(quantity);
        item.setUnitPrice(equipment.getUnitPrice());
        item.setLineTotal(lineTotal);
        return item;
    }

    private StandingContract contract(List<Equipment> allowedEquipment, int costLimit) {
        StandingContract contract = new StandingContract();
        contract.setId(30L);
        contract.setContractNumber("CON-001");
        contract.setAgency(agency());
        contract.setStartDate(LocalDate.now().minusDays(1));
        contract.setEndDate(LocalDate.now().plusDays(30));
        contract.setCostLimit(BigDecimal.valueOf(costLimit));
        contract.setStatus(ContractStatus.VALID);
        contract.setAllowedEquipment(new LinkedHashSet<>(allowedEquipment));
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

    private Equipment equipment(Long id, String sku, int unitPrice) {
        Equipment equipment = new Equipment();
        equipment.setId(id);
        equipment.setSku(sku);
        equipment.setName("Equipment " + sku);
        equipment.setManufacturer("Dell");
        equipment.setUnitPrice(BigDecimal.valueOf(unitPrice));
        equipment.setAvailableStock(10);
        equipment.setMinimumStockLevel(3);
        equipment.setActive(true);
        return equipment;
    }
}
