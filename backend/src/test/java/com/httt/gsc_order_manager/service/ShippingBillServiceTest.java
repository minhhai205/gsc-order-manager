package com.httt.gsc_order_manager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.httt.gsc_order_manager.dto.shippingbill.CreateShippingBillRequest;
import com.httt.gsc_order_manager.dto.shippingbill.ShippingBillItemRequest;
import com.httt.gsc_order_manager.dto.shippingbill.ShippingBillResponse;
import com.httt.gsc_order_manager.entity.Equipment;
import com.httt.gsc_order_manager.entity.ExceptionReport;
import com.httt.gsc_order_manager.entity.ExceptionReportItem;
import com.httt.gsc_order_manager.entity.FederalAgency;
import com.httt.gsc_order_manager.entity.PurchaseOrder;
import com.httt.gsc_order_manager.entity.PurchaseOrderItem;
import com.httt.gsc_order_manager.entity.ShippingBill;
import com.httt.gsc_order_manager.entity.ShippingBillItem;
import com.httt.gsc_order_manager.entity.StandingContract;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.ContractStatus;
import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import com.httt.gsc_order_manager.entity.enums.ShippingStatus;
import com.httt.gsc_order_manager.repository.PurchaseOrderRepository;
import com.httt.gsc_order_manager.repository.ExceptionReportRepository;
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
class ShippingBillServiceTest {

    @Mock
    private ShippingBillRepository shippingBillRepository;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private ExceptionReportRepository exceptionReportRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private SimplePdfService simplePdfService;

    @InjectMocks
    private ShippingBillService shippingBillService;

    @Test
    void createCreatesDraftShippingBillForReadyToShipPurchaseOrder() {
        Equipment equipment = equipment(20L, "LAP-001", 5);
        PurchaseOrder purchaseOrder = purchaseOrder(PurchaseOrderStatus.READY_TO_SHIP, equipment, 3);
        when(shippingBillRepository.existsByPurchaseOrderId(40L)).thenReturn(false);
        when(purchaseOrderRepository.findById(40L)).thenReturn(Optional.of(purchaseOrder));
        when(exceptionReportRepository.findByPurchaseOrderId(40L)).thenReturn(Optional.empty());
        when(shippingBillRepository.save(any(ShippingBill.class))).thenAnswer(invocation -> {
            ShippingBill bill = invocation.getArgument(0);
            bill.setId(70L);
            return bill;
        });

        ShippingBillResponse response = shippingBillService.create(40L, createRequest(20L, 2));

        assertThat(response.getShippingBillNumber()).isEqualTo("SB-PO-001");
        assertThat(response.getStatus()).isEqualTo(ShippingStatus.DRAFT);
        assertThat(response.getItems()).extracting("shippedQuantity").containsExactly(2);
        verify(auditLogService).record(
            eq(AuditAction.ISSUE_SHIPPING_BILL),
            eq(ShippingBill.class.getSimpleName()),
            eq(70L),
            eq("Created shipping bill SB-PO-001")
        );
    }

    @Test
    void createRejectsPurchaseOrderThatIsNotReadyToShip() {
        when(shippingBillRepository.existsByPurchaseOrderId(40L)).thenReturn(false);
        when(purchaseOrderRepository.findById(40L))
            .thenReturn(Optional.of(purchaseOrder(PurchaseOrderStatus.INVENTORY_CHECKED, equipment(20L, "LAP-001", 5), 3)));

        assertThatThrownBy(() -> shippingBillService.create(40L, createRequest(20L, 2)))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Purchase order must be ready to ship before creating shipping bill");
    }

    @Test
    void createRejectsShippedQuantityGreaterThanAvailableQuantityFromExceptionReport() {
        Equipment equipment = equipment(20L, "LAP-001", 5);
        PurchaseOrder purchaseOrder = purchaseOrder(PurchaseOrderStatus.READY_TO_SHIP, equipment, 3);
        when(shippingBillRepository.existsByPurchaseOrderId(40L)).thenReturn(false);
        when(purchaseOrderRepository.findById(40L)).thenReturn(Optional.of(purchaseOrder));
        when(exceptionReportRepository.findByPurchaseOrderId(40L))
            .thenReturn(Optional.of(exceptionReport(purchaseOrder, equipment, 3, 1, 2)));

        assertThatThrownBy(() -> shippingBillService.create(40L, createRequest(20L, 2)))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Shipped quantity cannot exceed available quantity for equipment LAP-001");
    }

    @Test
    void confirmDeductsStockAndKeepsPurchaseOrderReadyToShip() {
        Equipment equipment = equipment(20L, "LAP-001", 5);
        PurchaseOrder purchaseOrder = purchaseOrder(PurchaseOrderStatus.READY_TO_SHIP, equipment, 3);
        ShippingBill bill = shippingBill(purchaseOrder, equipment, 2, ShippingStatus.DRAFT);
        when(shippingBillRepository.findById(70L)).thenReturn(Optional.of(bill));

        ShippingBillResponse response = shippingBillService.confirm(70L);

        assertThat(response.getStatus()).isEqualTo(ShippingStatus.IN_TRANSIT);
        assertThat(equipment.getAvailableStock()).isEqualTo(3);
        assertThat(purchaseOrder.getStatus()).isEqualTo(PurchaseOrderStatus.READY_TO_SHIP);
        verify(auditLogService).record(
            eq(AuditAction.ISSUE_SHIPPING_BILL),
            eq(ShippingBill.class.getSimpleName()),
            eq(70L),
            eq("Confirmed shipping bill SB-PO-001")
        );
    }

    @Test
    void updateStatusToDeliveredMarksPurchaseOrderShipped() {
        Equipment equipment = equipment(20L, "LAP-001", 5);
        PurchaseOrder purchaseOrder = purchaseOrder(PurchaseOrderStatus.READY_TO_SHIP, equipment, 3);
        ShippingBill bill = shippingBill(purchaseOrder, equipment, 2, ShippingStatus.IN_TRANSIT);
        when(shippingBillRepository.findById(70L)).thenReturn(Optional.of(bill));

        com.httt.gsc_order_manager.dto.shippingbill.UpdateShippingStatusRequest request =
            new com.httt.gsc_order_manager.dto.shippingbill.UpdateShippingStatusRequest();
        request.setStatus(ShippingStatus.DELIVERED);

        ShippingBillResponse response = shippingBillService.updateStatus(70L, request);

        assertThat(response.getStatus()).isEqualTo(ShippingStatus.DELIVERED);
        assertThat(purchaseOrder.getStatus()).isEqualTo(PurchaseOrderStatus.SHIPPED);
        verify(auditLogService).record(
            eq(AuditAction.UPDATE),
            eq(ShippingBill.class.getSimpleName()),
            eq(70L),
            eq("Updated shipping bill status SB-PO-001")
        );
    }

    private CreateShippingBillRequest createRequest(Long equipmentId, int shippedQuantity) {
        ShippingBillItemRequest item = new ShippingBillItemRequest();
        item.setEquipmentId(equipmentId);
        item.setShippedQuantity(shippedQuantity);
        CreateShippingBillRequest request = new CreateShippingBillRequest();
        request.setShippingDate(LocalDate.now());
        request.setDestinationAddress("1800 F Street NW");
        request.setItems(List.of(item));
        return request;
    }

    private ShippingBill shippingBill(PurchaseOrder purchaseOrder, Equipment equipment, int shippedQuantity, ShippingStatus status) {
        ShippingBill bill = new ShippingBill();
        bill.setId(70L);
        bill.setShippingBillNumber("SB-PO-001");
        bill.setPurchaseOrder(purchaseOrder);
        bill.setShippingDate(LocalDate.now());
        bill.setDestinationAddress("1800 F Street NW");
        bill.setStatus(status);
        bill.getItems().add(shippingItem(bill, equipment, shippedQuantity));
        return bill;
    }

    private ShippingBillItem shippingItem(ShippingBill bill, Equipment equipment, int shippedQuantity) {
        ShippingBillItem item = new ShippingBillItem();
        item.setShippingBill(bill);
        item.setEquipment(equipment);
        item.setShippedQuantity(shippedQuantity);
        return item;
    }

    private ExceptionReport exceptionReport(
        PurchaseOrder purchaseOrder,
        Equipment equipment,
        int requestedQuantity,
        int availableQuantity,
        int shortageQuantity
    ) {
        ExceptionReport report = new ExceptionReport();
        report.setId(60L);
        report.setReportNumber("ER-PO-001");
        report.setPurchaseOrder(purchaseOrder);
        ExceptionReportItem item = new ExceptionReportItem();
        item.setExceptionReport(report);
        item.setEquipment(equipment);
        item.setRequestedQuantity(requestedQuantity);
        item.setAvailableQuantity(availableQuantity);
        item.setShortageQuantity(shortageQuantity);
        report.getItems().add(item);
        return report;
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
