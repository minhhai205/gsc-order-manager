package com.httt.gsc_order_manager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.httt.gsc_order_manager.dto.rejectionletter.RejectionLetterResponse;
import com.httt.gsc_order_manager.entity.FederalAgency;
import com.httt.gsc_order_manager.entity.PurchaseOrder;
import com.httt.gsc_order_manager.entity.RejectionLetter;
import com.httt.gsc_order_manager.entity.StandingContract;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import com.httt.gsc_order_manager.entity.enums.RejectionLetterStatus;
import com.httt.gsc_order_manager.repository.PurchaseOrderRepository;
import com.httt.gsc_order_manager.repository.RejectionLetterRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RejectionLetterServiceTest {

    @Mock
    private RejectionLetterRepository rejectionLetterRepository;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private SimplePdfService simplePdfService;

    @InjectMocks
    private RejectionLetterService rejectionLetterService;

    @Test
    void createForPurchaseOrderCreatesDraftLetterForInvalidPurchaseOrder() {
        PurchaseOrder purchaseOrder = purchaseOrder(PurchaseOrderStatus.INVALID);
        purchaseOrder.setValidationReason("Contract has expired");
        when(rejectionLetterRepository.existsByPurchaseOrderId(40L)).thenReturn(false);
        when(purchaseOrderRepository.findById(40L)).thenReturn(Optional.of(purchaseOrder));
        when(rejectionLetterRepository.save(any(RejectionLetter.class))).thenAnswer(invocation -> {
            RejectionLetter letter = invocation.getArgument(0);
            letter.setId(50L);
            return letter;
        });

        RejectionLetterResponse response = rejectionLetterService.createForPurchaseOrder(40L);

        assertThat(response.getId()).isEqualTo(50L);
        assertThat(response.getLetterNumber()).isEqualTo("RL-PO-001");
        assertThat(response.getStatus()).isEqualTo(RejectionLetterStatus.DRAFT);
        assertThat(response.getReason()).isEqualTo("Contract has expired");
        verify(auditLogService).record(
            eq(AuditAction.CREATE),
            eq(RejectionLetter.class.getSimpleName()),
            eq(50L),
            eq("Created rejection letter RL-PO-001")
        );
    }

    @Test
    void createForPurchaseOrderRejectsNonInvalidPurchaseOrder() {
        when(rejectionLetterRepository.existsByPurchaseOrderId(40L)).thenReturn(false);
        when(purchaseOrderRepository.findById(40L)).thenReturn(Optional.of(purchaseOrder(PurchaseOrderStatus.OUTSTANDING)));

        assertThatThrownBy(() -> rejectionLetterService.createForPurchaseOrder(40L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Rejection letter can only be created for invalid purchase orders");
    }

    @Test
    void issueMarksLetterIssued() {
        RejectionLetter letter = rejectionLetter();
        when(rejectionLetterRepository.findById(50L)).thenReturn(Optional.of(letter));

        RejectionLetterResponse response = rejectionLetterService.issue(50L);

        assertThat(response.getStatus()).isEqualTo(RejectionLetterStatus.ISSUED);
        assertThat(response.getIssuedAt()).isNotNull();
        verify(auditLogService).record(
            eq(AuditAction.ISSUE_REJECTION_LETTER),
            eq(RejectionLetter.class.getSimpleName()),
            eq(50L),
            eq("Issued rejection letter RL-PO-001")
        );
    }

    private RejectionLetter rejectionLetter() {
        RejectionLetter letter = new RejectionLetter();
        letter.setId(50L);
        letter.setLetterNumber("RL-PO-001");
        letter.setPurchaseOrder(purchaseOrder(PurchaseOrderStatus.INVALID));
        letter.setAgency(agency());
        letter.setReason("Contract has expired");
        letter.setContent("Rejected");
        letter.setStatus(RejectionLetterStatus.DRAFT);
        return letter;
    }

    private PurchaseOrder purchaseOrder(PurchaseOrderStatus status) {
        PurchaseOrder purchaseOrder = new PurchaseOrder();
        purchaseOrder.setId(40L);
        purchaseOrder.setPoNumber("PO-001");
        purchaseOrder.setContract(contract());
        purchaseOrder.setStatus(status);
        return purchaseOrder;
    }

    private StandingContract contract() {
        StandingContract contract = new StandingContract();
        contract.setId(30L);
        contract.setContractNumber("CON-001");
        contract.setAgency(agency());
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
}
