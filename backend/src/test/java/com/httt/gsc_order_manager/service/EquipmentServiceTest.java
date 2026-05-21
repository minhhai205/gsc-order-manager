package com.httt.gsc_order_manager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.httt.gsc_order_manager.dto.equipment.CreateEquipmentRequest;
import com.httt.gsc_order_manager.dto.equipment.EquipmentResponse;
import com.httt.gsc_order_manager.dto.equipment.StockAdjustmentRequest;
import com.httt.gsc_order_manager.entity.Equipment;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.StockOperation;
import com.httt.gsc_order_manager.repository.EquipmentRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EquipmentServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private EquipmentService equipmentService;

    @Test
    void createCreatesActiveEquipmentAndWritesAuditLog() {
        CreateEquipmentRequest request = createEquipmentRequest();
        when(equipmentRepository.existsBySkuIgnoreCase("LAP-001")).thenReturn(false);
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> {
            Equipment equipment = invocation.getArgument(0);
            equipment.setId(20L);
            return equipment;
        });

        EquipmentResponse response = equipmentService.create(request);

        assertThat(response.getId()).isEqualTo(20L);
        assertThat(response.getSku()).isEqualTo("LAP-001");
        assertThat(response.isActive()).isTrue();
        verify(auditLogService).record(
            eq(AuditAction.CREATE),
            eq(Equipment.class.getSimpleName()),
            eq(20L),
            eq("Created equipment LAP-001")
        );
    }

    @Test
    void createRejectsDuplicateSku() {
        CreateEquipmentRequest request = createEquipmentRequest();
        when(equipmentRepository.existsBySkuIgnoreCase("LAP-001")).thenReturn(true);

        assertThatThrownBy(() -> equipmentService.create(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Equipment SKU already exists");
    }

    @Test
    void adjustStockIncreasesAvailableStock() {
        Equipment equipment = equipment();
        StockAdjustmentRequest request = stockAdjustmentRequest(5, StockOperation.INCREASE);
        when(equipmentRepository.findById(20L)).thenReturn(Optional.of(equipment));

        EquipmentResponse response = equipmentService.adjustStock(20L, request);

        assertThat(response.getAvailableStock()).isEqualTo(15);
        verify(auditLogService).record(
            eq(AuditAction.UPDATE),
            eq(Equipment.class.getSimpleName()),
            eq(20L),
            eq("Adjusted stock for equipment LAP-001")
        );
    }

    @Test
    void adjustStockRejectsNegativeResult() {
        Equipment equipment = equipment();
        StockAdjustmentRequest request = stockAdjustmentRequest(11, StockOperation.DECREASE);
        when(equipmentRepository.findById(20L)).thenReturn(Optional.of(equipment));

        assertThatThrownBy(() -> equipmentService.adjustStock(20L, request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Available stock cannot be negative");
    }

    private CreateEquipmentRequest createEquipmentRequest() {
        CreateEquipmentRequest request = new CreateEquipmentRequest();
        request.setSku("LAP-001");
        request.setName("Laptop");
        request.setManufacturer("Dell");
        request.setUnitPrice(BigDecimal.valueOf(1200));
        request.setAvailableStock(10);
        request.setMinimumStockLevel(3);
        return request;
    }

    private StockAdjustmentRequest stockAdjustmentRequest(int quantity, StockOperation operation) {
        StockAdjustmentRequest request = new StockAdjustmentRequest();
        request.setQuantity(quantity);
        request.setOperation(operation);
        return request;
    }

    private Equipment equipment() {
        Equipment equipment = new Equipment();
        equipment.setId(20L);
        equipment.setSku("LAP-001");
        equipment.setName("Laptop");
        equipment.setManufacturer("Dell");
        equipment.setUnitPrice(BigDecimal.valueOf(1200));
        equipment.setAvailableStock(10);
        equipment.setMinimumStockLevel(3);
        equipment.setActive(true);
        return equipment;
    }
}
