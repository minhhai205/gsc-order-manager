package com.httt.gsc_order_manager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.httt.gsc_order_manager.dto.purchaseorder.PurchaseOrderResponse;
import com.httt.gsc_order_manager.entity.Equipment;
import com.httt.gsc_order_manager.entity.FederalAgency;
import com.httt.gsc_order_manager.entity.PurchaseOrder;
import com.httt.gsc_order_manager.entity.PurchaseOrderItem;
import com.httt.gsc_order_manager.entity.ShippingBill;
import com.httt.gsc_order_manager.entity.StandingContract;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.ContractStatus;
import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import com.httt.gsc_order_manager.entity.enums.ShippingStatus;
import com.httt.gsc_order_manager.repository.PurchaseOrderRepository;
import com.httt.gsc_order_manager.repository.ShippingBillRepository;
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
class ClosePurchaseOrderServiceTest {

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private ShippingBillRepository shippingBillRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ClosePurchaseOrderService closePurchaseOrderService;

    @Test
    void closeClosesPurchaseOrderWhenShippingHasBeenDelivered() {
        Equipment equipment = equipment(20L, "LAP-001", 5);
        PurchaseOrder purchaseOrder = purchaseOrder(PurchaseOrderStatus.SHIPPED, equipment, 3);
        when(purchaseOrderRepository.findById(40L)).thenReturn(Optional.of(purchaseOrder));
        when(shippingBillRepository.findByPurchaseOrderId(40L))
            .thenReturn(Optional.of(shippingBill(purchaseOrder, ShippingStatus.DELIVERED)));

        PurchaseOrderResponse response = closePurchaseOrderService.close(40L);

        assertThat(response.getStatus()).isEqualTo(PurchaseOrderStatus.CLOSED);
        assertThat(response.getArchiveCode()).isEqualTo("ARCH-PO-001");
        assertThat(response.getClosedAt()).isNotNull();
        verify(auditLogService).record(
            eq(AuditAction.CLOSE_PURCHASE_ORDER),
            eq(PurchaseOrder.class.getSimpleName()),
            eq(40L),
            eq("Closed purchase order PO-001")
        );
    }

    @Test
    void closeRejectsShippingBillThatIsNotDelivered() {
        Equipment equipment = equipment(20L, "LAP-001", 5);
        PurchaseOrder purchaseOrder = purchaseOrder(PurchaseOrderStatus.READY_TO_SHIP, equipment, 3);
        when(purchaseOrderRepository.findById(40L)).thenReturn(Optional.of(purchaseOrder));
        when(shippingBillRepository.findByPurchaseOrderId(40L))
            .thenReturn(Optional.of(shippingBill(purchaseOrder, ShippingStatus.IN_TRANSIT)));

        assertThatThrownBy(() -> closePurchaseOrderService.close(40L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Purchase order cannot be closed before shipping is delivered");
    }

    @Test
    void archiveRejectsPurchaseOrderThatIsNotClosed() {
        when(purchaseOrderRepository.findById(40L))
            .thenReturn(Optional.of(purchaseOrder(PurchaseOrderStatus.SHIPPED, equipment(20L, "LAP-001", 5), 3)));

        assertThatThrownBy(() -> closePurchaseOrderService.archive(40L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Purchase order is not closed");
    }

    private ShippingBill shippingBill(PurchaseOrder purchaseOrder, ShippingStatus status) {
        ShippingBill bill = new ShippingBill();
        bill.setId(70L);
        bill.setShippingBillNumber("SB-PO-001");
        bill.setPurchaseOrder(purchaseOrder);
        bill.setShippingDate(LocalDate.now());
        bill.setDestinationAddress("1800 F Street NW");
        bill.setStatus(status);
        return bill;
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
